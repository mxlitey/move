const PHONE_RE = /^1[3-9]\d{9}$/;

/** 车牌：兼容普通、新能源（8 位）、含·或空格写法 */
const PLATE_RE = /^[\u4e00-\u9fa5][A-Z][A-Z0-9·\s]{4,8}$/;

export function normalizePhone(input) {
  return String(input || '').replace(/[\s-]/g, '');
}

export function validatePhone(input) {
  const value = normalizePhone(input);
  if (!PHONE_RE.test(value)) return { ok: false, message: '请输入正确的 11 位手机号' };
  return { ok: true, value };
}

export function normalizePlate(input) {
  return String(input || '').replace(/\s+/g, '').toUpperCase();
}

export function validatePlate(input) {
  const value = normalizePlate(input);
  if (value.length < 6 || value.length > 9) return { ok: false, message: '请输入正确的车牌号' };
  if (!PLATE_RE.test(value)) return { ok: false, message: '请输入正确的车牌号' };
  return { ok: true, value };
}

export function cleanText(input, max = 40) {
  return String(input || '')
    .replace(/[\u0000-\u001f<>]/g, '')
    .trim()
    .slice(0, max);
}

/**
 * 车辆可以有多个联系电话，最多 5 个。
 * 存储结构：[{ id, phone, primary }]，有且仅有一个 primary=true。
 */
export const MAX_PHONES = 5;

export function normalizePhones(input) {
  if (!Array.isArray(input)) return { ok: false, message: '联系电话格式错误' };

  const list = [];
  const seen = new Set();

  for (const item of input) {
    // 兼容只传字符串的旧格式
    const raw = typeof item === 'string' ? { phone: item } : item || {};
    const checked = validatePhone(raw.phone);
    if (!checked.ok) return checked;
    if (seen.has(checked.value)) continue; // 静默去重
    seen.add(checked.value);
    list.push({
      id: typeof raw.id === 'string' && raw.id ? raw.id : newPhoneId(),
      phone: checked.value,
      primary: raw.primary === true,
    });
  }

  if (!list.length) return { ok: false, message: '请至少填写一个联系电话' };
  if (list.length > MAX_PHONES) return { ok: false, message: `最多添加 ${MAX_PHONES} 个联系电话` };

  // 保证有且仅有一个置顶号码
  const primaryIndex = list.findIndex((p) => p.primary);
  if (primaryIndex < 0) list[0].primary = true;
  else list.forEach((p, i) => { p.primary = i === primaryIndex; });

  return { ok: true, value: list };
}

export function newPhoneId() {
  return 'p' + Math.random().toString(36).slice(2, 8);
}

export function validateCarPayload(body) {
  const plate = validatePlate(body.plate);
  if (!plate.ok) return plate;

  const phones = normalizePhones(body.phones);
  if (!phones.ok) return phones;

  return {
    ok: true,
    value: {
      plate: plate.value,
      phones: phones.value,
    },
  };
}

/** 取车辆的置顶号码；兼容早期的单 phone 字段 */
export function primaryPhone(car) {
  if (Array.isArray(car.phones) && car.phones.length) {
    const hit = car.phones.find((p) => p.primary) || car.phones[0];
    return hit.phone;
  }
  return car.phone || '';
}

export function validatePagePayload(body) {
  return {
    ok: true,
    value: {
      title: cleanText(body.title, 60) || '临时停车，需挪车请联系我',
      notice: cleanText(body.notice, 80),
    },
  };
}

export function newCarId() {
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
