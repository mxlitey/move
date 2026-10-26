import { escapeHtml, safeJsonForScript } from '../lib/layout.js';

const CALL_ICON = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
<path d="M6.6 3.5a2 2 0 0 1 2.3.9l1.2 2a2 2 0 0 1-.4 2.5l-.7.6a12.5 12.5 0 0 0 5.5 5.5l.6-.7a2 2 0 0 1 2.5-.4l2 1.2a2 2 0 0 1 .9 2.3l-.5 1.7a2.5 2.5 0 0 1-2.6 1.8C10.2 20.4 3.6 13.8 3.1 6.6A2.5 2.5 0 0 1 4.9 4l1.7-.5Z" fill="currentColor"/>
</svg>`;

const CHEVRON = `<svg class="acc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<path d="m6 9 6 6 6-6"/>
</svg>`;

function callButton(pageId, carId) {
  return `<button type="button" class="call-btn" data-call-id="${escapeHtml(carId)}" data-page-id="${escapeHtml(pageId)}">
  ${CALL_ICON}<span class="call-label">一键呼叫车主</span>
</button>`;
}

/**
 * 扫码页。
 * 单车：直接展示车牌与呼叫按钮。
 * 多车：手风琴，默认展开第一辆，展开项内嵌呼叫按钮。
 */
export function renderParkBody(page) {
  const cars = (page.cars || [])
    .filter((c) => c.enabled)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0));

  if (!cars.length) return renderEmptyBody(page, '暂无可用车辆');

  const single = cars.length === 1;

  const carNodes = single
    ? `<div class="acc-item is-open">
  <div class="acc-head acc-head-static">
    <span class="acc-plate">${escapeHtml(cars[0].plate)}</span>
  </div>
  <div class="acc-panel">
    ${callButton(page.id, cars[0].id)}
  </div>
</div>`
    : cars
        .map(
          (car, i) => `<div class="acc-item${i === 0 ? ' is-open' : ''}" data-car-id="${escapeHtml(car.id)}">
  <button type="button" class="acc-head" aria-expanded="${i === 0}" aria-controls="panel-${escapeHtml(car.id)}">
    <span class="acc-plate">${escapeHtml(car.plate)}</span>
    ${CHEVRON}
  </button>
  <div class="acc-panel" id="panel-${escapeHtml(car.id)}">
    <div class="acc-panel-inner">
      ${callButton(page.id, car.id)}
    </div>
  </div>
</div>`
        )
        .join('');

  return `<main class="park">
  <header class="park-hero">
    <span class="park-badge">挪车码</span>
    <h1>${escapeHtml(page.title)}</h1>
    ${page.notice ? `<p>${escapeHtml(page.notice)}</p>` : ''}
  </header>

  <div class="park-cars${single ? ' is-single' : ''}">${carNodes}</div>

  <p class="park-hint">${single ? '点击按钮直接拨打车主电话' : '展开对应车辆后点击呼叫，请勿重复拨打'}</p>

  <p class="park-foot">本二维码由车主本人贴置于车内<br>如非挪车需要，请勿打扰</p>
</main>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script id="parkState" type="application/json">${safeJsonForScript({
    pageId: page.id,
    single,
    cars: cars.map((c) => ({ id: c.id, plate: c.plate })),
  })}</script>`;
}

export function renderEmptyBody(page, message) {
  return `<main class="park">
  <div class="state">
    <div class="state-icon" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/>
      </svg>
    </div>
    <h2>${escapeHtml(message)}</h2>
    <p>该挪车码当前不可用。若您确实需要挪车，请联系停车场管理人员协助。</p>
  </div>
</main>`;
}

export function renderNotFoundBody() {
  return `<main class="park">
  <div class="state">
    <div class="state-icon" aria-hidden="true">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
        <path d="M4 7h16v13H4z"/><path d="M4 7l8 6 8-6"/>
      </svg>
    </div>
    <h2>挪车码无效</h2>
    <p>链接可能已失效或二维码有误，请核对后重试。</p>
  </div>
</main>`;
}
