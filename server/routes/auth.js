'use strict';
const express = require('express');
const ApiError = require('../utils/apiError');
const config = require('../config');
const { verifyPassword } = require('../utils/password');
const userStore = require('../utils/userStore');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// 登录接口限流：每 IP 每分钟最多 10 次
const loginLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: '登录尝试过于频繁，请 1 分钟后再试',
});

/**
 * POST /api/auth/login
 * body: { username, password }
 */
router.post('/login', loginLimiter, (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
      throw ApiError.badRequest('用户名和密码不能为空');
    }
    const user = userStore.findByUsername(username.trim());
    if (!user || !verifyPassword(password, user.passwordHash)) {
      throw new ApiError(401, 40101, '用户名或密码错误');
    }
    // 登录成功后重建会话，防止会话固定攻击
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = { id: user.id, username: user.username, role: user.role };
      return res.json({ code: 0, message: 'ok', data: { user: req.session.user } });
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * 销毁服务端 session 并清理客户端 Cookie
 */
router.post('/logout', (req, res) => {
  const done = () => {
    res.clearCookie(config.sessionCookieName, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.cookieSecure,
      path: '/',
    });
    return res.json({ code: 0, message: 'ok', data: null });
  };
  if (!req.session) return done();
  req.session.destroy((err) => {
    if (err) console.error('[logout] session destroy failed:', err);
    // 即使服务端销毁失败，也清理客户端 Cookie，保证状态一致
    return done();
  });
});

/**
 * GET /api/auth/me
 * 获取当前登录用户（前端据此判断会话是否有效）
 */
router.get('/me', (req, res, next) => {
  if (!req.session || !req.session.user) {
    return next(ApiError.unauthorized());
  }
  return res.json({ code: 0, message: 'ok', data: { user: req.session.user } });
});

module.exports = router;
