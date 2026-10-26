/**
 * 单管理员、单页面的场景下，整站数据放在一个 KV key 里。
 *
 * 这样每次请求只需要 1 次 KV 读，写入只需 1 次读（取 rev）+ 1 次写，
 * 远低于函数子请求上限，也避免了「索引 + 实体」的不一致问题。
 *
 * Key 命名受 EdgeKV 限制：只能字母、数字、`-`、`_`，因此用 site / rl_xxx。
 */
const SITE_KEY = 'site';

let kvInstance = null;

function kv(env) {
  if (!kvInstance) {
    kvInstance = new EdgeKV({ namespace: env.KV_NAMESPACE || 'movecar' });
  }
  return kvInstance;
}

export async function readJson(env, key) {
  const raw = await kv(env).get(key, { type: 'text' });
  if (raw === undefined || raw === null || raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeJson(env, key, value) {
  await kv(env).put(key, JSON.stringify(value));
}

export function emptySite(id) {
  return {
    id,
    title: '临时停车，需挪车请联系我',
    notice: '扫码后可一键呼叫，感谢配合',
    rev: 0,
    updatedAt: Date.now(),
    cars: [],
  };
}

export async function readSite(env) {
  return readJson(env, SITE_KEY);
}

export async function writeSite(env, site) {
  await writeJson(env, SITE_KEY, site);
}

/**
 * 带版本校验的写入。EdgeKV 没有 CAS，这里是「读-比-写」的尽力而为方案，
 * 仅用于防止同一管理员在多个标签页里互相覆盖，不承担高并发正确性。
 */
export async function saveSite(env, next, expectedRev) {
  const current = await readSite(env);

  if (current) {
    if (expectedRev !== undefined && expectedRev !== null && Number(expectedRev) !== current.rev) {
      return { ok: false, conflict: true };
    }
    next.rev = (current.rev || 0) + 1;
  } else {
    next.rev = 1;
  }

  next.updatedAt = Date.now();
  await writeSite(env, next);
  return { ok: true, site: next };
}

export function newPageId() {
  // 去掉容易混淆的 0/o/1/l/i，降低手工核对成本
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < bytes.length; i++) id += alphabet[bytes[i] % alphabet.length];
  return id;
}
