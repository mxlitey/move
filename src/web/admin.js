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
      var phones = phoneListOf(car);
      var primary = phones.find(function (p) { return p.primary; }) || phones[0] || { phone: '' };

      // 其余号码用 chip 展示，点击即置顶
      var chips = '';
      phones.forEach(function (p) {
        if (p.id === primary.id) return;
        chips +=
          '<button type="button" class="phone-chip" data-act="pin" data-phone-id="' + escapeHtml(p.id) +
          '" title="点击设为呼叫号码">' + escapeHtml(maskPhone(p.phone)) + '</button>';
      });

      html +=
        '<div class="car-row' + (canDrag ? ' is-draggable' : '') + '" data-id="' + escapeHtml(car.id) +
        '" data-index="' + index + '">' +
        (canDrag
          ? '<span class="drag-handle" role="button" tabindex="-1" title="按住拖动排序">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="7" r="1.5"/><circle cx="15" cy="7" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="17" r="1.5"/><circle cx="15" cy="17" r="1.5"/></svg>' +
            '</span>'
          : '') +
        '<label class="switch" title="' + (car.enabled ? '点击在扫码页隐藏' : '点击在扫码页显示') + '">' +
        '<input type="checkbox" data-act="toggle"' + (car.enabled ? ' checked' : '') + ' aria-label="' +
        escapeHtml(car.plate) + ' 是否在扫码页显示">' +
        '<span></span>' +
        '</label>' +
        '<div class="car-row-main">' +
        '<div class="car-row-plate">' + escapeHtml(car.plate) +
        (car.enabled ? '' : '<span class="tag-off">已隐藏</span>') +
        '</div>' +
        '<div class="car-row-sub">' +
        '<span class="primary-phone" title="扫码时呼叫此号码">' + escapeHtml(maskPhone(primary.phone)) + '</span>' +
        (chips ? '<span class="phone-chips">' + chips + '</span>' : '') +
        '</div>' +
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

  /** 兼容早期的单 phone 字段 */
  function phoneListOf(car) {
    if (Array.isArray(car.phones) && car.phones.length) return car.phones;
    if (car.phone) return [{ id: 'legacy', phone: car.phone, primary: true }];
    return [];
  }

  // ------------------------- 拖拽排序 -------------------------
  //
  // 交互：按住整行任意位置（按钮/开关除外）→ 虚化缩放；
  // 拖动 → 浮动卡片跟手，落点出现虚线占位框；松手 → 落到占位处。
  //
  // 鼠标：按下后移动 4px 即进入拖拽。
  // 触屏：长按 220ms 进入拖拽；期间移动超过 10px 视为滚动页面，不拖拽。

  var drag = null;
  var pressTimer = null;

  function bindDragSort() {
    var list = $('carList');
    if (list.getAttribute('data-drag-bound') === '1') return;
    list.setAttribute('data-drag-bound', '1');

    list.addEventListener('pointerdown', onListPointerDown);

    // 长按可能弹出系统菜单，整行都拦掉
    list.addEventListener('contextmenu', function (ev) {
      if (ev.target.closest && ev.target.closest('.car-row.is-draggable')) ev.preventDefault();
    });

    // 阻止浏览器原生拖拽（图片/文本）打断我们的逻辑
    list.addEventListener('dragstart', function (ev) {
      if (ev.target.closest && ev.target.closest('.car-row.is-draggable')) ev.preventDefault();
    });
  }

  /** 这些控件上的按下不应触发拖拽 */
  function isInteractive(target) {
    return !!(target.closest && target.closest('button, input, select, textarea, a, label'));
  }

  function onListPointerDown(ev) {
    if (drag) return;
    if (typeof ev.button === 'number' && ev.button !== 0) return;
    if (isInteractive(ev.target)) return;

    var row = ev.target.closest && ev.target.closest('.car-row');
    if (!row || !row.classList.contains('is-draggable')) return;
    if ($('carList').querySelectorAll('.car-row').length < 2) return;

    ev.preventDefault();
    clearSelection();

    var rect = row.getBoundingClientRect();
    drag = {
      id: row.getAttribute('data-id'),
      row: row,
      pointerId: ev.pointerId,
      pointerType: ev.pointerType || 'mouse',
      startY: ev.clientY,
      offsetY: ev.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      active: false,
      ghost: null,
      placeholder: null,
      beforeId: null,
    };

    // 按住立即给出反馈
    row.classList.add('is-pressed');
    document.body.classList.add('is-sorting');

    if (drag.pointerType === 'mouse') {
      // 鼠标：轻微移动就进入拖拽
      drag.armOnMove = true;
    } else {
      // 触屏：长按一小会儿再进入拖拽，留出正常滚动页面的余地
      drag.armOnMove = false;
      pressTimer = setTimeout(function () {
        pressTimer = null;
        if (drag && !drag.active) activateDrag();
      }, 220);
    }

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    document.addEventListener('selectstart', preventDuringSort);
  }

  function preventDuringSort(ev) {
    if (drag) ev.preventDefault();
  }

  function clearSelection() {
    try {
      var sel = window.getSelection && window.getSelection();
      if (sel && sel.rangeCount) sel.removeAllRanges();
    } catch (e) {
      /* 忽略 */
    }
  }

  function clearPressTimer() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  function onPointerMove(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;

    var dy = Math.abs(ev.clientY - drag.startY);

    if (!drag.active) {
      // 触屏还没到长按时间就往一个方向滑了 → 当成滚动，放弃拖拽
      if (!drag.armOnMove) {
        if (dy > 10) {
          cancelPendingPress();
        }
        return;
      }
      // 鼠标：移动 4px 进入拖拽
      if (dy < 4) return;
      activateDrag();
    }

    ev.preventDefault();

    var top = ev.clientY - drag.offsetY;
    drag.ghost.style.transform = 'translate3d(0,' + top + 'px,0) scale(1.02)';

    updatePlaceholder(ev.clientY);
  }

  /** 触屏误触滚动时放弃拖拽，但恢复原状 */
  function cancelPendingPress() {
    clearPressTimer();
    endDrag();
  }

  function activateDrag() {
    clearPressTimer();
    if (!drag || drag.active) return;

    drag.active = true;

    var row = drag.row;
    var rect = row.getBoundingClientRect();

    // 浮动卡片
    var ghost = row.cloneNode(true);
    ghost.className = 'car-row drag-ghost';
    ghost.style.width = drag.width + 'px';
    ghost.style.height = drag.height + 'px';
    ghost.style.left = rect.left + 'px';
    ghost.style.transform = 'translate3d(0,' + rect.top + 'px,0) scale(1.02)';
    document.body.appendChild(ghost);
    drag.ghost = ghost;

    // 虚线占位框
    var ph = document.createElement('div');
    ph.className = 'drag-placeholder';
    ph.style.height = drag.height + 'px';
    drag.placeholder = ph;

    row.classList.remove('is-pressed');
    row.classList.add('is-source');
    row.parentNode.insertBefore(ph, row.nextSibling);

    // 真正拖起来之后锁住页面滚动
    document.body.classList.add('is-dragging-page');

    // 触屏：进入拖拽后彻底阻断页面滚动
    if (drag.pointerType !== 'mouse') {
      document.addEventListener('touchmove', blockTouchMove, { passive: false });
    }
  }

  function blockTouchMove(ev) {
    if (drag && drag.active) ev.preventDefault();
  }

  /** 根据指针位置把占位框移动到对应位置 */
  function updatePlaceholder(y) {
    var ph = drag.placeholder;
    if (!ph) return;

    var rows = Array.prototype.filter.call(
      $('carList').querySelectorAll('.car-row'),
      function (r) { return !r.classList.contains('is-source') && !r.classList.contains('drag-ghost'); }
    );

    var list = $('carList');
    var beforeRow = null;

    for (var i = 0; i < rows.length; i++) {
      var rect = rows[i].getBoundingClientRect();
      if (y < rect.top + rect.height / 2) {
        beforeRow = rows[i];
        break;
      }
    }

    drag.beforeId = beforeRow ? beforeRow.getAttribute('data-id') : null;

    if (beforeRow) {
      if (ph.nextSibling !== beforeRow) list.insertBefore(ph, beforeRow);
    } else if (list.lastElementChild !== ph) {
      list.appendChild(ph);
    }
  }

  function onPointerUp(ev) {
    if (!drag || (ev.pointerId !== undefined && ev.pointerId !== drag.pointerId)) return;

    var finished = drag;
    var active = finished.active;
    var beforeId = finished.beforeId;

    endDrag();

    if (!active) return;

    var ids = state.cars.map(function (c) { return c.id; });
    var from = ids.indexOf(finished.id);
    if (from < 0) return;
    ids.splice(from, 1);

    var to = beforeId ? ids.indexOf(beforeId) : ids.length;
    if (to < 0) to = ids.length;
    ids.splice(to, 0, finished.id);

    applyOrder(ids);
  }

  function onPointerCancel(ev) {
    if (!drag || (ev.pointerId !== undefined && ev.pointerId !== drag.pointerId)) return;
    endDrag();
  }

  function endDrag() {
    clearPressTimer();

    var finished = drag;
    drag = null;

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
    document.removeEventListener('selectstart', preventDuringSort);
    document.removeEventListener('touchmove', blockTouchMove);

    document.body.classList.remove('is-sorting');
    document.body.classList.remove('is-dragging-page');

    if (!finished) return;
    if (finished.ghost && finished.ghost.parentNode) finished.ghost.parentNode.removeChild(finished.ghost);
    if (finished.placeholder && finished.placeholder.parentNode) {
      finished.placeholder.parentNode.removeChild(finished.placeholder);
    }
    if (finished.row) {
      finished.row.classList.remove('is-pressed');
      finished.row.classList.remove('is-source');
    }
  }

  function clearDropMarks() {
    // 占位框在 endDrag 中统一清理，这里保留空实现以便旧调用兼容
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

    if (act === 'pin') {
      var phoneId = btn.getAttribute('data-phone-id');
      btn.disabled = true;
      api('/api/admin/car/primary-phone', {
        method: 'POST',
        body: { carId: car.id, phoneId: phoneId, rev: state.site.rev },
      })
        .then(function (data) {
          state.site = data.site;
          state.cars = data.site.cars || [];
          renderCars();
          toast('已设为呼叫号码');
        })
        .catch(function (err) {
          btn.disabled = false;
          toast(err.message);
        });
      return;
    }

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
        phones: phoneListOf(car),
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

  // 弹层里正在编辑的号码列表，结构与后端一致
  var modalPhones = [];

  function renderModalPhones() {
    var box = $('phoneList');
    var html = '';

    modalPhones.forEach(function (p, i) {
      html +=
        '<div class="phone-row' + (p.primary ? ' is-primary' : '') + '" data-phone-id="' + escapeHtml(p.id) + '">' +
        '<input class="input" type="tel" inputmode="numeric" maxlength="11" data-phone-input ' +
        'placeholder="11 位手机号" value="' + escapeHtml(p.phone) + '">' +
        '<button type="button" class="phone-pin' + (p.primary ? ' active' : '') + '" data-phone-pin ' +
        'title="' + (p.primary ? '当前呼叫号码' : '设为呼叫号码') + '">呼叫</button>' +
        (modalPhones.length > 1
          ? '<button type="button" class="icon-btn danger" data-phone-del aria-label="删除该号码">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/></svg>' +
            '</button>'
          : '') +
        '</div>';
      void i;
    });

    box.innerHTML = html;
    $('addPhoneBtn').disabled = modalPhones.length >= 5;
  }

  function collectModalPhones() {
    var rows = $('phoneList').querySelectorAll('.phone-row');
    var out = [];
    Array.prototype.forEach.call(rows, function (row) {
      var input = row.querySelector('[data-phone-input]');
      var pin = row.querySelector('[data-phone-pin]');
      out.push({
        id: row.getAttribute('data-phone-id'),
        phone: input ? input.value.trim() : '',
        primary: pin ? pin.classList.contains('active') : false,
      });
    });
    return out;
  }

  function openCarModal(car) {
    $('carId').value = car ? car.id : '';
    $('carPlate').value = car ? car.plate : '';

    var phones = car ? phoneListOf(car) : [];
    modalPhones = phones.length
      ? phones.map(function (p) { return { id: p.id, phone: p.phone, primary: p.primary === true }; })
      : [{ id: newPhoneId(), phone: '', primary: true }];

    if (!modalPhones.some(function (p) { return p.primary; })) modalPhones[0].primary = true;

    $('carModalTitle').textContent = car ? '编辑车辆' : '添加车辆';
    renderModalPhones();
    showAlert('carError', '');
    $('carModal').hidden = false;
    $('carPlate').focus();
  }

  function newPhoneId() {
    return 'p' + Math.random().toString(36).slice(2, 8);
  }

  function closeCarModal() {
    $('carModal').hidden = true;
  }

  $('addCarBtn').addEventListener('click', function () { openCarModal(null); });
  $('carCancelBtn').addEventListener('click', closeCarModal);
  $('carModal').addEventListener('click', function (ev) {
    if (ev.target === $('carModal')) closeCarModal();
  });

  $('addPhoneBtn').addEventListener('click', function () {
    modalPhones = collectModalPhones();
    if (modalPhones.length >= 5) return;
    modalPhones.push({ id: newPhoneId(), phone: '', primary: false });
    renderModalPhones();
    var inputs = $('phoneList').querySelectorAll('[data-phone-input]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  // 号码行的置顶与删除（事件委托，重新渲染后仍有效）
  $('phoneList').addEventListener('click', function (ev) {
    var pinBtn = ev.target.closest ? ev.target.closest('[data-phone-pin]') : null;
    if (pinBtn) {
      var row = pinBtn.closest('.phone-row');
      var id = row.getAttribute('data-phone-id');
      modalPhones = collectModalPhones().map(function (p) {
        return { id: p.id, phone: p.phone, primary: p.id === id };
      });
      renderModalPhones();
      return;
    }

    var delBtn = ev.target.closest ? ev.target.closest('[data-phone-del]') : null;
    if (delBtn) {
      var delRow = delBtn.closest('.phone-row');
      var delId = delRow.getAttribute('data-phone-id');
      var remaining = collectModalPhones().filter(function (p) { return p.id !== delId; });
      if (!remaining.length) return;
      if (!remaining.some(function (p) { return p.primary; })) remaining[0].primary = true;
      modalPhones = remaining;
      renderModalPhones();
    }
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
      phones: collectModalPhones(),
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

  // ------------------------- 自定义页面地址 -------------------------

  function refreshPageIdPreview() {
    var value = $('pageIdInput').value.trim().toLowerCase();
    var el = $('pageIdPreview');
    if (!value) {
      el.textContent = '';
      return;
    }
    el.textContent = '将发布到：' + location.origin + '/p/' + value;
  }

  $('pageIdInput').addEventListener('input', function () {
    // 只允许小写字母和数字，中文输入法或大写自动纠正
    var cleaned = this.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (cleaned !== this.value) this.value = cleaned;
    showAlert('pageIdWarn', '');
    refreshPageIdPreview();
  });

  $('pageIdForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var id = $('pageIdInput').value.trim().toLowerCase();

    if (!/^[a-z0-9]{4,16}$/.test(id)) {
      return showAlert('pageIdWarn', '地址只能包含小写字母和数字，长度 4-16 位');
    }

    if (id === state.site.id) {
      return showAlert('pageIdWarn', '与当前地址相同，无需修改');
    }

    var changing = confirm(
      '地址将从 /p/' + state.site.id + ' 改为 /p/' + id + '\n\n' +
      '原有二维码将失效，需要重新下载打印。确定修改吗？'
    );
    if (!changing) return;

    var btn = $('savePageIdBtn');
    btn.disabled = true;
    showAlert('pageIdWarn', '');

    api('/api/admin/page/id', { method: 'PUT', body: { id: id, rev: state.site.rev } })
      .then(function (data) {
        state.site = data.site;
        state.pageUrl = data.pageUrl;
        $('pageIdInput').value = data.site.id;
        refreshPageIdPreview();
        refreshQr();
        toast('地址已更新，请重新下载二维码');
      })
      .catch(function (err) { showAlert('pageIdWarn', err.message); })
      .then(function () { btn.disabled = false; });
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
      $('pageIdInput').value = data.site.id || '';
      $('pageIdPreview').textContent = data.pageUrl ? '当前地址：' + data.pageUrl : '';
      renderCars();
      refreshQr();
    });
  }

  loadData().catch(function (err) {
    toast(err.message || '加载失败');
  });
})();
