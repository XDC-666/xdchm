# 中国象棋人机对战 · Vue3 重写版

将仓库 `XDC-666/xdchm` 原有的「原生 JavaScript + Canvas」前端，用 **Vue3 + Vite + TypeScript** 重写外壳，并引入 **Vue Router** 与 **Naive UI** 组件库。
棋局逻辑与 AI 搜索直接复用原 `xiangqi-engine.js`（纯函数引擎，无任何 DOM 依赖），强引擎用 `xqwlight`（GPL-2.0）。

## 与原版对比

| 维度 | 原版（index.html + js/ui.js） | 本版（Vue3） |
|---|---|---|
| 框架 | 无（原生 JS + Canvas） | Vue3 + Vite + TS |
| 路由 | 无（单页 v-if 切换） | Vue Router 多页（对战 / 战绩 / 排行榜 / 关于） |
| 组件库 | 无（纯手写 CSS） | Naive UI（菜单 / 表单 / 表格 / 弹窗 / 全局提示） |
| 棋盘渲染 | Canvas（`<script>` 内全局函数） | `ChessBoard.vue`（组件化 Canvas） |
| 状态管理 | 全局变量 | `useGame` / `useAuth` 组合式函数（单例响应式） |
| UI 面板 | DOM 拼字符串 | `StatusBar` / `ControlPanel` / `AuthModal` / `ReplayPanel` |
| 后端联调 | `js/api.js`（window.XQAPI） | `api/client.ts`（fetch + JWT） |
| 战绩 / 排行 | `ui.js` 命令式弹层 | 独立页面 + 自动保存 |

## 目录结构

```
src/
  engine/
    xiangqi-engine.js   # 原仓库引擎（直接复用，未改动）
    strongAi.ts         # xqwlight 强引擎封装（FEN 转换 + 格索引映射 + 兜底）
    index.ts            # 引擎 TS 包装（取 globalThis.XQ）+ isXqAvailable
  api/
    client.ts           # 后端 REST 封装（迁移自 js/api.js，含 JWT 存取）
  composables/
    useGame.ts          # 游戏状态 + 走子 + AI 调度 + 悔棋/认输/结果（单例）
    useAuth.ts          # 登录 / 注册 / 登出（单例响应式 user）
  router/
    index.ts            # 4 路由（hash 历史，GitHub Pages 友好）
  views/
    HomeView.vue        # 对局页（棋盘 + 控制台 + 自动保存战绩）
    HistoryView.vue     # 我的战绩（列表 / 记谱 / 回放 / 删除）
    LeaderboardView.vue # 公开排行榜（Naive UI NDataTable）
    AboutView.vue       # 技术栈 / 功能介绍
  components/
    ChessBoard.vue      # Canvas 棋盘渲染 + 点击走子（核心，支持只读回放）
    StatusBar.vue       # 状态栏 + 记谱 + 引擎徽章
    ControlPanel.vue    # 难度 / 执子 / 新对局 / 悔棋 / 认输（n-select + n-button）
    AuthModal.vue       # 登录注册弹层（n-modal + n-input + n-radio-group）
    ReplayPanel.vue     # 对局回放：播放 / 暂停 / 单步 / 重置
  types.ts
  App.vue               # 布局壳：n-menu 导航 + 登录区 + router-view
  main.ts               # 注册 Naive UI + Router + 离散 message/dialog
  style.css
public/xqwlight/        # 原仓库 xqwlight 强引擎（position/search/book.js）
.github/workflows/deploy.yml   # 推 main 自动构建并发布到 GitHub Pages
```

## 运行

```bash
npm install
npm run dev      # 本地开发 http://localhost:5173
npm run build    # 产出 dist/（相对路径，可部署到 GitHub Pages / 任意静态托管）
```

- 本地联调后端默认 `http://localhost:3000`；部署到 `*.github.io` 后自动切到线上后端（见 `api/client.ts` 的 `PROD_BASE`）。
- 部署到 GitHub Pages：推送 `main` 分支即触发 `.github/workflows/deploy.yml`，发布到项目页 `https://<user>.github.io/xdchm-vue/`。
  注意 Pages 仅托管前端静态资源；后端需独立部署（原仓库已支持 Render / Cloudflare Tunnel），并把隧道 URL 同步更新到 `PROD_BASE`。

## 已实现功能

- ✅ Vite + Vue3 + TS 工程化骨架
- ✅ Vue Router 多页路由：对战 / 我的战绩 / 排行榜 / 关于（hash 历史）
- ✅ Naive UI 组件库：n-menu 导航、n-modal 登录、n-data-table 排行榜、n-message 全局提示、n-select / n-button 控件
- ✅ Canvas 棋盘组件（网格 / 楚河汉界 / 九宫 / 炮兵位标记 / 棋子绘制）
- ✅ 点击选中 + 合法走子高亮 + 落子
- ✅ **xqwlight 专业强引擎**（象眼 / ElephantEye 谱系）：easy/medium/hard 三档，约业 5-6 水平
- ✅ 上一步高亮、记谱列表、胜负判定、思考遮罩、红黑先手切换
- ✅ **账号系统**：注册 / 登录 / 登出（JWT，存 localStorage）
- ✅ **战绩自动保存**：对局结束若已登录自动入库（胜 / 负 / 难度 / 执子 / 走子序列）
- ✅ **我的战绩**：列表、展开记谱、单局回放、删除
- ✅ **回放**：从初始局面顺序重建棋盘，支持播放 / 暂停 / 上一步 / 下一步 / 重置
- ✅ **排行榜**：公开榜，展示胜 / 负 / 和 / 总 / 胜率
- ✅ **悔棋 / 认输**：悔棋撤销「电脑+玩家」一步并交还走子权；认输判负触发保存
- ✅ GitHub Pages 部署工作流

## 可选增强（未做）

- naive-ui 按需引入（当前全量注册，dist JS 约 1.5MB / gzip 429KB）
- FEN 局面载入 / 导出
- 和棋判定（当前和棋仅由显式认负外的规则触发，未做重复局面判和）
