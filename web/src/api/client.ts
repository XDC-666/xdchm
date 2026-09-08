// 后端 REST 封装（从原 js/api.js 迁移为 TS）。
// 本地开发指向 localhost:3000；部署到 GitHub Pages 后自动指向线上后端。
// 生产环境后端地址通过 Vite 环境变量 VITE_API_BASE 注入（部署 GitHub Pages 需自行提供后端）。
// 未配置时为空，战绩/排行榜功能不可用，但 AI 对战（纯前端 xqwlight 引擎）不受影响。

const PROD_BASE: string = (import.meta.env as Record<string, string | undefined>).VITE_API_BASE ?? ''
const isProd =
  typeof location !== 'undefined' &&
  (location.hostname.endsWith('.github.io') || location.hostname.endsWith('.onrender.com'))
const base = isProd ? PROD_BASE : 'http://localhost:3000'

const TOKEN_KEY = 'xq_token'
const USER_KEY = 'xq_user'

export const getToken = () => (typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null)
export const setToken = (t?: string | null) => {
  if (typeof localStorage === 'undefined') return
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}
export const getUser = () => {
  if (typeof localStorage === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}
export const setUser = (u?: unknown | null) => {
  if (typeof localStorage === 'undefined') return
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
  else localStorage.removeItem(USER_KEY)
}
export const isLoggedIn = () => !!getToken()
export const apiBase = base

async function req(method: string, path: string, body?: unknown, needAuth = false) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (needAuth) {
    const t = getToken()
    if (t) headers['Authorization'] = 'Bearer ' + t
  }
  const res = await fetch(base + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = (await res.json().catch(() => ({}))) as any
  if (!res.ok) throw new Error(data?.error || 'HTTP ' + res.status)
  return data
}

export const api = {
  base,
  register: (u: string, p: string) => req('POST', '/api/register', { username: u, password: p }, false),
  login: (u: string, p: string) => req('POST', '/api/login', { username: u, password: p }, false),
  saveGame: (g: unknown) => req('POST', '/api/games', g, true),
  listGames: () => req('GET', '/api/games', null, true),
  getGame: (id: string) => req('GET', '/api/games/' + id, null, true),
  deleteGame: (id: string) => req('DELETE', '/api/games/' + id, null, true),
  leaderboard: () => req('GET', '/api/games/leaderboard', null, false),
}

export default api
