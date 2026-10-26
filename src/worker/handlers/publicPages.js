import { documentShell } from '../lib/layout.js';
import { renderParkBody, renderNotFoundBody } from '../views/park.js';
import { renderHomeBody } from '../views/home.js';
import { readSite } from '../lib/kv.js';
import { htmlPage, svgImage, text } from '../lib/http.js';
import { renderQrSvg } from '../../shared/qr.js';
import { CSS, PARK_JS } from '../generated/assets.js';
import { MEDIA } from '../generated/media.js';

// 扫码页采用岛屿风格，浏览器地址栏配色与页面底色一致
const ISLAND_THEME = '#7dc395';

/** 首页：项目介绍 + 管理后台入口 */
export async function handleHome() {
  return documentShell({
    title: '挪车码 · 扫码联系车主',
    css: CSS,
    script: '',
    bodyClass: 'home-body',
    body: renderHomeBody(),
    cache: 'public, max-age=60',
  });
}

/**
 * 示例扫码页。
 * 使用固定的虚构车辆与号码，与站点真实数据完全无关，
 * 也不会调用取号接口，避免泄露或误拨任何真实号码。
 */
export function handleDemoPage() {
  const demo = {
    id: 'demo0000',
    title: '临时停车，需挪车请联系我',
    notice: '扫码后可一键呼叫，感谢配合',
    cars: [
      { id: 'demo1', plate: '京A·12345', phones: [{ id: 'd1a', phone: '13800000001', primary: true }], enabled: true, sort: 1 },
      { id: 'demo2', plate: '沪B·67890', phones: [{ id: 'd2a', phone: '13800000002', primary: true }], enabled: true, sort: 2 },
      { id: 'demo3', plate: '粤C·24680', phones: [{ id: 'd3a', phone: '13800000003', primary: true }], enabled: true, sort: 3 },
    ],
  };

  return documentShell({
    title: '示例挪车码',
    css: CSS,
    script: PARK_JS,
    bodyClass: 'park-body',
    body: renderParkBody(demo, { demo: true }),
    cache: 'public, max-age=300',
    themeColor: ISLAND_THEME,
  });
}

export async function handleParkPage(env, request, pageId) {
  const site = await readSite(env);

  if (!site || site.id !== pageId) {
    return documentShell({
      title: '挪车码无效',
      css: CSS,
      script: '',
      bodyClass: 'park-body',
      body: renderNotFoundBody(),
      cache: 'no-store',
      themeColor: ISLAND_THEME,
    });
  }

  const body = renderParkBody(site);

  return documentShell({
    title: site.title || '挪车码',
    css: CSS,
    script: PARK_JS,
    bodyClass: 'park-body',
    body,
    // 页面本身不含隐私数据，可短暂缓存；号码接口单独 no-store
    cache: 'public, max-age=30',
    themeColor: ISLAND_THEME,
  });
}

export async function handleQrSvg(env, request, pageId) {
  const site = await readSite(env);
  if (!site || site.id !== pageId) return htmlPage('挪车码无效', { status: 404 });

  const url = `${new URL(request.url).origin}/p/${pageId}`;
  const svg = renderQrSvg(url, { pixelSize: 1024, style: 'dot' });
  return svgImage(svg);
}

export function handleRobots() {
  return text('User-agent: *\nDisallow: /\n', { cache: 'public, max-age=86400' });
}

/**
 * 扫码页的装饰图。
 * 图片在构建期被 base64 内联进函数，这里解码后按静态资源返回，
 * 既避免 HTML 被图片撑大，也能让浏览器长期缓存。
 */
export function handleAsset(name) {
  const item = MEDIA[name];
  if (!item) return null;

  const binary = atob(item.data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return new Response(bytes, {
    headers: {
      'Content-Type': item.type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
