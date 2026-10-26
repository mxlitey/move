import { ok, fail } from '../lib/http.js';
import { readSite } from '../lib/kv.js';
import { rateLimit, clientIp, RULES } from '../lib/ratelimit.js';
import { primaryPhone } from '../lib/validate.js';

async function readBody(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return null;
  }
}

/**
 * 扫码页取号接口。
 * 手机号绝不出现在页面 HTML 里，只有用户主动点击呼叫时才下发。
 */
export async function handleContact(env, request, pageId) {
  const rl = await rateLimit(env, 'contact', clientIp(request), RULES.contact);
  if (!rl.allowed) return fail('RATE_LIMITED', `请求过于频繁，请 ${rl.retryAfter} 秒后再试`, 429);

  const site = await readSite(env);
  if (!site || site.id !== pageId) return fail('NOT_FOUND', '挪车码无效', 404);

  const body = await readBody(request);
  if (!body || typeof body.carId !== 'string') return fail('INVALID_INPUT', '参数错误');

  const car = (site.cars || []).find((c) => c.id === body.carId);
  if (!car || car.enabled === false) return fail('NOT_FOUND', '车辆信息不存在', 404);

  // 扫码页只呼叫置顶号码，其余号码不对外暴露
  const phone = primaryPhone(car);
  if (!phone) return fail('NOT_FOUND', '该车辆未设置联系电话', 404);

  return ok({ phone, plate: car.plate });
}
