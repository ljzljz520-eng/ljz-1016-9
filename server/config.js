'use strict';
const fs = require('fs');
const path = require('path');

// 轻量 .env 加载（不依赖第三方包；系统环境变量优先）
(function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2].replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = val;
  }
})();

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  isProd,
  port: Number(process.env.PORT || 3000),
  sessionCookieName: 'ops.sid',
  sessionSecret: process.env.SESSION_SECRET || 'dev-only-insecure-secret-change-me',
  sessionTtlMs: Number(process.env.SESSION_TTL_MS || 2 * 60 * 60 * 1000),
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProd,
};
