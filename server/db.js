// SQLite 数据库初始化与建表
// 数据实体关系：
//   users(1) ——< games(多)   : 一名用户可拥有多局对战记录
//   games 字段：result / difficulty / human_color / moves(JSON) / created_at
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'xiangqi.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    result       TEXT NOT NULL,                 -- 'win' | 'lose' | 'draw'
    difficulty   TEXT NOT NULL,                 -- 'easy'|'medium'|'hard'|'expert'
    human_color  TEXT NOT NULL,                 -- 'r' | 'b'
    moves        TEXT NOT NULL,                 -- JSON 数组：[{from,to,color,note}]
    created_at   INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_games_user      ON games(user_id);
  CREATE INDEX IF NOT EXISTS idx_games_created   ON games(created_at);
`);

module.exports = db;
