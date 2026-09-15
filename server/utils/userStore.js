'use strict';
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getAll() {
  ensureDir();
  if (!fs.existsSync(USERS_FILE)) return [];
  const raw = fs.readFileSync(USERS_FILE, 'utf8').trim();
  if (!raw) return [];
  const users = JSON.parse(raw);
  if (!Array.isArray(users)) throw new Error('users.json 格式错误：应为数组');
  return users;
}

/** 原子写入，文件权限 0600 */
function saveAll(users) {
  ensureDir();
  const tmp = USERS_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(users, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, USERS_FILE);
}

function findByUsername(username) {
  return getAll().find((u) => u.username === username) || null;
}

function upsert(user) {
  const users = getAll();
  const idx = users.findIndex((u) => u.username === user.username);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  saveAll(users);
  return user;
}

function count() {
  return getAll().length;
}

module.exports = { getAll, findByUsername, upsert, count, USERS_FILE };
