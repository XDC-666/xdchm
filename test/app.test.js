// 端到端冒烟测试：注册 -> 登录 -> 保存对局 -> 查战绩 -> 排行榜
// 使用 Node 内置 node:test，无需额外依赖。运行：npm test
const test = require('node:test');
const assert = require('node:assert');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

// 测试隔离：独立 JWT 密钥 + 独立数据库目录（避免污染真实 data/）
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-not-for-prod';
const tmpDb = path.join(os.tmpdir(), 'xq-test-' + Date.now());
fs.mkdirSync(tmpDb, { recursive: true });
process.env.DATA_DIR = tmpDb;

const app = require('../server/app');

function listen() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

test('完整流程：注册/登录/保存/战绩/排行榜 + 鉴权与校验', async () => {
  const server = await listen();
  const base = 'http://127.0.0.1:' + server.address().port;

  // 注册
  let r = await fetch(base + '/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'alice', password: 'supersecret' }),
  });
  assert.equal(r.status, 200);
  let data = await r.json();
  assert.ok(data.token);
  const token = data.token;

  // 登录
  r = await fetch(base + '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'alice', password: 'supersecret' }),
  });
  assert.equal(r.status, 200);

  // 弱密码应被拒
  r = await fetch(base + '/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bob', password: '123' }),
  });
  assert.equal(r.status, 400);

  // 非法用户名应被拒
  r = await fetch(base + '/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'bad name!', password: 'supersecret' }),
  });
  assert.equal(r.status, 400);

  // 保存对局（需鉴权）
  r = await fetch(base + '/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify({ result: 'win', difficulty: 'medium', human_color: 'r', moves: [{ from: 'a0', to: 'a1' }] }),
  });
  assert.equal(r.status, 200);

  // 无 token 保存应 401
  r = await fetch(base + '/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result: 'win', difficulty: 'medium', human_color: 'r', moves: [{ from: 'a0', to: 'a1' }] }),
  });
  assert.equal(r.status, 401);

  // 查战绩
  r = await fetch(base + '/api/games', { headers: { Authorization: 'Bearer ' + token } });
  assert.equal(r.status, 200);
  data = await r.json();
  assert.equal(data.length, 1);

  // 排行榜公开
  r = await fetch(base + '/api/games/leaderboard');
  assert.equal(r.status, 200);

  server.close();
  fs.rmSync(tmpDb, { recursive: true, force: true });
});
