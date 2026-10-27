function icon(paths) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

const ICONS = {
  edit: icon('<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M14 6l4 4"/>'),
  trash: icon('<path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/>'),
  plus: icon('<path d="M12 5v14M5 12h14"/>'),
  logout: icon('<path d="M15 4h4v16h-4"/><path d="M10 12h9"/><path d="M10 12l3-3M10 12l3 3"/>'),
  copy: icon('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5H6a2 2 0 0 0-2 2v9"/>'),
};

export function renderLoginView({ initialized }) {
  if (!initialized) {
    return `<div class="auth">
  <form class="auth-card" id="initForm" novalidate>
    <div class="auth-logo">挪</div>
    <h1>初始化管理员密码</h1>
    <div class="alert" id="authError" hidden></div>
    <div class="field">
      <label for="pwd1">设置密码</label>
      <input class="input" id="pwd1" type="password" autocomplete="new-password" placeholder="至少 8 位，建议含字母和数字" required>
    </div>
    <div class="field">
      <label for="pwd2">再次输入</label>
      <input class="input" id="pwd2" type="password" autocomplete="new-password" placeholder="请再次输入" required>
    </div>
    <button class="btn btn-block" type="submit" id="initBtn">完成初始化</button>
  </form>
</div>`;
  }

  return `<div class="auth">
  <form class="auth-card" id="loginForm" novalidate>
    <div class="auth-logo">挪</div>
    <h1>后台登录</h1>
    <div class="alert" id="authError" hidden></div>
    <div class="field">
      <label for="pwd">管理员密码</label>
      <input class="input" id="pwd" type="password" autocomplete="current-password" placeholder="请输入密码" required>
    </div>
    <button class="btn btn-block" type="submit" id="loginBtn">登录</button>
  </form>
</div>`;
}

export function renderAdminBody() {
  return `<div class="shell" id="shell" hidden>
  <header class="topbar">
    <div class="brand">
      <div class="brand-mark">挪</div>
      <h1>挪车码后台</h1>
    </div>
    <button class="btn btn-ghost btn-sm" id="logoutBtn" type="button">${ICONS.logout}<span>退出</span></button>
  </header>

  <nav class="tabs" role="tablist">
    <button class="tab" role="tab" data-tab="cars" aria-selected="true" type="button">车辆管理</button>
    <button class="tab" role="tab" data-tab="qr" aria-selected="false" type="button">二维码</button>
    <button class="tab" role="tab" data-tab="settings" aria-selected="false" type="button">页面设置</button>
    <button class="tab" role="tab" data-tab="account" aria-selected="false" type="button">账号安全</button>
  </nav>

  <section class="panel active" id="panel-cars">
    <div class="card">
      <div class="card-head">
        <h2>车辆列表</h2>
        <button class="btn btn-sm" id="addCarBtn" type="button">${ICONS.plus}<span>添加车辆</span></button>
      </div>
      <div id="carList"><div class="empty">加载中…</div></div>
    </div>
  </section>

  <section class="panel" id="panel-qr">
    <div class="card">
      <div class="card-head">
        <h2>挪车二维码</h2>
      </div>
      <div class="field">
        <label for="qrCarSelect">二维码指向</label>
        <select class="input" id="qrCarSelect"></select>
        <p class="muted" id="qrModeTip" style="margin:6px 0 0"></p>
      </div>
      <div class="qr-wrap">
        <div class="qr-canvas" id="qrCanvas"></div>
        <div class="qr-side">
          <a class="qr-link" id="qrLink" href="#" target="_blank" rel="noopener"></a>
          <div class="btn-row">
            <button class="btn btn-sm" id="downloadSvgBtn" type="button">下载 SVG</button>
            <button class="btn btn-sm" id="downloadPngBtn" type="button">下载 PNG</button>
            <button class="btn btn-sm" id="downloadJpgBtn" type="button">下载 JPG</button>
            <button class="btn btn-sm btn-ghost" id="copyLinkBtn" type="button">${ICONS.copy}<span>复制链接</span></button>
            <button class="btn btn-sm btn-ghost" id="printBtn" type="button">打印车贴</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="panel" id="panel-settings">
    <div class="card">
      <div class="card-head">
        <h2>页面文案</h2>
      </div>
      <form id="settingsForm">
        <div class="field">
          <label for="pageTitle">标题</label>
          <input class="input" id="pageTitle" maxlength="60" placeholder="临时停车，需挪车请联系我">
        </div>
        <div class="field">
          <label for="pageNotice">提示语</label>
          <input class="input" id="pageNotice" maxlength="80" placeholder="扫码后可一键呼叫，感谢配合">
        </div>
        <button class="btn" type="submit" id="saveSettingsBtn">保存</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head">
        <h2>页面地址</h2>
      </div>
      <form id="pageIdForm">
        <div class="field">
          <label for="pageIdInput">自定义地址后缀</label>
          <input class="input" id="pageIdInput" maxlength="16" spellcheck="false" autocapitalize="off"
                 autocomplete="off" placeholder="如 hft6ug2j">
          <p class="muted" id="pageIdPreview" style="margin:6px 0 0"></p>
        </div>
        <div class="alert" id="pageIdWarn" hidden></div>
        <button class="btn" type="submit" id="savePageIdBtn">保存地址</button>
      </form>
    </div>
    <div class="card">
      <div class="card-head">
        <h2>重置页面地址</h2>
      </div>
      <div class="alert" id="resetWarn" hidden></div>
      <button class="btn btn-danger btn-sm" id="resetIdBtn" type="button">重置并生成新二维码</button>
    </div>
  </section>

  <section class="panel" id="panel-account">
    <div class="card">
      <div class="card-head">
        <h2>修改密码</h2>
      </div>
      <form id="passwordForm">
        <div class="field">
          <label for="oldPwd">当前密码</label>
          <input class="input" id="oldPwd" type="password" autocomplete="current-password" required>
        </div>
        <div class="field">
          <label for="newPwd">新密码</label>
          <input class="input" id="newPwd" type="password" autocomplete="new-password" placeholder="至少 8 位" required>
        </div>
        <div class="field">
          <label for="newPwd2">确认新密码</label>
          <input class="input" id="newPwd2" type="password" autocomplete="new-password" required>
        </div>
        <div class="alert" id="pwdError" hidden></div>
        <button class="btn" type="submit" id="changePwdBtn">保存新密码</button>
      </form>
    </div>
  </section>
</div>

<div class="modal" id="carModal" hidden>
  <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="carModalTitle">
    <div class="modal-head">
      <h2 id="carModalTitle">添加车辆</h2>
    </div>
    <form id="carForm">
      <input type="hidden" id="carId">
      <div class="field">
        <label for="carPlate">车牌号</label>
        <input class="input" id="carPlate" maxlength="9" placeholder="如 粤B12345" required>
      </div>
      <div class="field">
        <label>联系电话</label>
        <div id="phoneList"></div>
        <button class="btn btn-ghost btn-sm" id="addPhoneBtn" type="button" style="margin-top:8px">${ICONS.plus}<span>添加号码</span></button>
      </div>
      <div class="alert" id="carError" hidden></div>
      <div class="modal-foot">
        <button class="btn btn-ghost" type="button" id="carCancelBtn">取消</button>
        <button class="btn" type="submit" id="carSaveBtn">保存</button>
      </div>
    </form>
  </div>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<div class="print-sheet" id="printSheet">
  <div class="p-plate" id="printPlate" hidden></div>
  <div class="p-qr" id="printQr"></div>
  <div class="p-tip">如需挪车，请扫码联系车主<br>Scan to contact the owner</div>
</div>`;
}

export { ICONS };
