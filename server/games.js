// 对局 / 战绩 / 排行榜 路由（均需要登录，除 leaderboard 公开）
const express = require('express');
const router = express.Router();
const db = require('./db');
const auth = require('./middleware');

const RESULTS = ['win', 'lose', 'draw'];
const DIFFS = ['easy', 'medium', 'hard', 'expert'];
const COLORS = ['r', 'b'];

// POST /api/games   保存一局（C）
router.post('/', auth, (req, res) => {
  const { result, difficulty, human_color, moves } = req.body || {};
  if (!RESULTS.includes(result)) return res.status(400).json({ error: 'result 非法' });
  if (!DIFFS.includes(difficulty)) return res.status(400).json({ error: 'difficulty 非法' });
  if (!COLORS.includes(human_color)) return res.status(400).json({ error: 'human_color 非法' });
  if (!Array.isArray(moves) || moves.length === 0) return res.status(400).json({ error: 'moves 必填且非空' });

  const info = db.prepare(
    `INSERT INTO games (user_id, result, difficulty, human_color, moves, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(req.user.uid, result, difficulty, human_color, JSON.stringify(moves), Date.now());

  res.json({ id: info.lastInsertRowid });
});

// GET /api/games    我的战绩列表（R）
router.get('/', auth, (req, res) => {
  const rows = db.prepare(
    `SELECT id, result, difficulty, human_color, created_at
     FROM games WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`
  ).all(req.user.uid);
  res.json(rows);
});

// GET /api/games/leaderboard   公开排行榜（按胜率）
// ⚠️ 必须定义在 /:id 之前，否则 'leaderboard' 会被 :id 捕获
router.get('/leaderboard', (req, res) => {
  const rows = db.prepare(`
    SELECT u.username,
           COUNT(*)                                          AS total,
           SUM(CASE WHEN g.result = 'win'  THEN 1 ELSE 0 END) AS wins,
           SUM(CASE WHEN g.result = 'lose' THEN 1 ELSE 0 END) AS losses,
           SUM(CASE WHEN g.result = 'draw' THEN 1 ELSE 0 END) AS draws
    FROM games g JOIN users u ON u.id = g.user_id
    GROUP BY u.id
    HAVING total > 0
    ORDER BY (CAST(wins AS REAL) / total) DESC, total DESC
    LIMIT 20
  `).all();
  res.json(rows.map(r => ({ ...r, winrate: r.total ? r.wins / r.total : 0 })));
});

// GET /api/games/:id    单局详情（含走子序列）（R）
router.get('/:id', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM games WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.uid);
  if (!row) return res.status(404).json({ error: '未找到该对局' });
  res.json({ ...row, moves: JSON.parse(row.moves) });
});

// DELETE /api/games/:id 删除一局（D）
router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM games WHERE id = ? AND user_id = ?').run(req.params.id, req.user.uid);
  res.json({ ok: true });
});

module.exports = router;
