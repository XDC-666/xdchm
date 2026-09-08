import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HistoryView from '../views/HistoryView.vue'
import LeaderboardView from '../views/LeaderboardView.vue'
import AboutView from '../views/AboutView.vue'

// 用 hash 历史：GitHub Pages 子路径部署无需服务端 404 兜底
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/leaderboard', name: 'leaderboard', component: LeaderboardView },
    { path: '/about', name: 'about', component: AboutView },
  ],
})

export default router
