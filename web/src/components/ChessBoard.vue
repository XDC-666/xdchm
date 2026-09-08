<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import XQ from '../engine'
import type { Board, Move } from '../types'

const props = withDefaults(
  defineProps<{
    board: Board
    selected?: [number, number] | null
    legalTargets?: [number, number][]
    lastMove?: Move | null
    readOnly?: boolean
  }>(),
  { selected: null, legalTargets: () => [], lastMove: null, readOnly: false },
)

const emit = defineEmits<{ (e: 'square-click', x: number, y: number): void }>()

// 与原 index.html 一致的棋盘几何参数
const CELL = 60
const MARGIN = 40
const W = 560
const H = 620
const R = CELL * 0.42

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null

function drawBoardGrid() {
  if (!ctx) return
  // 木色底
  ctx.fillStyle = '#e8c87a'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#3d2310'
  ctx.lineWidth = 1.5

  // 横线 10 条
  for (let y = 0; y < 10; y++) {
    const py = MARGIN + y * CELL
    ctx.beginPath()
    ctx.moveTo(MARGIN, py)
    ctx.lineTo(MARGIN + 8 * CELL, py)
    ctx.stroke()
  }
  // 竖线 9 条（河界处中间断开）
  for (let x = 0; x < 9; x++) {
    const px = MARGIN + x * CELL
    if (x === 0 || x === 8) {
      ctx.beginPath()
      ctx.moveTo(px, MARGIN)
      ctx.lineTo(px, MARGIN + 9 * CELL)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(px, MARGIN)
      ctx.lineTo(px, MARGIN + 4 * CELL)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(px, MARGIN + 5 * CELL)
      ctx.lineTo(px, MARGIN + 9 * CELL)
      ctx.stroke()
    }
  }
  // 九宫斜线（黑方 y0-2，红方 y7-9）
  drawPalace(3, 0)
  drawPalace(3, 7)
  // 楚河汉界
  ctx.fillStyle = '#3d2310'
  ctx.font = '22px "KaiTi","STKaiti",serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('楚　河', MARGIN + 2 * CELL, MARGIN + 4.5 * CELL)
  ctx.fillText('漢　界', MARGIN + 6 * CELL, MARGIN + 4.5 * CELL)
  // 炮 / 兵位标记
  const cannon = [
    [1, 2],
    [7, 2],
    [1, 7],
    [7, 7],
  ]
  const pawn = [
    [0, 3],
    [2, 3],
    [4, 3],
    [6, 3],
    [8, 3],
    [0, 6],
    [2, 6],
    [4, 6],
    [6, 6],
    [8, 6],
  ]
  for (const [x, y] of [...cannon, ...pawn]) drawStar(MARGIN + x * CELL, MARGIN + y * CELL)
}

function drawPalace(x0: number, y0: number) {
  if (!ctx) return
  ctx.beginPath()
  ctx.moveTo(MARGIN + x0 * CELL, MARGIN + y0 * CELL)
  ctx.lineTo(MARGIN + (x0 + 2) * CELL, MARGIN + (y0 + 2) * CELL)
  ctx.moveTo(MARGIN + (x0 + 2) * CELL, MARGIN + y0 * CELL)
  ctx.lineTo(MARGIN + x0 * CELL, MARGIN + (y0 + 2) * CELL)
  ctx.stroke()
}

function drawStar(cx: number, cy: number) {
  if (!ctx) return
  const len = 4
  const gap = 4
  ctx.strokeStyle = '#3d2310'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(cx, cy - gap)
  ctx.lineTo(cx, cy - gap - len)
  ctx.moveTo(cx, cy + gap)
  ctx.lineTo(cx, cy + gap + len)
  ctx.moveTo(cx - gap, cy)
  ctx.lineTo(cx - gap - len, cy)
  ctx.moveTo(cx + gap, cy)
  ctx.lineTo(cx + gap + len, cy)
  ctx.stroke()
}

