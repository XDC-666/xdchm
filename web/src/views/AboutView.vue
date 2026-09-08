<script setup lang="ts">
const stack = [
  { name: 'Vue 3', desc: '组合式 API（<script setup>）+ 响应式状态管理' },
  { name: 'Vite', desc: '前端构建与开发服务器，HMR 热更新' },
  { name: 'TypeScript', desc: '全量类型约束，棋盘坐标 / 走子 / 接口均有类型' },
  { name: 'Vue Router', desc: '多页路由：对战 / 战绩 / 排行榜 / 关于（hash 历史）' },
  { name: 'Naive UI', desc: '组件库：菜单 / 表单 / 表格 / 弹窗 / 消息提示' },
  { name: 'Canvas', desc: '手写棋盘渲染、选中高亮、合法走子提示（非套 UI 库）' },
  { name: 'Axios / REST', desc: '对接 Express 后端：登录鉴权（JWT）、战绩 CRUD' },
  { name: 'xqwlight', desc: '专业象棋引擎（GPL-2.0），FEN 转换 + 搜索接管 AI' },
  { name: 'GitHub Actions', desc: 'push 自动 build + 发布 GitHub Pages' },
]
</script>

<template>
  <div class="page about">
    <h2>关于项目</h2>
    <p class="lead">
      中国象棋人机对战前端，原仓库为原生 JavaScript 单页实现，本版用
      <b>Vue 3 + Vite + TypeScript</b> 从零重构，并引入 Vue Router 与 Naive UI 组件库，
      覆盖多页路由、表单鉴权、表格展示等典型前端场景。
    </p>

    <h3>技术栈</h3>
    <ul class="stack">
      <li v-for="s in stack" :key="s.name">
        <b>{{ s.name }}</b><span>{{ s.desc }}</span>
      </li>
    </ul>

    <h3>功能</h3>
    <ul class="feats">
      <li>Canvas 棋盘渲染 + 点击走子 + 合法走子高亮</li>
      <li>象眼 xqwlight 专业引擎对战（简单 / 中等 / 困难三档）</li>
      <li>登录注册（JWT 存 localStorage）、悔棋、认输</li>
      <li>对局自动保存、我的战绩、单局回放、公开排行榜</li>
      <li>GitHub Pages 自动部署</li>
    </ul>
  </div>
</template>
