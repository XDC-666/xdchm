# 中国象棋 · 人机对战 Agent（全栈版 xiangqi-agent）

一个**全栈**中国象棋项目：前端是纯 JavaScript 的中国象棋人机对战程序（自研规则引擎 + 开源强引擎 xqwlight），**后端是 Node.js + Express + SQLite**，提供用户注册登录、对局存档、战绩回放、排行榜等完整 Web 功能。

> 本项目以 **GPL-2.0** 发布（因包含 www.xqbase.com 的 xqwlight，GPL-2.0）。

## ✨ 功能特性
- 🎮 **人机对战**：自研搜索引擎（alpha-beta + 开局库）对阵开源强引擎 xqwlight
- 👤 **用户系统**：注册 / 登录（JWT 鉴权，密码 bcrypt 哈希）
- 💾 **对局存档**：每局走子序列 + 结果 + 难度存入数据库
- 🔁 **战绩回放**：查看历史棋局，逐步重放
- 🏆 **排行榜**：按胜率排名（公开）
- 📱 纯前端界面，移动端自适应

## 🧱 技术栈
- **前端**：原生 HTML / CSS / JavaScript（无框架，零构建）
- **游戏引擎**：自研 `xiangqi-engine.js` + 开源 xqwlight（position / search / book）
- **后端**：Node.js + Express
- **数据库**：SQLite（better-sqlite3，单文件，零运维）
- **鉴权**：JWT（jsonwebtoken）+ bcryptjs
- **部署**：GitHub Pages（前端）+ Render（后端，免费）

## 📂 目录结构
```
xiangqi-agent/
├── index.html          # 前端主程序（棋盘 + AI + 全栈界面）
├── standalone.html      # 单文件版（无需后端，直接打开即玩）
├── xiangqi-engine.js    # 自研规则 + 搜索引擎
├── xqwlight/            # 开源强引擎（GPL-2.0，www.xqbase.com）
├── js/
│   ├── api.js           # 前端 API 封装 + 登录态管理
│   └── ui.js            # 登录 / 战绩 / 排行榜 弹窗逻辑
├── server/              # Node.js 后端
│   ├── app.js           # Express 入口
│   ├── db.js            # SQLite 建表（users / games）
│   ├── auth.js          # 注册 / 登录 / JWT
│   ├── middleware.js    # JWT 鉴权中间件
│   └── games.js         # 对局 CRUD + 排行榜
├── data/                # SQLite 数据库文件（运行时生成，已 gitignore）
├── render.yaml          # Render 部署配置
├── package.json
├── README.md
└── LICENSE              # GPL-2.0
```

## 🚀 本地运行

### 后端（需 Node.js 18+）
```bash
npm install
npm start            # 默认监听 http://localhost:3000
```

### 前端
直接用浏览器打开 `index.html` 即可（默认连接 `http://localhost:3000`）。
或使用任意静态服务器，例如：
```bash
npx serve .
```

### 单文件版（无需后端）
双击打开 `standalone.html` 即可离线对弈。

## 🌐 在线演示
- **前端（GitHub Pages）**：https://XDC-666.github.io/xdchm/
- **后端（Render）**：部署后填入你的 Render 地址（见下文）

> 前端会根据域名自动切换后端地址：本地用 `localhost:3000`，线上用你的 Render 域名（在 `js/api.js` 的 `PROD_BASE` 配置）。

## 📡 API 说明
所有接口统一前缀 `/api`。

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/register` | 否 | 注册，返回 JWT |
| POST | `/login` | 否 | 登录，返回 JWT |
| GET | `/health` | 否 | 健康检查（供 Render 探测） |
| POST | `/games` | 是 | 保存一局（C） |
| GET | `/games` | 是 | 我的战绩列表（R） |
| GET | `/games/:id` | 是 | 单局详情 + 走子序列（R） |
| DELETE | `/games/:id` | 是 | 删除一局（D） |
| GET | `/games/leaderboard` | 否 | 公开排行榜（按胜率） |

保存对局请求体示例：
```json
{
  "result": "win",
  "difficulty": "medium",
  "human_color": "r",
  "moves": [{"from":"a0","to":"a1"}]
}
```

## 🗄️ 数据实体关系
```
users(1) ──< games(多)
```
- `users`：id, username(唯一), password_hash, created_at
- `games`：id, user_id(FK→users.id), result(win/lose/draw), difficulty, human_color(r/b), moves(JSON 数组), created_at

一名用户可拥有多局对战记录（一对多）。

## ☁️ 部署（Render + GitHub Pages）

### 后端 → Render（免费）
1. 注册 https://render.com ，New → Web Service → 连接 GitHub 仓库 `XDC-666/xdchm`
2. 关键设置：
   - **Build Command**：`npm install`
   - **Start Command**：`npm start`
   - **Instance Type**：Free
3. Render 会自动读取仓库的 `render.yaml`，并生成随机 `JWT_SECRET`
4. 部署完成后获得地址，形如 `https://xiangqi-agent.onrender.com`
5. **重要**：在 `js/api.js` 中把 `PROD_BASE` 改成你的实际 Render 地址（若服务名非 xiangqi-agent）

### 前端 → GitHub Pages
1. 仓库 Settings → Pages → Branch 选 `main`、folder `/ (root)` → Save
2. 约 1~2 分钟后访问 https://XDC-666.github.io/xdchm/

> GitHub Pages 只托管静态前端；后端由 Render 运行。两者通过 CORS 通信（后端已开启 `cors()`，允许任意来源）。

## 📜 License
**GPL-2.0** —— 因包含 www.xqbase.com 的 xqwlight 引擎，派生代码须以 GPL-2.0 发布。
