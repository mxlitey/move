/**
 * 端到端冒烟测试。对本地服务跑完整流程：
 * 初始化 → 登录 → 加车 → 改车 → 改名 → 扫码页 → 取号 → 停用 → 重置 ID → 改密。
 *
 * 用法：node dev/smoke.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'http://localhost:8899';

// 每次运行使用独立的模拟来源 IP，避免上一轮的限流计数影响本轮结果
const RUN_IP = `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

let passed = 0;
let failed = 0;
let cookie = '';

function check(name, cond, extra) {
  if (cond) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${extra ? ' — ' + extra : ''}`);
  }
}

async function call(path, { method = 'GET', body, headers = {}, keepCookie = true } = {}) {
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'fetch',
      'X-Forwarded-For': RUN_IP,
      ...headers,
    },
    redirect: 'manual',
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  if (keepCookie && cookie) init.headers.Cookie = cookie;

  const res = await fetch(BASE + path, init);
  const setCookie = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of setCookie) {
    if (keepCookie) {
      const pair = c.split(';')[0];
      if (pair.endsWith('=')) cookie = '';
      else if (pair.startsWith('mc_session=')) cookie = pair;
    }
  }

  const type = res.headers.get('content-type') || '';
  const payload = type.includes('json') ? await res.json() : await res.text();
  return { status: res.status, payload, headers: res.headers };
}

async function main() {
  console.log(`\n冒烟测试 -> ${BASE}\n`);

  // 1. 未登录时后台 API 应拒绝
  let r = await call('/api/admin/session');
  check('未登录访问 session 返回 401', r.status === 401, `实际 ${r.status}`);

  // 2. 管理员页面可打开
  r = await call('/admin');
  const adminHtml = String(r.payload);
  check('后台页面可访问', r.status === 200 && (adminHtml.includes('管理员密码') || adminHtml.includes('挪车码后台')));

  // 3. 初始化密码
  r = await call('/api/admin/init', { method: 'POST', body: { password: 'TestPass123' } });
  const alreadyInit = r.status === 409;
  check('初始化管理员（或已初始化）', r.status === 200 || alreadyInit, `实际 ${r.status}`);

  if (alreadyInit) {
    r = await call('/api/admin/login', { method: 'POST', body: { password: 'TestPass123' } });
    check('登录成功', r.status === 200 && r.payload.ok, JSON.stringify(r.payload));
  }

  // 4. 错误密码
  r = await call('/api/admin/login', { method: 'POST', body: { password: 'wrong-password' } });
  check('错误密码被拒绝（401 或触发限流 429）', r.status === 401 || r.status === 429, `实际 ${r.status}`);

  // 5. 读取站点
  r = await call('/api/admin/session');
  check('登录后可读取站点', r.status === 200 && r.payload.ok);
  let site = r.payload.data.site;
  check('站点有公开 ID', typeof site.id === 'string' && site.id.length === 8, site.id);

  // 清空历史车辆，保证可重复运行
  for (const c of site.cars || []) {
    r = await call(`/api/admin/car?id=${encodeURIComponent(c.id)}&rev=${site.rev}`, { method: 'DELETE' });
    if (r.status === 200) site = r.payload.data.site;
  }
  check('清空历史车辆', (site.cars || []).length === 0, `剩余 ${(site.cars || []).length}`);

  // 6. 新增车辆
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { plate: '粤B12345', model: '特斯拉 Model 3', color: '白色', phone: '13800138000', enabled: true, rev: site.rev },
  });
  check('新增车辆成功', r.status === 200 && r.payload.ok, JSON.stringify(r.payload).slice(0, 120));
  let rev = r.payload.data ? r.payload.data.site.rev : site.rev;
  const car1 = r.payload.data ? r.payload.data.carId : null;

  // 7. 手机号非法
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { plate: '粤B12345', phone: '12345', rev },
  });
  check('非法手机号被拒绝', r.status === 400);

  // 8. 车牌非法
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { plate: 'XX', phone: '13900139000', rev },
  });
  check('非法车牌被拒绝', r.status === 400);

  // 9. 再加一辆
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { plate: '粤B67890', model: '理想 L7', color: '黑色', phone: '13900139000', enabled: true, rev },
  });
  check('新增第二辆车', r.status === 200 && r.payload.ok);
  rev = r.payload.data.site.rev;
  const car2 = r.payload.data.carId;

  // 10. 读回站点确认
  r = await call('/api/admin/session');
  const s2 = r.payload.data.site;
  check('两辆车都在', s2.cars.length === 2, `实际 ${s2.cars.length}`);
  const pageId = s2.id;
  rev = s2.rev;

  // 11. 扫码页渲染
  r = await call(`/p/${pageId}`, { keepCookie: false });
  check('扫码页可访问', r.status === 200);
  check('扫码页含车牌', String(r.payload).includes('粤B12345'));
  check('扫码页含两辆车', String(r.payload).includes('粤B67890'));
  check('扫码页不含手机号', !String(r.payload).includes('13800138000'));

  // 12. 错误 pageId
  r = await call('/p/zzzzzzzz', { keepCookie: false });
  check('无效 pageId 返回失效页', r.status === 200 && String(r.payload).includes('挪车码无效'));

  // 13. 取号接口
  r = await call(`/api/p/${pageId}/contact`, { method: 'POST', body: { carId: car1 }, keepCookie: false });
  check('取号成功', r.status === 200 && r.payload.data.phone === '13800138000', JSON.stringify(r.payload));
  check('取号响应 no-store', (r.headers.get('cache-control') || '').includes('no-store'));

  // 14. 取号错误 carId
  r = await call(`/api/p/${pageId}/contact`, { method: 'POST', body: { carId: 'nope' }, keepCookie: false });
  check('未知车辆取号 404', r.status === 404);

  // 15. 停用第二辆
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { id: car2, plate: '粤B67890', phone: '13900139000', enabled: false, rev },
  });
  check('停用车辆成功', r.status === 200 && r.payload.ok);
  rev = r.payload.data.site.rev;

  r = await call(`/p/${pageId}`, { keepCookie: false });
  check('停用后扫码页不再显示该车', !String(r.payload).includes('粤B67890'));

  r = await call(`/api/p/${pageId}/contact`, { method: 'POST', body: { carId: car2 }, keepCookie: false });
  check('停用车辆取号被拒绝', r.status === 404);

  // 16. 页面文案
  r = await call('/api/admin/page', {
    method: 'PUT',
    body: { title: '临时停靠，请多包涵', notice: '扫码后可直接拨打', rev },
  });
  check('更新文案成功', r.status === 200 && r.payload.ok);
  rev = r.payload.data.site.rev;

  r = await call(`/p/${pageId}`, { keepCookie: false });
  check('扫码页显示新文案', String(r.payload).includes('临时停靠，请多包涵'));

  // 17. rev 冲突
  r = await call('/api/admin/page', { method: 'PUT', body: { title: 'x', notice: 'y', rev: 1 } });
  check('过期 rev 返回冲突', r.status === 409, `实际 ${r.status}`);

  // 18. 二维码 SVG
  r = await call(`/p/${pageId}/qr.svg`, { keepCookie: false });
  check('二维码 SVG 可访问', r.status === 200 && String(r.payload).startsWith('<svg'));

  // 19. 重置 ID
  r = await call('/api/admin/page/reset-id', { method: 'POST', body: {} });
  check('重置 ID 成功', r.status === 200 && r.payload.ok);
  const newId = r.payload.data.site.id;
  check('新 ID 与旧 ID 不同', newId !== pageId);

  r = await call(`/p/${pageId}`, { keepCookie: false });
  check('旧二维码地址失效', String(r.payload).includes('挪车码无效'));

  r = await call(`/p/${newId}`, { keepCookie: false });
  check('新地址可访问', r.status === 200 && String(r.payload).includes('粤B12345'));

  // 20. 删除车辆
  r = await call('/api/admin/session');
  rev = r.payload.data.site.rev;
  r = await call(`/api/admin/car?id=${car2}&rev=${rev}`, { method: 'DELETE' });
  check('删除车辆成功', r.status === 200 && r.payload.ok);
  check('删除后只剩一辆', r.payload.data.site.cars.length === 1);

  // 21. 未登录写操作
  const savedCookie = cookie;
  cookie = '';
  r = await call('/api/admin/car', { method: 'POST', body: { plate: '粤B11111', phone: '13700137000' } });
  check('未登录写操作 401', r.status === 401);
  cookie = savedCookie;

  // 22. 修改密码
  r = await call('/api/admin/password', {
    method: 'POST',
    body: { oldPassword: 'TestPass123', newPassword: 'TestPass456' },
  });
  check('修改密码成功', r.status === 200 && r.payload.ok);

  r = await call('/api/admin/logout', { method: 'POST' });
  check('登出成功', r.status === 200);

  r = await call('/api/admin/login', { method: 'POST', body: { password: 'TestPass456' } });
  check('新密码可登录', r.status === 200 && r.payload.ok);

  // 复原密码，便于重复跑
  await call('/api/admin/password', {
    method: 'POST',
    body: { oldPassword: 'TestPass456', newPassword: 'TestPass123' },
  });

  console.log(`\n结果：${passed} 通过，${failed} 失败\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('测试执行异常:', err);
  process.exit(1);
});
