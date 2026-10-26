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

  // 首页
  const realId = site.id;
  r = await call('/', { keepCookie: false });
  const homeHtml = String(r.payload);
  check('首页可访问', r.status === 200);
  check('首页有后台入口', homeHtml.includes('href="/admin"'));
  check('首页不再有冗余说明段落', !homeHtml.includes('它怎么工作'));
  check('首页示例链接指向 /demo', homeHtml.includes('href="/demo"'));
  check('首页不暴露真实站点地址', !homeHtml.includes(`/p/${realId}`));

  // 示例页必须用固定假数据，不能指向真实站点
  r = await call('/demo', { keepCookie: false });
  const demoHtml = String(r.payload);
  check('示例页可访问', r.status === 200);
  check('示例页用虚构车牌', demoHtml.includes('京A·12345'));
  check('示例页有示例提示条', demoHtml.includes('demo-tip'));
  check('示例页标记 demo 模式', demoHtml.includes('"demo":true'));
  check('示例页不引用真实站点 ID', !demoHtml.includes(`/p/${realId}`));

  // 后台页面结构：下载按钮应为 SVG + PNG + JPG 三种
  r = await call('/admin');
  const shellHtml = String(r.payload);
  check('后台有 PNG 下载按钮', shellHtml.includes('downloadPngBtn'));
  check('后台有 JPG 下载按钮', shellHtml.includes('downloadJpgBtn'));
  check('后台有 SVG 下载按钮', shellHtml.includes('downloadSvgBtn'));
  check('扫码预览卡片已移除', !shellHtml.includes('qrPreview'));

  // 6. 新增车辆
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { plate: '粤B12345', phone: '13800138000', enabled: true, rev: site.rev },
  });
  check('新增车辆成功', r.status === 200 && r.payload.ok, JSON.stringify(r.payload).slice(0, 120));
  let rev = r.payload.data ? r.payload.data.site.rev : site.rev;
  const car1 = r.payload.data ? r.payload.data.carId : null;
  const firstCar = r.payload.data ? r.payload.data.site.cars[0] : {};
  check('车辆不含车型字段', !('model' in firstCar));
  check('车辆不含颜色字段', !('color' in firstCar));

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
    body: { plate: '粤B67890', phone: '13900139000', enabled: true, rev },
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

  // 11. 扫码页渲染（多车 → 手风琴）
  r = await call(`/p/${pageId}`, { keepCookie: false });
  const parkHtml = String(r.payload);
  check('扫码页可访问', r.status === 200);
  check('扫码页含车牌', parkHtml.includes('粤B12345'));
  check('扫码页含两辆车', parkHtml.includes('粤B67890'));
  check('扫码页不含手机号', !parkHtml.includes('13800138000'));
  check('多车使用手风琴结构', parkHtml.includes('acc-item'));
  check('默认只展开第一辆', (parkHtml.match(/acc-item is-open/g) || []).length === 1);
  check('第一辆的呼叫按钮可见', parkHtml.includes(`data-call-id="${car1}"`));
  check('第二辆也有呼叫按钮', parkHtml.includes(`data-call-id="${car2}"`));

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

  // 15. 关闭第二辆的显示开关
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { id: car2, plate: '粤B67890', phone: '13900139000', enabled: false, rev },
  });
  check('关闭显示开关成功', r.status === 200 && r.payload.ok);
  rev = r.payload.data.site.rev;

  r = await call(`/p/${pageId}`, { keepCookie: false });
  check('关闭后扫码页不再显示该车', !String(r.payload).includes('粤B67890'));
  check('只剩一辆时使用单车结构', String(r.payload).includes('park-cars is-single'));

  r = await call(`/api/p/${pageId}/contact`, { method: 'POST', body: { carId: car2 }, keepCookie: false });
  check('隐藏车辆取号被拒绝', r.status === 404);

  // 重新打开开关
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { id: car2, plate: '粤B67890', phone: '13900139000', enabled: true, rev },
  });
  check('重新打开显示开关', r.status === 200 && r.payload.ok);
  rev = r.payload.data.site.rev;

  r = await call(`/p/${pageId}`, { keepCookie: false });
  check('重新打开后扫码页又显示该车', String(r.payload).includes('粤B67890'));
  check('恢复为多车手风琴', String(r.payload).includes('acc-item'));

  // 15b. 拖拽排序接口
  r = await call('/api/admin/cars/order', {
    method: 'POST',
    body: { ids: [car2, car1], rev },
  });
  check('排序接口成功', r.status === 200 && r.payload.ok, JSON.stringify(r.payload).slice(0, 120));
  rev = r.payload.data.site.rev;
  const reordered = r.payload.data.site.cars;
  check('排序后第一辆变为原第二辆', reordered[0].id === car2, reordered[0].plate);
  check('sort 字段已重排', reordered[0].sort === 1 && reordered[1].sort === 2);

  r = await call(`/p/${pageId}`, { keepCookie: false });
  const afterOrder = String(r.payload);
  check('扫码页顺序跟随排序', afterOrder.indexOf('粤B67890') < afterOrder.indexOf('粤B12345'));
  check('排序后默认展开新的第一辆', (afterOrder.match(/acc-item is-open/g) || []).length === 1);

  // 排序接口鉴权
  const keep = cookie;
  cookie = '';
  r = await call('/api/admin/cars/order', { method: 'POST', body: { ids: [] } });
  check('未登录不能排序', r.status === 401);
  cookie = keep;

  // 恢复原顺序，便于后续断言
  r = await call('/api/admin/cars/order', { method: 'POST', body: { ids: [car1, car2], rev } });
  rev = r.payload.data.site.rev;

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
