'use strict';
const config = require('./config');
const { createApp } = require('./app');
const userStore = require('./utils/userStore');

if (config.isProd && config.sessionSecret === 'dev-only-insecure-secret-change-me') {
  console.warn('[warn] 生产环境正在使用默认 SESSION_SECRET，请立即通过环境变量更换！');
}

const app = createApp();
app.listen(config.port, () => {
  console.log(`[ops-console] 发布运维台已启动: http://0.0.0.0:${config.port} (${config.isProd ? 'production' : 'development'})`);
  if (userStore.count() === 0) {
    console.warn('[ops-console] 尚未创建管理员账号，请先执行: npm run init:admin');
  }
});
