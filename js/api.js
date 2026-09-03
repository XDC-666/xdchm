// 前端 API 封装：自动在「本地 localhost:3000」与「线上 Render」之间切换基地址
// 也负责登录态(token)的存取与「对局结束」事件的广播。
window.XQAPI = (function () {
  // 本地开发指向 localhost:3000；部署到 GitHub Pages 后自动指向线上后端。
  // 若你的 Render 服务名不同，把下面的地址改成实际地址即可。
  const PROD_BASE = 'https://xiangqi-agent.onrender.com';
  const isProd = location.hostname.endsWith('.github.io') || location.hostname.endsWith('.onrender.com');
  const base = isProd ? PROD_BASE : 'http://localhost:3000';

  const TOKEN_KEY = 'xq_token';
  const USER_KEY = 'xq_user';

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));
  const getUser = () => JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  const setUser = (u) => (u ? localStorage.setItem(USER_KEY, JSON.stringify(u)) : localStorage.removeItem(USER_KEY));
  const isLoggedIn = () => !!getToken();

  async function req(method, path, body, needAuth) {
    const headers = { 'Content-Type': 'application/json' };
    if (needAuth) {
      const t = getToken();
      if (t) headers['Authorization'] = 'Bearer ' + t;
    }
    const res = await fetch(base + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
    return data;
  }

  return {
    base, getToken, setToken, getUser, setUser, isLoggedIn,
    register: (u, p) => req('POST', '/api/register', { username: u, password: p }, false),
    login: (u, p) => req('POST', '/api/login', { username: u, password: p }, false),
    saveGame: (g) => req('POST', '/api/games', g, true),
    listGames: () => req('GET', '/api/games', null, true),
    getGame: (id) => req('GET', '/api/games/' + id, null, true),
    deleteGame: (id) => req('DELETE', '/api/games/' + id, null, true),
    leaderboard: () => req('GET', '/api/games/leaderboard', null, false),

    _handler: null,
    onGameOver(fn) { this._handler = fn; },
    emitGameOver(result, data) { if (this._handler) this._handler(result, data); },
  };
})();
