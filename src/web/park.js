(function () {
  'use strict';

  var stateNode = document.getElementById('parkState');
  if (!stateNode) return;

  var state;
  try {
    state = JSON.parse(stateNode.textContent || '{}');
  } catch (e) {
    return;
  }

  var cars = state.cars || [];
  if (!cars.length) return;

  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  var busy = false;

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2600);
  }

  // ------------------------- 手风琴 -------------------------

  var items = Array.prototype.slice.call(document.querySelectorAll('.acc-item[data-car-id]'));

  function closeItem(item) {
    item.classList.remove('is-open');
    var head = item.querySelector('.acc-head');
    if (head) head.setAttribute('aria-expanded', 'false');
  }

  function openItem(item) {
    item.classList.add('is-open');
    var head = item.querySelector('.acc-head');
    if (head) head.setAttribute('aria-expanded', 'true');
  }

  items.forEach(function (item) {
    var head = item.querySelector('.acc-head');
    if (!head) return;
    head.addEventListener('click', function () {
      if (item.classList.contains('is-open')) return;
      // 同时只展开一辆，避免列表过长把呼叫按钮挤出屏幕
      items.forEach(closeItem);
      openItem(item);
    });
  });

  // ------------------------- 拨号 -------------------------

  function maskPhone(phone) {
    if (!phone || phone.length < 7) return phone || '';
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  }

  // 页面 HTML 中不含手机号，点击时才向后端取号。
  // 示例页（demo）用内置的虚构号码，不请求接口。
  function fetchPhone(carId) {
    if (state.demo) {
      var fake = (state.phones || {})[carId];
      if (!fake) return Promise.reject(new Error('示例数据缺失'));
      return Promise.resolve({ phone: fake, plate: '' });
    }

    return fetch('/api/p/' + encodeURIComponent(state.pageId) + '/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'fetch',
      },
      body: JSON.stringify({ carId: carId }),
      credentials: 'omit',
      cache: 'no-store',
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok || !data.ok) {
          var err = new Error((data && data.message) || '获取号码失败');
          err.code = data && data.code;
          throw err;
        }
        return data.data;
      });
    });
  }

  // 示例页不真的拨号，只提示
  function dial(phone) {
    if (state.demo) {
      toast('示例页面不会真的拨号');
      return;
    }
    window.location.href = 'tel:' + phone;
  }

  function confirmDialog(phone) {
    var wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML =
      '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="cfmTitle" style="max-width:340px;text-align:center">' +
      '<h2 id="cfmTitle" class="cfm-title">确认拨打电话</h2>' +
      '<p class="cfm-sub">即将拨打</p>' +
      '<p class="cfm-phone">' + maskPhone(phone) + '</p>' +
      '<div class="cfm-actions">' +
      '<button type="button" class="btn cfm-cancel" data-act="cancel">取消</button>' +
      '<button type="button" class="btn cfm-ok" data-act="ok">呼叫</button>' +
      '</div></div>';

    document.body.appendChild(wrap);

    function close() {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }

    wrap.addEventListener('click', function (ev) {
      var act = ev.target.getAttribute && ev.target.getAttribute('data-act');
      if (act === 'ok') {
        close();
        dial(phone);
      } else if (act === 'cancel' || ev.target === wrap) {
        close();
      }
    });

    var okBtn = wrap.querySelector('[data-act="ok"]');
    if (okBtn) okBtn.focus();
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('.call-btn[data-call-id]') : null;
    if (!btn || busy) return;

    var carId = btn.getAttribute('data-call-id');
    if (!carId) return;

    busy = true;
    var label = btn.querySelector('.call-label');
    var original = label ? label.textContent : '';
    if (label) label.textContent = '正在获取号码…';
    btn.setAttribute('disabled', 'disabled');

    fetchPhone(carId)
      .then(function (data) {
        confirmDialog(data.phone);
      })
      .catch(function (err) {
        if (err.code === 'RATE_LIMITED') {
          toast('请求过于频繁，请稍后再试');
        } else {
          toast(err.message || '获取号码失败，请稍后重试');
        }
      })
      .then(function () {
        busy = false;
        btn.removeAttribute('disabled');
        if (label) label.textContent = original || '一键呼叫车主';
      });
  });
})();
