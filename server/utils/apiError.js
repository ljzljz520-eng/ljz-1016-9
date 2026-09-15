'use strict';

/**
 * 业务错误：携带 HTTP 状态码与业务错误码。
 * 统一响应格式：{ code, message, data }，code 为 0 表示成功。
 */
class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  static badRequest(msg = '请求参数错误') { return new ApiError(400, 40000, msg); }
  static unauthorized(msg = '未登录或会话已过期') { return new ApiError(401, 40100, msg); }
  static forbidden(msg = '没有权限执行该操作') { return new ApiError(403, 40300, msg); }
  static notFound(msg = '资源不存在') { return new ApiError(404, 40400, msg); }
  static tooMany(msg = '请求过于频繁，请稍后再试') { return new ApiError(429, 42900, msg); }
  static internal(msg = '服务器内部错误') { return new ApiError(500, 50000, msg); }
}

module.exports = ApiError;
