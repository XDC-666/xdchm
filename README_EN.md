# Chinese Chess · Human vs. Engine Agent (full-stack xiangqi-agent)

A **full-stack** Chinese chess (Xiangqi) project: the frontend is a pure-JavaScript human-vs-computer chess program (custom rules engine + the open-source strong engine xqwlight), and the **backend is Node.js + Express + SQLite**, providing user registration/login, game archiving, replay, leaderboards, and other complete web features.

**🌐 [简体中文](./README.md) | English**

> Released under **GPL-2.0** because it bundles xqwlight from www.xqbase.com, which is GPL-2.0.

## ✨ Features

- 🎮 **Human vs. engine**: self-built search engine (alpha-beta + opening book) against the open-source strong engine xqwlight
- 👤 **User system**: register / login (JWT auth, passwords hashed with bcrypt)
- 💾 **Game archiving**: each game's move sequence, result, and difficulty stored in the database
- 🔁 **Replay**: browse past games and step through them move by move
- 🏆 **Leaderboard**: publicly ranked by win rate
- 🛡️ **Hardened**: CORS allowlist, refuses to start if `JWT_SECRET` is missing, helmet security headers, unified error handling
- 📱 Pure frontend UI, responsive on mobile

## 🧱 Tech Stack

- **Frontend**: vanilla HTML / CSS / JavaScript (no framework, zero build step)
- **Game engine**: in-house `xiangqi-engine.js` + open-source xqwlight (position / search / book)
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3, single file, zero ops)
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Deployment**: GitHub Pages (frontend) + Render (backend, free tier) / any container platform (Dockerfile included)

## 📂 Project Structure

```
xiangqi-agent/
├── index.html          # Main frontend (board + AI + full-stack UI)
├── standalone.html     # Single-file build (no backend, just open and play)
├── xiangqi-engine.js   # Custom rules + search engine
├── xqwlight/           # Open-source strong engine (GPL-2.0, www.xqbase.com)
├── js/
│   ├── api.js          # Frontend API wrapper + session handling
│   └── ui.js           # Login / history / leaderboard modal logic
├── server/             # Node.js backend
│   ├── app.js          # Express entrypoint (CORS / helmet / error handling)
│   ├── db.js           # SQLite schema (users / games)
│   ├── auth.js         # Register / login / JWT
│   ├── middleware.js   # JWT auth middleware
│   └── games.js        # Game CRUD + leaderboard
├── test/               # End-to-end smoke tests (node --test)
├── data/               # SQLite database file (generated at runtime, git-ignored)
├── render.yaml         # Render deployment config
├── Dockerfile          # Containerized deployment
├── .env.example        # Environment variable sample
├── package.json
├── README.md
└── LICENSE             # GPL-2.0
```

## 🚀 Running Locally

### Backend (requires Node.js 18+)

```bash
cp .env.example .env      # then edit .env and be sure to set JWT_SECRET
npm install
npm start                 # listens on http://localhost:3000 by default
npm test                  # run smoke tests (no extra dependencies needed)
```

### Frontend

Just open `index.html` in a browser (it connects to `http://localhost:3000` by default).
Or serve it with any static server, for example:

```bash
npx serve .
```

### Single-file build (no backend)

Open `standalone.html` directly to play offline.

## 🌐 Live Demo

- **Frontend (GitHub Pages)**: https://XDC-666.github.io/xdchm/
- **Backend (Render)**: fill in your own Render URL after deploying (see below)

> The frontend switches backend URLs by domain: `localhost:3000` locally, your Render domain in production (configured via `PROD_BASE` in `js/api.js`).

## 📡 API

All endpoints share the `/api` prefix.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register, returns a JWT |
| POST | `/login` | No | Log in, returns a JWT |
| GET | `/health` | No | Health check (for Render probes) |
| POST | `/games` | Yes | Save a game (C) |
| GET | `/games` | Yes | List my games (R) |
| GET | `/games/:id` | Yes | Game detail + move sequence (R) |
| DELETE | `/games/:id` | Yes | Delete a game (D) |
| GET | `/games/leaderboard` | No | Public leaderboard (by win rate) |

Example request body for saving a game:

```json
{
  "result": "win",
  "difficulty": "medium",
  "human_color": "r",
  "moves": [{"from":"a0","to":"a1"}]
}
```

## 🗄️ Data Model

```
users(1) ──< games(many)
```

- `users`: id, username (unique), password_hash, created_at
- `games`: id, user_id (FK -> users.id), result (win/lose/draw), difficulty, human_color (r/b), moves (JSON array), created_at

One user can own many game records (one-to-many).

## ☁️ Deployment (Render + GitHub Pages)

### Backend -> Render (free tier)

1. Sign up at https://render.com, then *New -> Web Service -> connect the GitHub repo* `XDC-666/xdchm`
2. Key settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
3. Render reads `render.yaml` from the repo and generates a random `JWT_SECRET`
4. After deployment you get a URL like `https://xiangqi-agent.onrender.com`
5. **Important**: set `PROD_BASE` in `js/api.js` to your actual Render URL (if the service name isn't `xiangqi-agent`)

### Frontend -> GitHub Pages

1. Repo *Settings -> Pages ->* Branch `main`, folder `/ (root)` -> *Save*
2. After ~1–2 minutes, visit https://XDC-666.github.io/xdchm/

> GitHub Pages hosts only the static frontend; the backend runs on Render. They talk over a **CORS allowlist**:
> the backend allows `localhost:3000` and `https://XDC-666.github.io` by default;
> for extra frontend origins (e.g. a Cloudflare Tunnel), append them to `CLIENT_ORIGIN` in `.env` (comma-separated).

## 🐳 Container Deployment (optional)

A `Dockerfile` is included so you can run it on any container platform:

```bash
docker build -t xiangqi-agent .
docker run -e JWT_SECRET=your-random-secret -e PORT=3000 -p 3000:3000 xiangqi-agent
```

## 📜 License

**GPL-2.0** — because it bundles the xqwlight engine from www.xqbase.com, derivative code must be released under GPL-2.0.
