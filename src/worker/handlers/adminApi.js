import { documentShell } from '../lib/layout.js';
import { renderLoginView, renderAdminBody } from '../views/admin.js';
import { ok, fail } from '../lib/http.js';
import {
  isInitialized,
  initPassword,
  verifyPassword,
  issueSession,
  sessionCookie,
  readSession,
  changePassword,
} from '../lib/auth.js';
import { rateLimit, clientIp, RULES } from '../lib/ratelimit.js';
import { validateCarPayload, validatePagePayload, newCarId } from '../lib/validate.js';
import { readSite, saveSite, emptySite, newPageId } from '../lib/kv.js';
import { CSS, ADMIN_JS } from '../generated/assets.js';

async function readBody(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return null;
  }
}

async function auth(env, request) {
  return readSession(env, request);
}

/** 读取站点数据，首次访问时自动创建 */
export async function ensureSite(env) {
  const site = await readSite(env);
  if (site) return site;

  const created = emptySite(newPageId());
  created.rev = 1;
  await saveSite(env, created, undefined);
  return created;
}

function pageUrl(request, id) {
  return `${new URL(request.url).origin}/p/${id}`;
}

export async function handleAdminPage(env, request) {
  const initialized = await isInitialized(env);

  // 未初始化 → 初始化表单；已初始化但未登录 → 登录表单；已登录 → 后台界面
  if (!initialized) {
    return documentShell({
      title: '初始化管理员',
      css: CSS,
      script: ADMIN_JS,
      bodyClass: 'admin-body',
      body: renderLoginView({ initialized: false }),
    });
  }

  const session = await readSession(env, request);
  if (!session) {
    return documentShell({
      title: '后台登录',
      css: CSS,
      script: ADMIN_JS,
      bodyClass: 'admin-body',
      body: renderLoginView({ initialized: true }),
    });
  }

  return documentShell({
    title: '挪车码后台',
    css: CSS,
    script: ADMIN_JS,
    bodyClass: 'admin-body',
    body: renderAdminBody(),
  });
}

export async function handleLogin(env, request) {
  const rl = await rateLimit(env, 'login', clientIp(request), RULES.login);
  if (!rl.allowed) return fail('RATE_LIMITED', `尝试过于频繁，请 ${rl.retryAfter} 秒后再试`, 429);

  const body = await readBody(request);
  if (!body || typeof body.password !== 'string') return fail('INVALID_INPUT', '参数错误');

  const result = await verifyPassword(env, body.password);
  if (!result.ok) {
    const message = result.reason === 'NOT_INITIALIZED' ? '尚未初始化，请先设置密码' : '密码错误';
    return fail('UNAUTHORIZED', message, 401);
  }

  const sid = await issueSession(env, result.ver);
  const res = ok({ loggedIn: true });
  res.headers.append('Set-Cookie', sessionCookie(env, sid));
  return res;
}

export async function handleInit(env, request) {
  const rl = await rateLimit(env, 'login', clientIp(request), RULES.login);
  if (!rl.allowed) return fail('RATE_LIMITED', `操作过于频繁，请 ${rl.retryAfter} 秒后再试`, 429);

  const body = await readBody(request);
  if (!body || typeof body.password !== 'string') return fail('INVALID_INPUT', '参数错误');
  if (body.password.length < 8) return fail('INVALID_INPUT', '密码至少 8 位');

  const created = await initPassword(env, body.password);
  if (!created) return fail('CONFLICT', '已初始化，无法重复设置', 409);

  await ensureSite(env);

  const result = await verifyPassword(env, body.password);
  const sid = await issueSession(env, result.ver);
  const res = ok({ initialized: true });
  res.headers.append('Set-Cookie', sessionCookie(env, sid));
  return res;
}

export async function handleLogout(env) {
  const res = ok({ loggedOut: true });
  res.headers.append('Set-Cookie', sessionCookie(env, '', { clear: true }));
  return res;
}

export async function handleSession(env, request) {
  if (!(await auth(env, request))) return fail('UNAUTHORIZED', '未登录', 401);

  // 后台需要看到全部车辆（含已停用），因此这里不过滤
  const site = await ensureSite(env);
  return ok({ site, pageUrl: pageUrl(request, site.id) });
}

export async function handleSavePage(env, request) {
  if (!(await auth(env, request))) return fail('UNAUTHORIZED', '未登录', 401);

  const body = await readBody(request);
  if (!body) return fail('INVALID_INPUT', '参数错误');

  const parsed = validatePagePayload(body);
  if (!parsed.ok) return fail('INVALID_INPUT', parsed.message);

  const site = await ensureSite(env);
  const written = await saveSite(
    env,
    { ...site, title: parsed.value.title, notice: parsed.value.notice },
    body.rev
  );
  if (!written.ok) return fail('REV_CONFLICT', '内容已被其他窗口修改，请刷新后重试', 409);
  return ok({ site: written.site });
}

export async function handleResetId(env, request) {
  if (!(await auth(env, request))) return fail('UNAUTHORIZED', '未登录', 401);

  const site = await ensureSite(env);
  const nextId = newPageId();
  const written = await saveSite(env, { ...site, id: nextId }, undefined);
  if (!written.ok) return fail('REV_CONFLICT', '重置失败，请重试', 409);

  return ok({ site: written.site, pageUrl: pageUrl(request, nextId) });
}

