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

export function validateCarPayload(body) {
  const plate = validatePlate(body.plate);
  if (!plate.ok) return plate;

  const phone = validatePhone(body.phone);
  if (!phone.ok) return phone;

  return {
    ok: true,
    value: {
      plate: plate.value,
      phone: phone.value,
    },
  };
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
