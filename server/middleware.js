// JWT 鉴权中间件：校验 Authorization: Bearer <token>
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

module.exports = auth;
