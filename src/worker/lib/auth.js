import { readJson, writeJson } from './kv.js';

const AUTH_KEY = 'auth_admin';
const COOKIE_NAME = 'mc_session';
const ITERATIONS = 120000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const enc = new TextEncoder();

function toB64Url(bytes) {
  let bin = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(str) {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2(password, saltBytes, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
    key,
    256
  );
  return new Uint8Array(bits);
}

async function hmac(secret, payload) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(payload)));
}

export async function getAuthRecord(env) {
  return readJson(env, AUTH_KEY);
}

export async function isInitialized(env) {
  return (await getAuthRecord(env)) !== null;
}

/** 首次设置密码；已存在则拒绝 */
export async function initPassword(env, password) {
  if (await isInitialized(env)) return false;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  await writeJson(env, AUTH_KEY, {
    alg: 'PBKDF2-SHA256',
    iter: ITERATIONS,
    salt: toB64Url(salt),
    hash: toB64Url(hash),
    ver: 1,
    updatedAt: Date.now(),
  });
  return true;
}

export async function verifyPassword(env, password) {
  const rec = await getAuthRecord(env);
  if (!rec) return { ok: false, reason: 'NOT_INITIALIZED' };
  const computed = await pbkdf2(password, fromB64Url(rec.salt), rec.iter);
  const expected = fromB64Url(rec.hash);
  return { ok: timingSafeEqual(computed, expected), ver: rec.ver };
}

export async function changePassword(env, password) {
  const rec = await getAuthRecord(env);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  const nextVer = (rec?.ver || 1) + 1;
  await writeJson(env, AUTH_KEY, {
    alg: 'PBKDF2-SHA256',
    iter: ITERATIONS,
    salt: toB64Url(salt),
    hash: toB64Url(hash),
    ver: nextVer,
    updatedAt: Date.now(),
  });
  return nextVer;
}

function secret(env) {
  return env.ADMIN_SECRET || 'dev-only-secret-change-me';
}

export async function issueSession(env, ver) {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS, ver, n: toB64Url(crypto.getRandomValues(new Uint8Array(8))) });
  const body = toB64Url(enc.encode(payload));
  const sig = toB64Url(await hmac(secret(env), body));
  return `${body}.${sig}`;
}

export async function readSession(env, request) {
  const raw = getCookie(request, COOKIE_NAME);
  if (!raw) return null;

  const [body, sig] = raw.split('.');
  if (!body || !sig) return null;

  const expected = toB64Url(await hmac(secret(env), body));
  if (!timingSafeEqual(fromB64Url(sig), fromB64Url(expected))) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromB64Url(body)));
  } catch {
    return null;
  }
  if (!payload.exp || payload.exp < Date.now()) return null;

  const rec = await getAuthRecord(env);
  if (!rec || rec.ver !== payload.ver) return null;   // 改密后旧会话立即失效

  return payload;
}

export function sessionCookie(env, value, { clear = false } = {}) {
  if (clear) {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
  }
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`;
}

export function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}
