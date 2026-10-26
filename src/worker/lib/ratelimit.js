import { readJson, writeJson } from './kv.js';

/**
 * KV 近似限流。EdgeKV 是最终一致的，计数存在少量漂移，
 * 用于挡住脚本暴力尝试足够，不用于精确计费。
 *
 * @param {object} env
 * @param {string} bucket 维度名，例如 login / contact
 * @param {string} identity 通常是客户端 IP
 * @param {object} rule { limit, windowMs, blockMs }
 */
export async function rateLimit(env, bucket, identity, rule) {
  const now = Date.now();
  const slot = Math.floor(now / rule.windowMs);
  const key = `rl_${bucket}_${hashIdentity(identity)}_${slot}`;

  const rec = (await readJson(env, key)) || { n: 0, blockedUntil: 0 };

  if (rec.blockedUntil && rec.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((rec.blockedUntil - now) / 1000) };
  }

  rec.n = (rec.n || 0) + 1;

  if (rec.n > rule.limit) {
    rec.blockedUntil = now + (rule.blockMs || rule.windowMs);
    await writeJson(env, key, rec);
    return { allowed: false, retryAfter: Math.ceil((rule.blockMs || rule.windowMs) / 1000) };
  }

  await writeJson(env, key, rec);
  return { allowed: true, remaining: Math.max(0, rule.limit - rec.n) };
}

/** key 只允许字母数字下划线横线，这里用短哈希压缩 IP */
function hashIdentity(identity) {
  let h = 2166136261;
  const s = String(identity || 'unknown');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function clientIp(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    request.headers.get('X-Real-IP') ||
    'unknown'
  );
}

export const RULES = {
  login: { limit: 5, windowMs: 10 * 60 * 1000, blockMs: 10 * 60 * 1000 },
  contact: { limit: 10, windowMs: 60 * 60 * 1000, blockMs: 30 * 60 * 1000 },
  write: { limit: 120, windowMs: 60 * 1000, blockMs: 60 * 1000 },
};
