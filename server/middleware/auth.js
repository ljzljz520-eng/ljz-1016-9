'use strict';
const ApiError = require('../utils/apiError');

/** 要求已登录（session 中存在用户），否则 401 */
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return next(ApiError.unauthorized());
}

module.exports = { requireAuth };
