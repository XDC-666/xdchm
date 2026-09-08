<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth'
import AuthModal from './components/AuthModal.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuth()
const showAuth = ref(false)

const menuOptions = [
  { label: '人机对战', key: 'home' },
  { label: '我的战绩', key: 'history' },
  { label: '排行榜', key: 'leaderboard' },
  { label: '关于', key: 'about' },
]
const activeKey = computed(() => (route.name as string) || 'home')

function handleMenu(key: string) {
  router.push({ name: key })
}
function onLogout() {
  auth.logout()
  ;(window as any).$message?.success('已退出登录')
}
</script>

<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">中国象棋 · 人机对战</div>
      <n-menu mode="horizontal" :options="menuOptions" :value="activeKey" @update:value="handleMenu" class="nav" />
      <div class="user-area">
        <template v-if="auth.isLoggedIn()">
          <n-text class="uname">{{ auth.user.value?.username }}</n-text>
          <n-button text size="small" @click="onLogout">退出</n-button>
        </template>
        <n-button v-else type="primary" size="small" @click="showAuth = true">登录 / 注册</n-button>
      </div>
    </header>

    <main class="content">
      <router-view />
    </main>

    <AuthModal v-if="showAuth" @close="showAuth = false" />
  </div>
</template>
