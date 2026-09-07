// 必须在读取 process.env 的其他模块加载前执行
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authRouter = require('./auth').router;
const gamesRouter = require('./games');

// ---------- CORS 白名单 ----------
// 允许的来源：本地开发 + GitHub Pages 前端（公开域名，非敏感）。
// 其他来源（如 Cloudflare Tunnel 临时地址）通过 CLIENT_ORIGIN 环境变量追加（逗号分隔）。
// 不再使用 cors() 默认值（origin: * 通配），避免任意网站调用含身份的接口。
const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://XDC-666.github.io',
];
const extra = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...DEFAULT_ORIGINS, ...extra]);

const corsOptions = {
  origin(origin, cb) {
    // 非浏览器请求（无 Origin）或白名单内：放行
    if (!origin || allowedOrigins.has(origin)) return cb(null, true);
    return cb(new Error('CORS: 来源不被允许 -> ' + origin));
  },
  credentials: true,
};

const app = express();
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api', authRouter);          // /api/register, /api/login
app.use('/api/games', gamesRouter);   // /api/games ...

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// 统一错误处理：避免把堆栈直接甩给客户端
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err && err.message);
  const status = err && err.message && err.message.startsWith('CORS') ? 403 : 500;
  res.status(status).json({ error: '服务器内部错误' });
});

const PORT = process.env.PORT || 3000;
// 直接运行时才监听；被测试 require 时不自动监听（便于测试复用 app 实例）
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('♟  象棋战绩 API 已启动: http://localhost:' + PORT);
  });
}

module.exports = app;
