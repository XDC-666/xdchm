<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { api } from '../api/client'

interface Row {
  username: string
  total: number
  wins: number
  losses: number
  draws: number
  winrate: number
}

const rows = ref<Row[]>([])
const loading = ref(false)
const error = ref('')

const data = computed(() => rows.value.map((r, i) => ({ ...r, rank: i + 1 })))

const columns = [
  { title: '#', key: 'rank', width: 56 },
  { title: '玩家', key: 'username' },
  { title: '胜', key: 'wins', width: 70 },
  { title: '负', key: 'losses', width: 70 },
  { title: '和', key: 'draws', width: 70 },
  { title: '总', key: 'total', width: 70 },
  {
    title: '胜率',
    key: 'winrate',
    width: 90,
    render: (row: any) => h('span', { class: 'rate' }, (row.winrate * 100).toFixed(1) + '%'),
  },
]

onMounted(async () => {
  loading.value = true
  try {
    rows.value = (await api.leaderboard()) as Row[]
  } catch (e) {
    error.value = (e as Error).message || '加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <h2>排行榜</h2>
    <p v-if="error" class="err">{{ error }}</p>
    <p v-else-if="loading" class="hint">加载中…</p>
    <p v-else-if="!rows.length" class="hint">暂无战绩数据</p>
    <n-data-table
      v-else
      :columns="columns"
      :data="data"
      :bordered="true"
      :single-line="false"
      :row-key="(row: any) => row.username"
    />
  </div>
</template>
