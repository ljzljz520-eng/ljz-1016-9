#!/usr/bin/env node
'use strict';
/**
 * 初始化 / 重置管理员账号
 *
 * 用法：
 *   node scripts/init-admin.js                              # 用户名默认 admin，自动生成随机密码
 *   node scripts/init-admin.js --password 'YourPass123'     # 指定密码（至少 8 位）
 *   node scripts/init-admin.js --username ops --force       # 重置已存在的账号
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=xxx node scripts/init-admin.js
 */
const crypto = require('crypto');
const { hashPassword } = require('../server/utils/password');
const userStore = require('../server/utils/userStore');

function parseArgs(argv) {
  const args = { username: null, password: null, force: false, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--force') args.force = true;
    else if (a === '-h' || a === '--help') args.help = true;
    else if (a === '--username') args.username = argv[++i];
    else if (a === '--password') args.password = argv[++i];
    else if (a.startsWith('--username=')) args.username = a.slice('--username='.length);
    else if (a.startsWith('--password=')) args.password = a.slice('--password='.length);
  }
  return args;
}

function generatePassword(length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%';
  let out = '';
  while (out.length < length) out += chars[crypto.randomInt(chars.length)];
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('用法: node scripts/init-admin.js [--username NAME] [--password PASS] [--force]');
    return;
  }

  const username = (args.username || process.env.ADMIN_USERNAME || 'admin').trim();
  let password = args.password || process.env.ADMIN_PASSWORD || null;

  if (!/^[a-zA-Z0-9_.-]{2,32}$/.test(username)) {
    console.error('✗ 用户名不合法：仅支持 2-32 位字母、数字、_ . -');
    process.exit(1);
  }

  const existing = userStore.findByUsername(username);
  if (existing && !args.force) {
    console.error(`✗ 账号 "${username}" 已存在。如需重置密码，请追加 --force`);
    process.exit(1);
  }

  let generated = false;
  if (!password) {
    password = generatePassword(16);
    generated = true;
  } else if (password.length < 8) {
    console.error('✗ 密码长度至少 8 位');
    process.exit(1);
  }

  const now = new Date().toISOString();
  const user = {
    id: existing ? existing.id : `u_${crypto.randomBytes(8).toString('hex')}`,
    username,
    passwordHash: hashPassword(password),
    role: 'admin',
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };
  userStore.upsert(user);

  console.log(`✓ 管理员账号已${existing ? '重置' : '创建'}`);
  console.log(`  用户名: ${username}`);
  if (generated) {
    console.log(`  初始密码: ${password}   （仅显示一次，请妥善保存并尽快修改）`);
  }
  console.log(`  数据文件: ${userStore.USERS_FILE}`);
}

main();
