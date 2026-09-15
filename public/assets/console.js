(function () {
  var MODULE_TITLES = {
    releases: '发布记录',
    'env-config': '环境配置',
    'access-logs': '访问日志',
  };

  // 1. 会话校验：未登录直接回登录页
  function checkSession() {
    return fetch('/api/auth/me', { headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (res.status === 401) {
          window.location.replace('/');
          return null;
        }
        return res.json();
      })
      .then(function (body) {
        if (body && body.code === 0) {
          document.getElementById('current-user').textContent = body.data.user.username;
        }
      })
      .catch(function () {
        window.location.replace('/');
      });
  }

  // 2. 菜单切换
  function initNav() {
    var navItems = document.querySelectorAll('.nav-item');
    var panels = document.querySelectorAll('.module-panel');
    navItems.forEach(function (item) {
      item.addEventListener('click', function () {
        navItems.forEach(function (n) { n.classList.toggle('active', n === item); });
        var mod = item.dataset.module;
        panels.forEach(function (p) { p.hidden = p.dataset.panel !== mod; });
        document.getElementById('page-title').textContent = MODULE_TITLES[mod] || '';
      });
    });
  }

  // 3. 占位接口连通性检测
  function initApiStatus() {
    document.querySelectorAll('[data-api-status]').forEach(function (el) {
      var url = el.dataset.apiStatus;
      fetch(url, { headers: { Accept: 'application/json' } })
        .then(function (res) {
          return res.json().catch(function () { return null; }).then(function (body) {
            if (res.ok && body && body.code === 0) {
              el.innerHTML = '<span class="dot ok"></span> 占位接口已连通 <code>' + url + '</code>';
            } else if (res.status === 401) {
              window.location.replace('/');
            } else {
              el.innerHTML = '<span class="dot err"></span> 接口异常：' + ((body && body.message) || res.status);
            }
          });
        })
        .catch(function () {
          el.innerHTML = '<span class="dot err"></span> 接口不可达';
        });
    });
  }

  // 4. 退出登录：销毁服务端会话后回登录页
  function initLogout() {
    document.getElementById('logout-btn').addEventListener('click', function () {
      fetch('/api/auth/logout', { method: 'POST' })
        .catch(function () { /* 忽略网络异常，仍回登录页 */ })
        .finally(function () {
          window.location.replace('/');
        });
    });
  }

  checkSession().then(function () {
    initNav();
    initApiStatus();
    initLogout();
  });
})();
