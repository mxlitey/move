import { renderQrSvg } from '../shared/qr.js';

(function () {
  'use strict';

  var state = {
    site: null,
    cars: [],
    pageUrl: '',
  };

  var $ = function (id) { return document.getElementById(id); };
  var toastTimer = null;

  function toast(msg) {
    var el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2800);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function maskPhone(phone) {
    if (!phone || phone.length < 7) return phone || '';
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  }

  var redirected = false;

  function api(path, options) {
    var opts = options || {};
    var init = {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      credentials: 'same-origin',
      cache: 'no-store',
    };
    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);

    return fetch(path, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.status === 401 && path !== '/api/admin/login' && !redirected) {
          // 只跳转一次，避免 401 → reload → 仍 401 的死循环
          redirected = true;
          location.replace('/admin');
          throw new Error('登录已过期，请重新登录');
        }
        if (!res.ok || !data.ok) {
          var err = new Error((data && data.message) || '请求失败');
          err.code = data && data.code;
          throw err;
        }
        return data.data;
      });
    });
  }

  function showAlert(id, msg) {
    var el = $(id);
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  }

  // ------------------------- 登录 / 初始化 -------------------------

  var loginForm = $('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var pwd = $('pwd').value;
      var btn = $('loginBtn');
      if (!pwd) return showAlert('authError', '请输入密码');
      showAlert('authError', '');
      btn.disabled = true;
      api('/api/admin/login', { method: 'POST', body: { password: pwd } })
        .then(function () { location.reload(); })
        .catch(function (err) {
          showAlert('authError', err.message);
          btn.disabled = false;
        });
    });
  }

  var initForm = $('initForm');
  if (initForm) {
    initForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var p1 = $('pwd1').value;
      var p2 = $('pwd2').value;
      var btn = $('initBtn');
      if (p1.length < 8) return showAlert('authError', '密码至少 8 位');
      if (p1 !== p2) return showAlert('authError', '两次输入的密码不一致');
      showAlert('authError', '');
      btn.disabled = true;
      api('/api/admin/init', { method: 'POST', body: { password: p1 } })
        .then(function () { location.reload(); })
        .catch(function (err) {
          showAlert('authError', err.message);
          btn.disabled = false;
        });
    });
  }

  if (loginForm || initForm) return;

  // ------------------------- 后台主界面 -------------------------

  $('shell').hidden = false;

  $('logoutBtn').addEventListener('click', function () {
    api('/api/admin/logout', { method: 'POST' }).then(function () { location.reload(); });
  });

  var tabs = document.querySelectorAll('.tab');
  Array.prototype.forEach.call(tabs, function (tab) {
    tab.addEventListener('click', function () {
      var name = tab.getAttribute('data-tab');
      Array.prototype.forEach.call(tabs, function (t) {
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (p) {
        p.classList.toggle('active', p.id === 'panel-' + name);
      });
    });
  });

  // ------------------------- 车辆列表 -------------------------

  function renderCars() {
    var box = $('carList');
    if (!state.cars.length) {
      box.innerHTML = '<div class="empty">还没有车辆<br>点击右上角「添加车辆」开始</div>';
      return;
    }

    var html = '';
    var canDrag = state.cars.length > 1;
    state.cars.forEach(function (car, index) {
      var sub = maskPhone(car.phone) + (car.enabled ? '' : ' · 已在扫码页隐藏');
      html +=
        '<div class="car-row' + (canDrag ? ' is-draggable' : '') + '" data-id="' + escapeHtml(car.id) +
        '" data-index="' + index + '">' +
        (canDrag
          ? '<span class="drag-handle" title="按住拖动排序" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="7" r="1.5"/><circle cx="15" cy="7" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="17" r="1.5"/><circle cx="15" cy="17" r="1.5"/></svg>' +
            '</span>'
          : '') +
        '<label class="switch" title="' + (car.enabled ? '点击在扫码页隐藏' : '点击在扫码页显示') + '">' +
        '<input type="checkbox" data-act="toggle"' + (car.enabled ? ' checked' : '') + ' aria-label="' +
        escapeHtml(car.plate) + ' 是否在扫码页显示">' +
        '<span></span>' +
        '</label>' +
        '<div class="car-row-main">' +
        '<div class="car-row-plate">' + escapeHtml(car.plate) + '</div>' +
        '<div class="car-row-sub">' + escapeHtml(sub) + '</div>' +
        '</div>' +
        '<div class="car-row-ops">' +
        '<button class="icon-btn" data-act="edit" type="button" aria-label="编辑">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="M14 6l4 4"/></svg>' +
        '</button>' +
        '<button class="icon-btn danger" data-act="del" type="button" aria-label="删除">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/></svg>' +
        '</button>' +
        '</div></div>';
    });
    box.innerHTML = html;
    bindDragSort();
  }

  // ------------------------- 拖拽排序 -------------------------
  //
  // 用 Pointer Events 而不是 HTML5 拖拽：后者在移动端浏览器基本不触发。
  // Pointer Events 一套代码同时覆盖鼠标、触屏和手写笔。
  // 只有按住左侧抓手才进入拖拽，避免和开关、编辑按钮冲突。

  var dragState = null;

  function bindDragSort() {
    var list = $('carList');
    var handles = list.querySelectorAll('.drag-handle');

    Array.prototype.forEach.call(handles, function (handle) {
      handle.addEventListener('pointerdown', onHandleDown);
      // 触屏长按会触发 contextmenu 弹出「复制」，这里直接吃掉
      handle.addEventListener('contextmenu', function (ev) {
        ev.preventDefault();
      });
      // 阻止抓手产生原生拖拽（图片/链接式），否则会与 pointer 逻辑打架
      handle.addEventListener('dragstart', function (ev) {
        ev.preventDefault();
      });
    });
  }

  function onHandleDown(ev) {
    // 只响应主键（鼠标左键 / 单指）
    if (ev.button !== undefined && ev.button !== 0) return;

    var row = ev.currentTarget.closest('.car-row');
    if (!row) return;

    ev.preventDefault();

    dragState = {
      id: row.getAttribute('data-id'),
      row: row,
      pointerId: ev.pointerId,
      startY: ev.clientY,
      dragging: false,
      locked: false,
    };

    // 从按下的瞬间就禁掉选中，避免鼠标一按就刷出蓝色选区
    document.body.classList.add('is-sorting');
    clearSelection();

    try {
      ev.currentTarget.setPointerCapture(ev.pointerId);
    } catch (e) {
      /* 忽略 */
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    document.addEventListener('selectstart', preventDuringSort);
  }

  function preventDuringSort(ev) {
    if (dragState) ev.preventDefault();
  }

  /** 清掉可能已经产生的选区（移动端长按有时在 pointerdown 前就选中了） */
  function clearSelection() {
    try {
      var sel = window.getSelection && window.getSelection();
      if (sel && sel.rangeCount) sel.removeAllRanges();
    } catch (e) {
      /* 忽略 */
    }
  }

  function onPointerMove(ev) {
    if (!dragState || dragState.locked) return;
    if (ev.pointerId !== dragState.pointerId) return;

    // 移动超过 6px 才算拖拽，避免误触
    if (!dragState.dragging) {
      if (Math.abs(ev.clientY - dragState.startY) < 6) return;
      dragState.dragging = true;
      dragState.row.classList.add('is-dragging');
    }

    ev.preventDefault();

    // 触摸拖动时阻止页面滚动
    var target = rowUnderPoint(ev.clientY);
    clearDropMarks();

    if (!target || target === dragState.row) return;

    dragState.targetId = target.getAttribute('data-id');
    var rect = target.getBoundingClientRect();
    var before = ev.clientY < rect.top + rect.height / 2;
    dragState.before = before;
    target.classList.add(before ? 'drag-over-top' : 'drag-over-bottom');
  }

  function onPointerUp(ev) {
    if (!dragState) return;
    if (ev.pointerId !== undefined && ev.pointerId !== dragState.pointerId) return;

    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    document.removeEventListener('selectstart', preventDuringSort);

    var drag = dragState;
    dragState = null;

    // renderCars 可能已重建节点，这里对 null 保持宽容
    if (drag.row) drag.row.classList.remove('is-dragging');
    document.body.classList.remove('is-sorting');
    clearDropMarks();

    if (!drag.dragging || !drag.targetId || drag.targetId === drag.id) return;

    var ids = state.cars.map(function (c) { return c.id; });
    var from = ids.indexOf(drag.id);
    if (from < 0) return;
    ids.splice(from, 1);

    var to = ids.indexOf(drag.targetId);
    if (to < 0) return;
    ids.splice(drag.before ? to : to + 1, 0, drag.id);

    applyOrder(ids);
  }

  /** 找出当前指针下方的车辆行，忽略被拖拽的那一行 */
  function rowUnderPoint(y) {
    var rows = $('carList').querySelectorAll('.car-row');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row === (dragState && dragState.row)) continue;
      var rect = row.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) return row;
    }
    return null;
  }

  function clearDropMarks() {
    var rows = $('carList').querySelectorAll('.car-row');
    Array.prototype.forEach.call(rows, function (r) {
      r.classList.remove('drag-over-top', 'drag-over-bottom');
    });
  }

  function applyOrder(ids) {
    // 先本地重排，界面立即响应
    var byId = {};
    state.cars.forEach(function (c) { byId[c.id] = c; });
    var next = [];
    ids.forEach(function (id) {
      if (byId[id]) next.push(byId[id]);
    });
    var previous = state.cars;
    state.cars = next;
    renderCars();

    api('/api/admin/cars/order', {
      method: 'POST',
      body: { ids: ids, rev: state.site.rev },
    })
      .then(function (data) {
        state.site = data.site;
        state.cars = data.site.cars || [];
        renderCars();
        toast('顺序已保存');
      })
      .catch(function (err) {
        state.cars = previous;
        renderCars();
        toast(err.message || '排序保存失败');
      });
  }

  $('carList').addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('[data-act]') : null;
    if (!btn) return;
    var row = btn.closest('.car-row');
    if (!row) return;
    var id = row.getAttribute('data-id');
    var car = null;
    state.cars.forEach(function (c) { if (c.id === id) car = c; });
    if (!car) return;

    var act = btn.getAttribute('data-act');

    if (act === 'edit') {
      openCarModal(car);
      return;
    }

    if (act === 'del') {
      if (!confirm('确定删除 ' + car.plate + ' 吗？删除后不可恢复。')) return;
      api('/api/admin/car?id=' + encodeURIComponent(id) + '&rev=' + state.site.rev, { method: 'DELETE' })
        .then(loadData)
        .then(function () { toast('已删除'); })
        .catch(function (err) { toast(err.message); });
    }
  });

  // 列表内开关：直接切换是否在扫码页显示
  $('carList').addEventListener('change', function (ev) {
    var input = ev.target;
    if (!input || input.getAttribute('data-act') !== 'toggle') return;

    var row = input.closest('.car-row');
    if (!row) return;
    var id = row.getAttribute('data-id');
    var car = null;
    state.cars.forEach(function (c) { if (c.id === id) car = c; });
    if (!car) return;

    var next = input.checked;
    input.disabled = true;

    api('/api/admin/car', {
      method: 'POST',
      body: {
        id: car.id,
        plate: car.plate,
        phone: car.phone,
        enabled: next,
        rev: state.site.rev,
      },
    })
      .then(function (data) {
        state.site = data.site;
        state.cars = data.site.cars || [];
        renderCars();
        toast(next ? '已设为在扫码页显示' : '已在扫码页隐藏');
      })
      .catch(function (err) {
        input.checked = !next;
        input.disabled = false;
        toast(err.message);
      });
  });

  // ------------------------- 车辆弹层 -------------------------

  function openCarModal(car) {
    $('carId').value = car ? car.id : '';
    $('carPlate').value = car ? car.plate : '';
    $('carPhone').value = car ? car.phone || '' : '';
    $('carModalTitle').textContent = car ? '编辑车辆' : '添加车辆';
    showAlert('carError', '');
    $('carModal').hidden = false;
    $('carPlate').focus();
  }

  function closeCarModal() {
    $('carModal').hidden = true;
  }

  $('addCarBtn').addEventListener('click', function () { openCarModal(null); });
  $('carCancelBtn').addEventListener('click', closeCarModal);
  $('carModal').addEventListener('click', function (ev) {
    if (ev.target === $('carModal')) closeCarModal();
  });

  $('carForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var existing = null;
    if ($('carId').value) {
      state.cars.forEach(function (c) { if (c.id === $('carId').value) existing = c; });
    }

    var payload = {
      id: $('carId').value || undefined,
      plate: $('carPlate').value,
      phone: $('carPhone').value,
      // 开关已移到列表里，弹层保存时保持原有可见状态
      enabled: existing ? existing.enabled !== false : true,
      rev: state.site.rev,
    };
    var btn = $('carSaveBtn');
    btn.disabled = true;
    showAlert('carError', '');
    api('/api/admin/car', { method: 'POST', body: payload })
      .then(function () {
        closeCarModal();
        return loadData();
      })
      .then(function () { toast('已保存，全球节点约 5 秒~5 分钟后生效'); })
      .catch(function (err) { showAlert('carError', err.message); })
      .then(function () { btn.disabled = false; });
  });

  // ------------------------- 页面设置 -------------------------

  $('settingsForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var btn = $('saveSettingsBtn');
    btn.disabled = true;
    api('/api/admin/page', {
      method: 'PUT',
      body: {
        title: $('pageTitle').value,
        notice: $('pageNotice').value,
        rev: state.site.rev,
      },
    })
      .then(loadData)
      .then(function () { toast('已保存'); })
      .catch(function (err) { toast(err.message); })
      .then(function () { btn.disabled = false; });
  });

  $('resetIdBtn').addEventListener('click', function () {
    if (!confirm('重置后当前二维码立即失效，需要重新下载并打印。确定继续吗？')) return;
    api('/api/admin/page/reset-id', { method: 'POST' })
      .then(loadData)
      .then(function () { toast('已生成新地址，旧二维码已失效'); })
      .catch(function (err) { showAlert('resetWarn', err.message); });
  });

  // ------------------------- 修改密码 -------------------------

  $('passwordForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var p1 = $('newPwd').value;
    var p2 = $('newPwd2').value;
    if (p1.length < 8) return showAlert('pwdError', '新密码至少 8 位');
    if (p1 !== p2) return showAlert('pwdError', '两次输入的新密码不一致');
    showAlert('pwdError', '');
    var btn = $('changePwdBtn');
    btn.disabled = true;
    api('/api/admin/password', {
      method: 'POST',
      body: { oldPassword: $('oldPwd').value, newPassword: p1 },
    })
      .then(function () {
        toast('密码已修改，请重新登录');
        setTimeout(function () { location.reload(); }, 1200);
      })
      .catch(function (err) {
        showAlert('pwdError', err.message);
        btn.disabled = false;
      });
  });

  // ------------------------- 二维码 -------------------------

  function renderQr(target, size) {
    if (!target) return;
    target.innerHTML = renderQrSvg(state.pageUrl, {
      pixelSize: size || 512,
      style: 'dot',
      ariaLabel: '挪车二维码',
    });
  }

  function refreshQr() {
    $('qrLink').textContent = state.pageUrl;
    $('qrLink').href = state.pageUrl;
    renderQr($('qrCanvas'), 600);
    renderQr($('printQr'), 800);
    $('printPlate').textContent = state.cars.length ? state.cars[0].plate : '';
  }

  $('copyLinkBtn').addEventListener('click', function () {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      toast('当前浏览器不支持自动复制，请长按链接手动复制');
      return;
    }
    navigator.clipboard.writeText(state.pageUrl)
      .then(function () { toast('链接已复制'); })
      .catch(function () { toast('复制失败，请手动选择'); });
  });

  function downloadBlob(name, blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  $('downloadSvgBtn').addEventListener('click', function () {
    var svg = renderQrSvg(state.pageUrl, { pixelSize: 1024 });
    downloadBlob('挪车二维码-' + state.site.id + '.svg', new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  });

  $('downloadPngBtn').addEventListener('click', function () {
    var btn = $('downloadPngBtn');
    btn.disabled = true;
    toImage(state.pageUrl, 1024, 'image/png')
      .then(function (blob) { downloadBlob('挪车二维码-' + state.site.id + '.png', blob); })
      .catch(function () { toast('导出失败，请改用 SVG'); })
      .then(function () { btn.disabled = false; });
  });

  $('downloadJpgBtn').addEventListener('click', function () {
    var btn = $('downloadJpgBtn');
    btn.disabled = true;
    toImage(state.pageUrl, 1024, 'image/jpeg', 0.92)
      .then(function (blob) { downloadBlob('挪车二维码-' + state.site.id + '.jpg', blob); })
      .catch(function () { toast('导出失败，请改用 SVG'); })
      .then(function () { btn.disabled = false; });
  });

  $('printBtn').addEventListener('click', function () {
    renderQr($('printQr'), 800);
    window.print();
  });

  /**
   * SVG → 位图。
   * JPEG 不支持透明，先铺满白底，否则圆形边缘会变成黑块。
   */
  function toImage(text, size, mime, quality) {
    return new Promise(function (resolve, reject) {
      var svg = renderQrSvg(text, { pixelSize: size });
      var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var img = new Image();

      img.onload = function () {
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          function (b) {
            if (b) resolve(b);
            else reject(new Error('导出失败'));
          },
          mime,
          quality
        );
      };

      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('导出失败'));
      };

      img.src = url;
    });
  }

  // ------------------------- 数据加载 -------------------------

  function loadData() {
    return api('/api/admin/session').then(function (data) {
      state.site = data.site;
      state.cars = data.site.cars || [];
      state.pageUrl = data.pageUrl;

      $('pageTitle').value = data.site.title || '';
      $('pageNotice').value = data.site.notice || '';
      renderCars();
      refreshQr();
    });
  }

  loadData().catch(function (err) {
    toast(err.message || '加载失败');
  });
})();
