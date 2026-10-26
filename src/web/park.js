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

  var selectedId = cars.length === 1 ? cars[0].id : cars[0].id;
  var callBtn = document.getElementById('callBtn');
  var callLabel = document.getElementById('callLabel');
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

  var cards = document.querySelectorAll('.car[data-car-id]');
  for (var i = 0; i < cards.length; i++) {
    cards[i].addEventListener('click', function () {
      selectedId = this.getAttribute('data-car-id');
      for (var j = 0; j < cards.length; j++) {
        cards[j].setAttribute('aria-checked', cards[j] === this ? 'true' : 'false');
      }
    });
  }

  function maskPhone(phone) {
    if (!phone || phone.length < 7) return phone || '';
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  }

  // 页面 HTML 中不含手机号，点击时才向后端取号
  function fetchPhone(carId) {
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

  function dial(phone) {
    window.location.href = 'tel:' + phone;
  }

  function confirmDialog(phone) {
    var wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML =
      '<div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="cfmTitle" style="max-width:340px;text-align:center">' +
      '<h2 id="cfmTitle" style="margin:4px 0 8px;font-size:17px">确认拨打电话</h2>' +
      '<p style="margin:0 0 4px;color:var(--ink-2);font-size:13.5px">即将拨打</p>' +
      '<p style="margin:0 0 18px;font-size:22px;font-weight:700;letter-spacing:.04em;font-variant-numeric:tabular-nums">' +
      maskPhone(phone) +
      '</p>' +
      '<div style="display:flex;gap:10px">' +
      '<button type="button" class="btn btn-ghost" data-act="cancel" style="flex:1">取消</button>' +
      '<button type="button" class="btn" data-act="ok" style="flex:1;background:var(--call)">呼叫</button>' +
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

  if (callBtn) {
    callBtn.addEventListener('click', function () {
      if (busy || !selectedId) return;
      busy = true;
      var original = callLabel ? callLabel.textContent : '';
      if (callLabel) callLabel.textContent = '正在获取号码…';
      callBtn.setAttribute('disabled', 'disabled');

      fetchPhone(selectedId)
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
          callBtn.removeAttribute('disabled');
          if (callLabel) callLabel.textContent = original || '一键呼叫车主';
        });
    });
  }
})();
