// 认证路由：注册 / 登录，签发 JWT
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';
const TOKEN_TTL = '7d';

function sign(uid, username) {
  return jwt.sign({ uid, username }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// 简单全局限流：60 秒内最多 20 次注册（防脚本刷库）。
// 注：经 Cloudflare Tunnel 穿透后所有请求源 IP 均为 127.0.0.1，
//      按真实 IP 限流会误伤，故采用全局窗口计数。
const registerLog = [];
const REGISTER_WINDOW = 60 * 1000;
const REGISTER_MAX = 20;
function registerAllowed() {
  const now = Date.now();
  while (registerLog.length && registerLog[0] < now - REGISTER_WINDOW) registerLog.shift();
  if (registerLog.length >= REGISTER_MAX) return false;
  registerLog.push(now);
  return true;
}

// POST /api/register  { username, password }
router.post('/register', (req, res) => {
  if (!registerAllowed()) {
    return res.status(429).json({ error: '注册过于频繁，请稍后再试' });
  }
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' });
  if (username.length > 20) return res.status(400).json({ error: '用户名最长 20 位' });
  if (password.length < 4) return res.status(400).json({ error: '密码至少 4 位' });

  if (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) {
    return res.status(409).json({ error: '用户名已存在' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)'
  ).run(username, hash, Date.now());

  res.json({ token: sign(info.lastInsertRowid, username), username });
});

// POST /api/login  { username, password }
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  res.json({ token: sign(user.id, user.username), username: user.username });
});

module.exports = { router, JWT_SECRET };
