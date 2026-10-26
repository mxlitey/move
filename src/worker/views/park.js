import { escapeHtml, safeJsonForScript } from '../lib/layout.js';

const CALL_ICON = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
<path d="M6.6 3.5a2 2 0 0 1 2.3.9l1.2 2a2 2 0 0 1-.4 2.5l-.7.6a12.5 12.5 0 0 0 5.5 5.5l.6-.7a2 2 0 0 1 2.5-.4l2 1.2a2 2 0 0 1 .9 2.3l-.5 1.7a2.5 2.5 0 0 1-2.6 1.8C10.2 20.4 3.6 13.8 3.1 6.6A2.5 2.5 0 0 1 4.9 4l1.7-.5Z" fill="currentColor"/>
</svg>`;

function carMeta(car) {
  return [car.color, car.model].filter(Boolean).join(' · ');
}

export function renderParkBody(page) {
  const cars = (page.cars || [])
    .filter((c) => c.enabled)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0));

  if (!cars.length) return renderEmptyBody(page, '暂无可用车辆');

  const single = cars.length === 1;

  const carNodes = cars
    .map((car, i) => {
      if (single) {
        return `<div class="car car-static">
  <span class="car-text">
    <span class="car-plate">${escapeHtml(car.plate)}</span>
    ${carMeta(car) ? `<span class="car-meta">${escapeHtml(carMeta(car))}</span>` : ''}
  </span>
</div>`;
      }
      return `<button type="button" class="car" role="radio" aria-checked="${i === 0 ? 'true' : 'false'}" data-car-id="${escapeHtml(car.id)}">
  <span class="car-text">
    <span class="car-plate">${escapeHtml(car.plate)}</span>
    ${carMeta(car) ? `<span class="car-meta">${escapeHtml(carMeta(car))}</span>` : ''}
  </span>
  <span class="car-check" aria-hidden="true"></span>
</button>`;
    })
    .join('');

  return `<main class="park">
  <header class="park-hero">
    <span class="park-badge">挪车码</span>
    <h1>${escapeHtml(page.title)}</h1>
    ${page.notice ? `<p>${escapeHtml(page.notice)}</p>` : ''}
  </header>

  ${single ? `<div class="park-cars">${carNodes}</div>` : `<div class="park-cars" role="radiogroup" aria-label="选择要联系的车辆">${carNodes}</div>`}

  <div class="park-actions">
    <button type="button" class="call-btn" id="callBtn" data-page-id="${escapeHtml(page.id)}">
      ${CALL_ICON}<span id="callLabel">一键呼叫车主</span>
    </button>
    <p class="park-hint">点击后直接拨打车主电话，请勿重复拨打</p>
  </div>

  <p class="park-foot">本二维码由车主本人贴置于车内<br>如非挪车需要，请勿打扰</p>
</main>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script id="parkState" type="application/json">${safeJsonForScript({
    pageId: page.id,
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
