'use strict';
const express = require('express');

const router = express.Router();

// 以下为三个菜单的占位接口：结构已就绪，后续替换为真实业务数据

/** GET /api/releases 发布记录（占位） */
router.get('/releases', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: { module: 'releases', placeholder: true, items: [], hint: '发布记录模块建设中' },
  });
});

/** GET /api/env-config 环境配置（占位） */
router.get('/env-config', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: { module: 'env-config', placeholder: true, items: [], hint: '环境配置模块建设中' },
  });
});

/** GET /api/access-logs 访问日志（占位） */
router.get('/access-logs', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: { module: 'access-logs', placeholder: true, items: [], hint: '访问日志模块建设中' },
  });
});

module.exports = router;
