import { documentShell } from '../lib/layout.js';
import { renderParkBody, renderNotFoundBody } from '../views/park.js';
import { readSite } from '../lib/kv.js';
import { htmlPage, svgImage, text } from '../lib/http.js';
import { renderQrSvg } from '../../shared/qr.js';
import { CSS, PARK_JS } from '../generated/assets.js';

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
