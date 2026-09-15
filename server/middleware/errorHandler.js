'use strict';
const ApiError = require('../utils/apiError');

/** /api 下的 404：统一 JSON 错误 */
function apiNotFound(req, res, next) {
  next(ApiError.notFound(`接口不存在：${req.method} ${req.originalUrl}`));
}

/**
 * 统一错误出口：任何 throw / next(err) 都会走到这里，
 * 对外始终返回 { code, message, data: null }。
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // 业务错误
  if (err instanceof ApiError) {
    return res.status(err.status).json({ code: err.code, message: err.message, data: null });
  }
  // body-parser：JSON 格式错误 / 体积超限
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ code: 40000, message: '请求体不是合法的 JSON', data: null });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ code: 41300, message: '请求体过大', data: null });
  }
  // 未知错误：记录日志，对外隐藏细节
  console.error('[unhandled-error]', err);
  return res.status(500).json({ code: 50000, message: '服务器内部错误', data: null });
}

module.exports = { apiNotFound, errorHandler };
