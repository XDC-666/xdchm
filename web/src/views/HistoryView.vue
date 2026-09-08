<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ReplayPanel from '../components/ReplayPanel.vue'
import { api } from '../api/client'
import { useAuth } from '../composables/useAuth'

const auth = useAuth()

interface SaveMove {
  from: [number, number]
  to: [number, number]
  color: 'r' | 'b'
  piece: { t: string; c: 'r' | 'b' }
}
interface GameRow {
  id: number
  result: 'win' | 'lose' | 'draw'
  difficulty: string
  human_color: 'r' | 'b'
  created_at: number
}

const rows = ref<GameRow[]>([])
const expanded = ref<number | null>(null)
const detailMoves = ref<Record<number, string>>({})
const loading = ref(false)
const error = ref('')
const replay = ref<{ moves: SaveMove[]; title: string } | null>(null)

const diffText: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难', expert: '大师' }
const resultText: Record<string, string> = { win: '胜', lose: '负', draw: '和' }
const colorText: Record<string, string> = { r: '红', b: '黑' }

function fmtDate(ts: number) {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// 中文着法（与引擎 notation 同源，仅用 from/to/color 推导，避免依赖 piece 字段缺失）
function notationOf(m: SaveMove): string {
  const names: Record<string, string> = { K: '帅', A: '仕', E: '相', H: '马', R: '车', C: '炮', P: '兵' }
  const t = m.piece?.t || 'P'
  const c = m.piece?.c || m.color
  const name = names[t] || '?'
  const fileNo = c === 'r' ? 9 - m.from[0] : m.from[0] + 1
  const dx = m.to[0] - m.from[0]
  const dy = m.to[1] - m.from[1]
  const cn = (n: number) => ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'][n] || n
  let action: string
  let dest: string | number
  if (dx !== 0 && dy === 0) {
    action = '平'
    dest = c === 'r' ? 9 - m.to[0] : m.to[0] + 1
  } else {
    const forward = c === 'r' ? dy < 0 : dy > 0
    action = forward ? '进' : '退'
    const isDiag = t === 'H' || t === 'E' || t === 'A'
    dest = isDiag ? (c === 'r' ? 9 - m.to[0] : m.to[0] + 1) : Math.abs(dy)
  }
  return name + cn(fileNo) + action + (typeof dest === 'number' ? cn(dest) : dest)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    rows.value = (await api.listGames()) as GameRow[]
  } catch (e) {
    error.value = (e as Error).message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function toggleExpand(id: number) {
  if (expanded.value === id) {
    expanded.value = null
    return
  }
  expanded.value = id
  if (detailMoves.value[id] === undefined) {
    try {
      const g = (await api.getGame(String(id))) as { moves: SaveMove[] }
      detailMoves.value[id] = g.moves.map((m) => notationOf(m)).join('  ')
    } catch (e) {
      detailMoves.value[id] = '记谱加载失败：' + (e as Error).message
    }
  }
}

async function onReplay(id: number) {
  try {
    const g = (await api.getGame(String(id))) as { moves: SaveMove[]; result: string }
    replay.value = {
      moves: g.moves,
      title: `对局 #${id}（${resultText[g.result]}）回放`,
    }
  } catch (e) {
    ;(window as any).$message?.error('回放加载失败：' + (e as Error).message)
  }
}

async function onDelete(id: number) {
  ;(window as any).$dialog?.warning({
    title: '删除战绩',
    content: '确定删除这局战绩？此操作不可恢复。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.deleteGame(String(id))
        rows.value = rows.value.filter((r) => r.id !== id)
        if (expanded.value === id) expanded.value = null
        ;(window as any).$message?.success('已删除')
      } catch (e) {
        ;(window as any).$message?.error('删除失败：' + (e as Error).message)
      }
    },
  })
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h2>我的战绩</h2>

    <p v-if="!auth.isLoggedIn()" class="hint">请先在右上角登录后查看战绩</p>
    <template v-else>
      <p v-if="error" class="err">{{ error }}</p>
      <p v-else-if="loading" class="hint">加载中…</p>
      <p v-else-if="!rows.length" class="hint">还没有战绩，下完一局会自动保存</p>
      <ul v-else class="game-list">
        <li v-for="r in rows" :key="r.id" class="game-item">
          <div class="game-head">
            <span class="badge" :class="r.result">{{ resultText[r.result] }}</span>
            <span>难度 {{ diffText[r.difficulty] || r.difficulty }}</span>
            <span>执{{ colorText[r.human_color] }}</span>
            <span class="date">{{ fmtDate(r.created_at) }}</span>
            <span class="actions">
              <n-button text size="tiny" @click="toggleExpand(r.id)">
                {{ expanded === r.id ? '收起' : '记谱' }}
              </n-button>
              <n-button text size="tiny" type="primary" @click="onReplay(r.id)">回放</n-button>
              <n-button text size="tiny" type="error" @click="onDelete(r.id)">删除</n-button>
            </span>
          </div>
          <div v-if="expanded === r.id" class="moves">{{ detailMoves[r.id] || '加载中…' }}</div>
        </li>
      </ul>
    </template>

    <div v-if="replay" class="replay-host">
      <ReplayPanel :moves="replay.moves as any" :title="replay.title" @close="replay = null" />
    </div>
  </div>
</template>