function drawPiece(x: number, y: number, piece: { t: string; c: 'r' | 'b' }) {
  if (!ctx) return
  const cx = MARGIN + x * CELL
  const cy = MARGIN + y * CELL
  const isRed = piece.c === 'r'

  // 落地投影
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(cx, cy + 5, R * 0.95, R * 0.78, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(30,14,5,.38)'
  ctx.fill()
  ctx.restore()

  // 外缘
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fillStyle = isRed ? '#9e1a1a' : '#111'
  ctx.fill()

  // 主体球面渐变
  const bodyR = R - 3
  const grad = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.12, cx, cy, bodyR)
  if (isRed) {
    grad.addColorStop(0, '#fffefc')
    grad.addColorStop(0.35, '#fff5e8')
    grad.addColorStop(0.72, '#f0d9b8')
    grad.addColorStop(1, '#deb684')
  } else {
    grad.addColorStop(0, '#6a6a6a')
    grad.addColorStop(0.35, '#3d3d3d')
    grad.addColorStop(0.72, '#222')
    grad.addColorStop(1, '#0f0f0f')
  }
  ctx.beginPath()
  ctx.arc(cx, cy, bodyR, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()

  // 描边
  ctx.lineWidth = 2.2
  ctx.strokeStyle = isRed ? '#b91c1c' : '#d4b884'
  ctx.beginPath()
  ctx.arc(cx, cy, bodyR - 1, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 1.2
  ctx.strokeStyle = isRed ? 'rgba(185,28,28,.35)' : 'rgba(212,184,132,.35)'
  ctx.beginPath()
  ctx.arc(cx, cy, bodyR - 7, 0, Math.PI * 2)
  ctx.stroke()

  // 文字
  const ch = XQ.charOf(piece.t, piece.c)
  ctx.font = 'bold 30px "KaiTi","STKaiti","SimSun",serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = isRed ? 'rgba(100,0,0,.35)' : 'rgba(0,0,0,.45)'
  ctx.fillText(ch, cx + 1, cy + 2)
  ctx.fillStyle = isRed ? '#c41e1e' : '#f5e6c8'
  ctx.fillText(ch, cx, cy)
  ctx.fillStyle = isRed ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.55)'
  ctx.fillText(ch, cx - 1, cy - 1)
}

function render() {
  if (!ctx) return
  drawBoardGrid()

  // 上一步高亮
  if (props.lastMove) {
    for (const [x, y] of [props.lastMove.from, props.lastMove.to]) {
      ctx.fillStyle = 'rgba(80,160,80,.30)'
      ctx.fillRect(MARGIN + x * CELL - CELL / 2, MARGIN + y * CELL - CELL / 2, CELL, CELL)
    }
  }
  // 选中高亮
  if (props.selected) {
    const [sx, sy] = props.selected
    ctx.strokeStyle = '#e0a000'
    ctx.lineWidth = 3
    ctx.strokeRect(MARGIN + sx * CELL - CELL / 2 + 2, MARGIN + sy * CELL - CELL / 2 + 2, CELL - 4, CELL - 4)
  }
  // 可走目标
  for (const [tx, ty] of props.legalTargets) {
    const hasPiece = props.board[tx][ty]
    if (hasPiece) {
      ctx.strokeStyle = 'rgba(196,30,30,.9)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(MARGIN + tx * CELL, MARGIN + ty * CELL, R + 2, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      ctx.fillStyle = 'rgba(40,120,40,.55)'
      ctx.beginPath()
      ctx.arc(MARGIN + tx * CELL, MARGIN + ty * CELL, 7, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  // 棋子
  for (let x = 0; x < 9; x++) {
    for (let y = 0; y < 10; y++) {
      const p = props.board[x][y]
      if (p) drawPiece(x, y, p)
    }
  }
}

function handleClick(e: MouseEvent) {
  if (props.readOnly) return
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const px = (e.clientX - rect.left) * (W / rect.width)
  const py = (e.clientY - rect.top) * (H / rect.height)
  const x = Math.round((px - MARGIN) / CELL)
  const y = Math.round((py - MARGIN) / CELL)
  if (x < 0 || x > 8 || y < 0 || y > 9) return
  emit('square-click', x, y)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  canvas.width = W * dpr
  canvas.height = H * dpr
  canvas.style.width = W + 'px'
  canvas.style.height = H + 'px'
  ctx = canvas.getContext('2d')
  if (ctx) ctx.scale(dpr, dpr)
  render()
})

watch(
  () => [props.board, props.selected, props.legalTargets, props.lastMove],
  () => render(),
  { deep: false },
)
</script>

<template>
  <canvas ref="canvasRef" @click="handleClick" />
</template>