export async function handleSaveCar(env, request) {
  if (!(await auth(env, request))) return fail('UNAUTHORIZED', '未登录', 401);

  const rl = await rateLimit(env, 'write', clientIp(request), RULES.write);
  if (!rl.allowed) return fail('RATE_LIMITED', '操作过于频繁，请稍后再试', 429);

  const body = await readBody(request);
  if (!body) return fail('INVALID_INPUT', '参数错误');

  const parsed = validateCarPayload(body);
  if (!parsed.ok) return fail('INVALID_INPUT', parsed.message);

  const site = await ensureSite(env);
  const cars = Array.isArray(site.cars) ? site.cars.slice() : [];
  const id = body.id || newCarId();
  const index = cars.findIndex((c) => c.id === id);

  const car = {
    id,
    plate: parsed.value.plate,
    phones: parsed.value.phones,
    // 旧的单号码字段只作为兼容读取，新数据不再写入
    phone: undefined,
    enabled: body.enabled !== false,
    sort: index >= 0 ? cars[index].sort : cars.length + 1,
  };

  if (index >= 0) {
    const merged = { ...cars[index], ...car };
    delete merged.phone;
    cars[index] = merged;
  } else {
    delete car.phone;
    cars.push(car);
  }

  const written = await saveSite(env, { ...site, cars }, body.rev);
  if (!written.ok) return fail('REV_CONFLICT', '内容已被其他窗口修改，请刷新后重试', 409);

  return ok({ site: written.site, carId: id });
}

/** 快捷置顶：把某个号码设为该车的呼叫号码 */
export async function handleSetPrimaryPhone(env, request) {
  if (!(await auth(env, request))) return fail('UNAUTHORIZED', '未登录', 401);

  const body = await readBody(request);
  if (!body || typeof body.carId !== 'string' || typeof body.phoneId !== 'string') {
    return fail('INVALID_INPUT', '参数错误');
  }

  const site = await ensureSite(env);
  const cars = Array.isArray(site.cars) ? site.cars.slice() : [];
  const index = cars.findIndex((c) => c.id === body.carId);
  if (index < 0) return fail('NOT_FOUND', '车辆不存在', 404);

  const phones = Array.isArray(cars[index].phones) ? cars[index].phones.slice() : [];
  if (!phones.some((p) => p.id === body.phoneId)) return fail('NOT_FOUND', '号码不存在', 404);

  const next = phones.map((p) => ({ ...p, primary: p.id === body.phoneId }));
  cars[index] = { ...cars[index], phones: next };

  const written = await saveSite(env, { ...site, cars }, body.rev);
  if (!written.ok) return fail('REV_CONFLICT', '内容已被其他窗口修改，请刷新后重试', 409);
  return ok({ site: written.site });
}

export async function handleDeleteCar(env, request, url) {
  if (!(await auth(env, request))) return fail('UNAUTHORIZED', '未登录', 401);

  const id = url.searchParams.get('id');
  if (!id) return fail('INVALID_INPUT', '缺少车辆 ID');

  const site = await ensureSite(env);
  const before = Array.isArray(site.cars) ? site.cars : [];
  const cars = before.filter((c) => c.id !== id);
  if (cars.length === before.length) return fail('NOT_FOUND', '车辆不存在', 404);

  const written = await saveSite(env, { ...site, cars }, url.searchParams.get('rev'));
  if (!written.ok) return fail('REV_CONFLICT', '内容已被其他窗口修改，请刷新后重试', 409);
  return ok({ site: written.site });
}

/** 拖拽排序：按传入的 id 顺序重排 sort 字段 */
export async function handleReorderCars(env, request) {
  if (!(await auth(env, request))) return fail('UNAUTHORIZED', '未登录', 401);

  const body = await readBody(request);
  if (!body || !Array.isArray(body.ids)) return fail('INVALID_INPUT', '参数错误');

  const site = await ensureSite(env);
  const cars = Array.isArray(site.cars) ? site.cars : [];

  // 只接受已存在的 id，缺失的保持原有相对顺序追加到末尾，避免数据丢失
  const ids = body.ids.filter((id) => typeof id === 'string');
  const map = new Map(cars.map((c) => [c.id, c]));
  const ordered = [];
  for (const id of ids) {
    const car = map.get(id);
    if (car) {
      ordered.push(car);
      map.delete(id);
    }
  }
  for (const car of cars) {
    if (map.has(car.id)) ordered.push(car);
  }

  ordered.forEach((car, i) => {
    car.sort = i + 1;
  });

  const written = await saveSite(env, { ...site, cars: ordered }, body.rev);
  if (!written.ok) return fail('REV_CONFLICT', '内容已被其他窗口修改，请刷新后重试', 409);
  return ok({ site: written.site });
}

export async function handleChangePassword(env, request) {
  if (!(await auth(env, request))) return fail('UNAUTHORIZED', '未登录', 401);

  const body = await readBody(request);
  if (!body) return fail('INVALID_INPUT', '参数错误');

  const oldCheck = await verifyPassword(env, String(body.oldPassword || ''));
  if (!oldCheck.ok) return fail('UNAUTHORIZED', '当前密码不正确', 401);

  const next = String(body.newPassword || '');
  if (next.length < 8) return fail('INVALID_INPUT', '新密码至少 8 位');

  const ver = await changePassword(env, next);
  const sid = await issueSession(env, ver);
  const res = ok({ changed: true });
  res.headers.append('Set-Cookie', sessionCookie(env, sid));
  return res;
}
