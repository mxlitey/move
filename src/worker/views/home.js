import { escapeHtml } from '../lib/layout.js';

const ICONS = {
  scan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3"/><path d="M4 12h16"/></svg>`,
  call: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6.6 3.5a2 2 0 0 1 2.3.9l1.2 2a2 2 0 0 1-.4 2.5l-.7.6a12.5 12.5 0 0 0 5.5 5.5l.6-.7a2 2 0 0 1 2.5-.4l2 1.2a2 2 0 0 1 .9 2.3l-.5 1.7a2.5 2.5 0 0 1-2.6 1.8C10.2 20.4 3.6 13.8 3.1 6.6A2.5 2.5 0 0 1 4.9 4l1.7-.5Z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.2-2.9 7.8-7 9-4.1-1.2-7-4.8-7-9V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  car: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 16h14M6.5 16V9.5L9 5h6l2.5 4.5V16"/><circle cx="8" cy="18" r="1.6"/><circle cx="16" cy="18" r="1.6"/><path d="M6.5 11h11"/></svg>`,
};

export function renderHomeBody({ siteId }) {
  const demoHref = siteId ? `/p/${escapeHtml(siteId)}` : '';

  return `<main class="home">
  <section class="home-hero">
    <span class="home-badge">扫码挪车 · 无需留号</span>
    <h1>把二维码贴车上<br>需要挪车的人扫一下就能打给你</h1>
    <p class="home-lead">
      不用在挡风玻璃上写手机号了。打印一张挪车码贴在车内，
      别人扫码即可看到你的车辆并一键呼叫，号码不会出现在页面上。
    </p>
    <div class="home-cta">
      <a class="btn home-btn-primary" href="/admin">进入管理后台</a>
      ${demoHref ? `<a class="btn btn-ghost home-btn-ghost" href="${demoHref}">查看示例扫码页</a>` : ''}
    </div>
  </section>

  <section class="home-section">
    <h2>它怎么工作</h2>
    <ol class="home-steps">
      <li>
        <span class="home-step-no">1</span>
        <div>
          <h3>后台录入车辆</h3>
          <p>填写车牌与联系电话，可添加多辆车轮流使用，随时改随时生效。</p>
        </div>
      </li>
      <li>
        <span class="home-step-no">2</span>
        <div>
          <h3>下载二维码贴车内</h3>
          <p>圆形挪车码，可下载 SVG/PNG 或直接打印车贴，贴在挡风玻璃内侧。</p>
        </div>
      </li>
      <li>
        <span class="home-step-no">3</span>
        <div>
          <h3>扫码一键呼叫</h3>
          <p>对方扫码后展开车辆、点击按钮，直接调起系统拨号盘联系你。</p>
        </div>
      </li>
    </ol>
  </section>

  <section class="home-section">
    <h2>特点</h2>
    <ul class="home-features">
      <li>
        <span class="home-icon">${ICONS.scan}</span>
        <div>
          <h3>号码不落在页面上</h3>
          <p>扫码页源码里没有手机号，只有对方主动点击呼叫时才临时下发。</p>
        </div>
      </li>
      <li>
        <span class="home-icon">${ICONS.car}</span>
        <div>
          <h3>多车也能一码搞定</h3>
          <p>一个二维码管多辆车，扫码后展开对应车辆即可呼叫，不用换码。</p>
        </div>
      </li>
      <li>
        <span class="home-icon">${ICONS.shield}</span>
        <div>
          <h3>随时可停用、可换码</h3>
          <p>每辆车都有独立开关；怀疑二维码被冒用时可一键重置，旧码立刻失效。</p>
        </div>
      </li>
      <li>
        <span class="home-icon">${ICONS.call}</span>
        <div>
          <h3>边缘加速，打开很快</h3>
          <p>页面跑在阿里云边缘节点，就近响应，扫码即开，无服务器可运维。</p>
        </div>
      </li>
    </ul>
  </section>

  <footer class="home-foot">
    <p>挪车码 · 让挪车这件事少一点尴尬</p>
    <a href="/admin">管理后台</a>
  </footer>
</main>`;
}
