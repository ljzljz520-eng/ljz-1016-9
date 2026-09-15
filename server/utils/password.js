'use strict';
const crypto = require('crypto');

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 };

/** 生成 scrypt 加盐哈希，格式：scrypt$N$salt$hash */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTS).toString('hex');
  return `scrypt$${SCRYPT_OPTS.N}$${salt}$${hash}`;
}

/** 校验密码（时序安全比较） */
function verifyPassword(password, stored) {
  try {
    const [algo, nStr, salt, hash] = String(stored).split('$');
    if (algo !== 'scrypt' || !salt || !hash) return false;
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, { ...SCRYPT_OPTS, N: Number(nStr) });
    const expected = Buffer.from(hash, 'hex');
    return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
