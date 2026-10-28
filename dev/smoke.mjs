/**
 * 端到端冒烟测试。对本地服务跑完整流程：
 * 初始化 → 登录 → 加车 → 改车 → 改名 → 扫码页 → 取号 → 停用 → 重置 ID → 改密。
 *
 * 用法：node dev/smoke.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'http://localhost:8899';

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
  check('错误密码被拒绝（401）', r.status === 401, `实际 ${r.status}`);

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
  check('后台有二维码指向下拉', shellHtml.includes('qrCarSelect'));
  check('扫码预览卡片已移除', !shellHtml.includes('qrPreview'));

  // 6. 新增车辆（多号码）
  r = await call('/api/admin/car', {
    method: 'POST',
    body: {
      plate: '粤B12345',
      phones: [
        { phone: '13800138000', primary: true },
        { phone: '13800138001' },
        { phone: '13800138002' },
      ],
      enabled: true,
      rev: site.rev,
    },
  });
  check('新增车辆成功', r.status === 200 && r.payload.ok, JSON.stringify(r.payload).slice(0, 120));
  let rev = r.payload.data ? r.payload.data.site.rev : site.rev;
  const car1 = r.payload.data ? r.payload.data.carId : null;
  const firstCar = r.payload.data ? r.payload.data.site.cars[0] : {};
  check('车辆不含车型字段', !('model' in firstCar));
  check('车辆不含颜色字段', !('color' in firstCar));
  check('车辆保存了 3 个号码', Array.isArray(firstCar.phones) && firstCar.phones.length === 3,
    JSON.stringify(firstCar.phones));
  check('只有一个置顶号码', (firstCar.phones || []).filter((p) => p.primary).length === 1);

  const phone1Ids = (firstCar.phones || []).map((p) => p.id);

  // 7. 手机号非法
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { plate: '粤B12345', phones: [{ phone: '12345' }], rev },
  });
  check('非法手机号被拒绝', r.status === 400);

  // 8. 车牌非法
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { plate: 'XX', phones: [{ phone: '13900139000' }], rev },
  });
  check('非法车牌被拒绝', r.status === 400);

  // 9. 再加一辆
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { plate: '粤B67890', phones: [{ phone: '13900139000', primary: true }], enabled: true, rev },
  });
  check('新增第二辆车', r.status === 200 && r.payload.ok);
  rev = r.payload.data.site.rev;
  const car2 = r.payload.data.carId;

  // 9b. 车辆自编 ID
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { carCode: 'MY-BMW_3', plate: '粤B99999', phones: [{ phone: '13600136000' }], enabled: true, rev },
  });
  check('自编 ID 保存成功', r.status === 200 && r.payload.ok, JSON.stringify(r.payload).slice(0, 120));
  rev = r.payload.data.site.rev;
  const customPageId = r.payload.data.site.id;
  const carCustom = r.payload.data.carId;
  check('自编 ID 自动转小写', carCustom === 'my-bmw_3', carCustom);

  r = await call('/api/admin/car', {
    method: 'POST',
    body: { carCode: 'my-bmw_3', plate: '粤B88888', phones: [{ phone: '13600136001' }], rev },
  });
  check('重复的自编 ID 被拒绝', r.status === 400, `实际 ${r.status}`);

  r = await call('/api/admin/car', {
    method: 'POST',
    body: { carCode: 'bad id!', plate: '粤B88888', phones: [{ phone: '13600136001' }], rev },
  });
  check('非法自编 ID 被拒绝', r.status === 400);

  r = await call(`/p/${customPageId}?car=${carCustom}`, { keepCookie: false });
  check('自编 ID 的一车一码可访问', r.status === 200 && String(r.payload).includes('粤B99999'));

  r = await call(`/api/admin/car?id=${carCustom}&rev=${rev}`, { method: 'DELETE' });
  check('删除自编 ID 车辆', r.status === 200 && r.payload.data.site.cars.length === 2);
  rev = r.payload.data.site.rev;

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

  // 12b. 一车一码：带 ?car= 时只展示该车
  r = await call(`/p/${pageId}?car=${encodeURIComponent(car1)}`, { keepCookie: false });
  const oneCarHtml = String(r.payload);
  check('一车一码页可访问', r.status === 200);
  check('一车一码只显示指定车辆', oneCarHtml.includes('粤B12345') && !oneCarHtml.includes('粤B67890'));
  check('一车一码使用单车结构', oneCarHtml.includes('park-cars is-single'));
  check('一车一码仍有呼叫按钮', oneCarHtml.includes(`data-call-id="${car1}"`));
  check('一车一码不含手机号', !oneCarHtml.includes('13800138000'));

  r = await call(`/p/${pageId}?car=${encodeURIComponent(car2)}`, { keepCookie: false });
  const otherCarHtml = String(r.payload);
  check('切换到另一辆车的码', otherCarHtml.includes('粤B67890') && !otherCarHtml.includes('粤B12345'));

  // 参数无效时回落到整页列表，避免扫到失效页
  r = await call(`/p/${pageId}?car=nope`, { keepCookie: false });
  const fallbackHtml = String(r.payload);
  check('无效 car 参数回落整页列表', fallbackHtml.includes('粤B12345') && fallbackHtml.includes('粤B67890'));

  // 取号接口对一车一码同样有效
  r = await call(`/api/p/${pageId}/contact`, { method: 'POST', body: { carId: car1 }, keepCookie: false });
  check('一车一码取号成功', r.status === 200 && r.payload.data.plate === '粤B12345', JSON.stringify(r.payload));

  // 13. 取号接口：只返回置顶号码
  r = await call(`/api/p/${pageId}/contact`, { method: 'POST', body: { carId: car1 }, keepCookie: false });
  check('取号返回置顶号码', r.status === 200 && r.payload.data.phone === '13800138000', JSON.stringify(r.payload));
  check('取号响应 no-store', (r.headers.get('cache-control') || '').includes('no-store'));

  // 13b. 置顶第二个号码后，取号应跟着变化
  r = await call('/api/admin/car/primary-phone', {
    method: 'POST',
    body: { carId: car1, phoneId: phone1Ids[1], rev },
  });
  check('置顶号码成功', r.status === 200 && r.payload.ok, JSON.stringify(r.payload).slice(0, 120));
  rev = r.payload.data.site.rev;

  const carAfterPin = r.payload.data.site.cars.find((c) => c.id === car1);
  check('置顶后只有一个 primary', carAfterPin.phones.filter((p) => p.primary).length === 1);
  check('置顶的是指定号码', carAfterPin.phones.find((p) => p.primary).phone === '13800138001');

  r = await call(`/api/p/${pageId}/contact`, { method: 'POST', body: { carId: car1 }, keepCookie: false });
  check('取号跟随置顶号码', r.status === 200 && r.payload.data.phone === '13800138001', JSON.stringify(r.payload));

  // 置顶不存在的号码
  r = await call('/api/admin/car/primary-phone', {
    method: 'POST',
    body: { carId: car1, phoneId: 'nope', rev },
  });
  check('置顶不存在的号码返回 404', r.status === 404);

  // 恢复置顶到第一个号码
  r = await call('/api/admin/car/primary-phone', {
    method: 'POST',
    body: { carId: car1, phoneId: phone1Ids[0], rev },
  });
  rev = r.payload.data.site.rev;

  // 14. 取号错误 carId
  r = await call(`/api/p/${pageId}/contact`, { method: 'POST', body: { carId: 'nope' }, keepCookie: false });
  check('未知车辆取号 404', r.status === 404);

  // 15. 关闭第二辆的显示开关
  r = await call('/api/admin/car', {
    method: 'POST',
    body: { id: car2, plate: '粤B67890', phones: [{ phone: '13900139000', primary: true }], enabled: false, rev },
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
    body: { id: car2, plate: '粤B67890', phones: [{ phone: '13900139000', primary: true }], enabled: true, rev },
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

  r = await call(`/p/${pageId}/qr.svg?car=${encodeURIComponent(car1)}`, { keepCookie: false });
  check('一车一码 SVG 可访问', r.status === 200 && String(r.payload).startsWith('<svg'));
  const qrOneCar = String(r.payload);
  r = await call(`/p/${pageId}/qr.svg`, { keepCookie: false });
  check('一车一码与整页码内容不同', qrOneCar !== String(r.payload));

  // 19. 重置 ID
  r = await call('/api/admin/page/reset-id', { method: 'POST', body: {} });
  check('重置 ID 成功', r.status === 200 && r.payload.ok);
  const newId = r.payload.data.site.id;
  check('新 ID 与旧 ID 不同', newId !== pageId);

  r = await call(`/p/${pageId}`, { keepCookie: false });
  check('旧二维码地址失效', String(r.payload).includes('挪车码无效'));

  r = await call(`/p/${newId}`, { keepCookie: false });
  check('新地址可访问', r.status === 200 && String(r.payload).includes('粤B12345'));

  // 19b. 自定义页面地址：恢复成重置前的地址，让已打印的二维码重新生效
  r = await call('/api/admin/session');
  rev = r.payload.data.site.rev;
  r = await call('/api/admin/page/id', { method: 'PUT', body: { id: pageId, rev } });
  check('自定义地址成功', r.status === 200 && r.payload.ok, JSON.stringify(r.payload).slice(0, 120));
  check('地址已恢复为原值', r.payload.data.site.id === pageId, r.payload.data.site.id);
  rev = r.payload.data.site.rev;

  r = await call(`/p/${pageId}`, { keepCookie: false });
  check('恢复后旧地址重新可用', r.status === 200 && String(r.payload).includes('粤B12345'));

  r = await call(`/p/${newId}`, { keepCookie: false });
  check('恢复后重置出的地址失效', String(r.payload).includes('挪车码无效'));

  // 校验规则
  r = await call('/api/admin/page/id', { method: 'PUT', body: { id: 'ab', rev } });
  check('过短地址被拒绝', r.status === 400);

  r = await call('/api/admin/page/id', { method: 'PUT', body: { id: 'abc-def', rev } });
  check('含非法字符的地址被拒绝', r.status === 400);

  r = await call('/api/admin/page/id', { method: 'PUT', body: { id: 'admin', rev } });
  check('保留字地址被拒绝', r.status === 400);

  r = await call('/api/admin/page/id', { method: 'PUT', body: { id: pageId, rev } });
  check('相同地址不报错', r.status === 200 && r.payload.data.unchanged === true);

  // 大写自动转小写
  r = await call('/api/admin/page/id', { method: 'PUT', body: { id: 'HFT6UG2J', rev } });
  check('大写地址自动转小写', r.status === 200 && r.payload.data.site.id === 'hft6ug2j');
  rev = r.payload.data.site.rev;

  r = await call('/p/hft6ug2j', { keepCookie: false });
  check('转小写后的地址可访问', r.status === 200 && String(r.payload).includes('粤B12345'));

  // 未登录不能改地址
  const keepCookie2 = cookie;
  cookie = '';
  r = await call('/api/admin/page/id', { method: 'PUT', body: { id: 'hack1234', rev } });
  check('未登录不能改地址', r.status === 401);
  cookie = keepCookie2;

  // 改回测试用的地址，避免影响后续断言
  r = await call('/api/admin/page/id', { method: 'PUT', body: { id: pageId, rev } });
  rev = r.payload.data.site.rev;

  // 20. 删除车辆
  r = await call('/api/admin/session');
  rev = r.payload.data.site.rev;
  r = await call(`/api/admin/car?id=${car2}&rev=${rev}`, { method: 'DELETE' });
  check('删除车辆成功', r.status === 200 && r.payload.ok);
  check('删除后只剩一辆', r.payload.data.site.cars.length === 1);

  // 21. 未登录写操作
  const savedCookie = cookie;
  cookie = '';
  r = await call('/api/admin/car', { method: 'POST', body: { plate: '粤B11111', phones: [{ phone: '13700137000' }] } });
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
