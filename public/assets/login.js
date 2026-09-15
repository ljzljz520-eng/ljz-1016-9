(function () {
  var form = document.getElementById('login-form');
  var errorBox = document.getElementById('login-error');
  var btn = document.getElementById('login-btn');

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.hidden = true;

    var username = document.getElementById('username').value.trim();
    var password = document.getElementById('password').value;
    if (!username || !password) {
      showError('请输入用户名和密码');
      return;
    }

    btn.disabled = true;
    btn.textContent = '登录中…';

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ username: username, password: password }),
    })
      .then(function (res) {
        return res.json().catch(function () { return null; }).then(function (body) {
          if (res.ok && body && body.code === 0) {
            window.location.replace('/console');
          } else {
            showError((body && body.message) || '登录失败，请稍后重试');
          }
        });
      })
      .catch(function () {
        showError('网络异常，请稍后重试');
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = '登 录';
      });
  });
})();
