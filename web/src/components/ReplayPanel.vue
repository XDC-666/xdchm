<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import XQ from '../engine'
import ChessBoard from './ChessBoard.vue'

interface ReplayMove {
  from: [number, number]
  to: [number, number]
  color: 'r' | 'b'
  piece?: { t: string; c: 'r' | 'b' }
}

const props = defineProps<{
  moves: ReplayMove[]
  title?: string
}>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const board = ref<ReturnType<typeof XQ.initialBoard>>(XQ.initialBoard())
const step = ref(0) // 已应用的步数
const playing = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const total = computed(() => props.moves.length)
const lastMove = computed(() => (step.value > 0 ? props.moves[step.value - 1] : null))

function rebuild() {
  let b = XQ.initialBoard()
  for (let i = 0; i < step.value; i++) {
    const m = props.moves[i]
    XQ.makeMove(b, { from: m.from, to: m.to, piece: m.piece || { t: 'P', c: m.color } })
  }
  board.value = XQ.cloneBoard(b)
}

function next() {
  if (step.value >= total.value) return
  step.value++
  rebuild()
  if (step.value >= total.value) pause()
}
function prev() {
  if (step.value <= 0) return
  step.value--
  rebuild()
}
function reset() {
  step.value = 0
  rebuild()
}
function play() {
  if (step.value >= total.value) reset()
  playing.value = true
  timer = setInterval(next, 700)
}
function pause() {
  playing.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function toggle() {
  playing.value ? pause() : play()
}

onUnmounted(pause)
// 外部切换对局时从头开始
watch(
  () => props.moves,
  () => {
    pause()
    reset()
  },
)
</script>

<template>
  <div class="replay-wrap">
    <div class="replay-bar">
      <strong>{{ title || '对局回放' }}</strong>
      <span class="step">{{ step }} / {{ total }}</span>
      <button class="ghost small" @click="toggle">{{ playing ? '暂停' : '播放' }}</button>
      <button class="ghost small" @click="prev" :disabled="step === 0">上一步</button>
      <button class="ghost small" @click="next" :disabled="step >= total">下一步</button>
      <button class="ghost small" @click="reset" :disabled="step === 0">重置</button>
      <button class="ghost small" @click="emit('close')">退出回放</button>
    </div>
    <div class="board-wrap">
      <ChessBoard :board="board" :last-move="lastMove as any" :read-only="true" />
    </div>
  </div>
</template>
