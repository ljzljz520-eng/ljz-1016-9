'use strict';
const ApiError = require('../utils/apiError');

/**
 * 简易内存滑动窗口限流器（适用于单进程部署；多实例请改用 Redis 等共享存储）
 */
function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map(); // key -> number[]
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, arr] of hits) {
      const kept = arr.filter((t) => now - t < windowMs);
      if (kept.length === 0) hits.delete(key);
      else hits.set(key, kept);
    }
  }, windowMs);
  timer.unref();

  return function rateLimit(req, res, next) {
    const key = req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) return next(ApiError.tooMany(message));
    arr.push(now);
    hits.set(key, arr);
    return next();
  };
}

module.exports = { createRateLimiter };
