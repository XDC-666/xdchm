# 中国象棋 · 人机对战 Agent（xiangqi-agent）

一个纯前端（HTML + JavaScript）的中国象棋人机对战程序，**无需服务器、无需安装、双击即玩**。
内置自研规则引擎与开源强引擎 [xqwlight](https://www.xqbase.com)（ElephantEye 谱系），并附带名家棋谱库与练习模式。

> 本项目以 **GPL-2.0** 发布（因包含 xqwlight 派生代码，整体须统一为 GPL-2.0）。详见 [LICENSE](./LICENSE)。

---

## ✨ 功能

- **完整中国象棋规则**：蹩马腿、塞象眼、炮架、过河兵、飞将检测一应俱全。
- **多级 AI**：
  - 简单 / 中等 / 困难：自研 alpha-beta 极小化极大搜索（迭代加深 + 时间限制）。
  - 最强（象眼）：接入开源 [xqwlight](https://www.xqbase.com) 引擎，棋力显著提升，思考时长可调（0.5s–5s）。
- **交互对弈**：Canvas 绘制棋盘，点击选子 / 落子，合法目标高亮，上一步高亮，将军 / 胜负判定。
- **中文记谱**：标准炮二平五式记谱，支持导出 / 载入 FEN 局面。
- **名家棋谱库**：内置经引擎校验的名局（胡荣华、王天一、许银川等），可浏览、自动播放、**练习模式**（走错即时提示正解）。
- **阵营与回合**：可选执红先手或执黑后手，支持悔棋、提示、新对局。

---

## 📁 目录结构

```
xiangqi-agent/
├── index.html            # 主程序（多文件版，引用下方引擎与 xqwlight）
├── standalone.html       # 单文件版（所有 CSS/JS 内联，方便单独分享/离线打开）
├── xiangqi-engine.js     # 自研中国象棋规则与搜索引擎（MIT-compatible 代码，随仓库以 GPL-2.0 发布）
├── xqwlight/             # 开源强引擎（GPL-2.0，www.xqbase.com）
│   ├── position.js
│   ├── search.js
│   └── book.js
├── LICENSE
└── README.md
```

---

## 🚀 本地运行

方式一（最简单）：直接双击 `standalone.html` 或 `index.html`，用浏览器打开即可对弈。

方式二（本地静态服务器，便于开发）：
```bash
# 任选其一，在项目根目录执行：
python -m http.server 8000
# 或
npx serve .
```
然后访问 `http://localhost:8000`。

---

## 🌐 部署到 GitHub Pages（让别人点链接就能下棋）

1. **推送到 GitHub**
   ```bash
   # 安装并登录 GitHub CLI（一次性）
   # Windows: winget install --id GitHub.cli   macOS: brew install gh
   gh auth login

   # 在 GitHub 上建一个空仓库（如 xiangqi-agent），然后：
   git remote add origin https://github.com/<你的用户名>/xiangqi-agent.git
   git branch -M main
   git push -u origin main
   ```

2. **开启 Pages**
   - 进入仓库 `Settings → Pages`
   - Source 选择 `Deploy from a branch`，Branch 选 `main`，目录选 `/ (root)`
   - 保存后等待约 1 分钟，访问 `https://<你的用户名>.github.io/xiangqi-agent/` 即可在线对弈。

> 因为本项目是纯静态文件，GitHub Pages 完全够用，无需任何后端或 CI。

---

## 📜 许可证与署名

- **xqwlight**（position.js / search.js / book.js）：Copyright (C) 2004-2012 www.xqbase.com，GPL-2.0。
- **xiangqi-engine.js 与界面**：本仓库作者，随整体以 GPL-2.0 发布。
- 完整 GPL-2.0 文本见 https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt

---

## 🙋 后续可扩展

- 接入更强的开源引擎（如 ElephantEye WASM）。
- 增加联网对战 / 棋谱分享。
- 用 GitHub Actions 自动部署 Pages（免去手动开启）。
