'use strict';
const path = require('path');
const express = require('express');
const session = require('express-session');
const config = require('./config');
const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const { requireAuth } = require('./middleware/auth');
const { apiNotFound, errorHandler } = require('./middleware/errorHandler');

const VIEWS_DIR = path.join(__dirname, 'views');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // 部署在 Nginx 等反向代理之后时，正确识别客户端 IP 与 HTTPS
  app.set('trust proxy', 1);

  // 基础安全响应头
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    next();
  });

  app.use(express.json({ limit: '100kb' }));

  // 基于 Cookie 的 Session（默认内存存储，生产环境请外置 Redis，见 README）
  app.use(session({
    name: config.sessionCookieName,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true, // 每次请求顺延过期时间
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.cookieSecure,
      maxAge: config.sessionTtlMs,
    },
  }));

  // ---------- API ----------
  app.use('/api/auth', authRoutes);
  app.use('/api', requireAuth, moduleRoutes); // 业务接口统一要求登录
  app.use('/api', apiNotFound);               // API 404 → 统一 JSON

  // ---------- 页面 ----------
  app.get('/', (req, res) => {
    if (req.session && req.session.user) return res.redirect('/console');
    return res.sendFile(path.join(VIEWS_DIR, 'login.html'));
  });
  app.get('/console', (req, res) => {
    if (!req.session || !req.session.user) return res.redirect('/');
    return res.sendFile(path.join(VIEWS_DIR, 'console.html'));
  });

  // 静态资源（css / js）
  app.use(express.static(PUBLIC_DIR, { index: false, maxAge: '1h' }));

  // 其余未知路径回到入口
  app.use((req, res) => res.redirect('/'));

  // ---------- 统一错误处理（必须最后注册） ----------
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
