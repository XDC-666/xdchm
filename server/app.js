// 必须在读取 process.env 的其他模块加载前执行
require('dotenv').config();

// Express 入口：提供 /api 接口（前端在 GitHub Pages 或本地调用，已开启 CORS）
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRouter = require('./auth').router;
const gamesRouter = require('./games');

const app = express();
app.use(cors());                 // 允许跨域（前端域名 != 后端域名）
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api', authRouter);          // /api/register, /api/login
app.use('/api/games', gamesRouter);   // /api/games ...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('♟  象棋战绩 API 已启动: http://localhost:' + PORT);
});

// 健康检查（供 Render 探测）
app.get('/', (req, res) => res.json({ ok: true }));
