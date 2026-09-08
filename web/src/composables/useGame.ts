import { ref, computed } from 'vue'
import XQ, { strongAiMove, isXqAvailable } from '../engine'
import type { Board, Color, Move, Cell, GameResult } from '../types'

// 单步历史记录：用于悔棋（需还原被吃子）与保存（需完整走子序列）。
export interface HistoryEntry {
  mv: Move
  cap: Cell // 该步吃掉的子（用于 undoMove）
  color: Color // 走子方
  note: string // 中文着法（如「炮二平五」）
}

// 游戏状态（组合式函数）：把原 index.html 里的全局变量 + 交互逻辑收敛为可复用状态。
// 做成单例：全局只有一局棋，路由切换后状态保持。
function createGame() {
  const board = ref<Board>(XQ.initialBoard())
  const turn = ref<Color>('r')
  const selected = ref<[number, number] | null>(null)
  const legalTargets = ref<[number, number][]>([])
  const lastMove = ref<Move | null>(null)
  const thinking = ref(false)
  const gameOver = ref(false)
  const winner = ref<Color | null>(null)
  const result = ref<'win' | 'lose' | 'draw' | null>(null)
  const moveList = ref<string[]>([])
  const history = ref<HistoryEntry[]>([])

  const humanColor = ref<Color>('r') // 玩家默认执红先行
  const difficulty = ref<'easy' | 'medium' | 'hard'>('medium')

  const aiColor = computed<Color>(() => XQ.opp(humanColor.value))
  const depthFor = computed(() => (difficulty.value === 'easy' ? 2 : difficulty.value === 'medium' ? 3 : 4))
  const canUndo = computed(() => history.value.length > 0 && !thinking.value && !gameOver.value)

  // 当前局面下「玩家是否还有可走的子」（用于 UI 提示）
  const status = computed<string>(() => {
    if (gameOver.value) {
      if (winner.value === humanColor.value) return '你赢了 🎉'
      if (winner.value === aiColor.value) return '电脑获胜'
      return '和棋'
    }
    if (thinking.value) return '电脑思考中…'
    return turn.value === humanColor.value ? '轮到你走' : '电脑回合'
  })

  // 序列化为后端保存格式：{from, to, color, piece}
  function movesForSave() {
    return history.value.map((h) => ({
      from: h.mv.from,
      to: h.mv.to,
      color: h.color,
      piece: h.mv.piece,
    }))
  }

  function reset() {
    board.value = XQ.initialBoard()
    turn.value = 'r'
    selected.value = null
    legalTargets.value = []
    lastMove.value = null
    thinking.value = false
    gameOver.value = false
    winner.value = null
    result.value = null
    moveList.value = []
    history.value = []
  }

  // 真正落子：改写棋盘、记录历史、更新记谱、判定胜负
  function applyMove(mv: Move, color: Color) {
    const cap = XQ.makeMove(board.value, mv)
    board.value = XQ.cloneBoard(board.value) // 替换引用以触发响应式重绘
    const note = XQ.notation(mv, color)
    history.value.push({ mv, cap, color, note })
    moveList.value.push(note)
    lastMove.value = mv
    turn.value = XQ.opp(color)
    checkGameOver()
  }

  function commitMove(mv: Move, color: Color) {
    applyMove(mv, color)
    if (!gameOver.value && turn.value === aiColor.value) scheduleAi()
  }

  function checkGameOver() {
    const moves = XQ.legalMoves(board.value, turn.value)
    if (moves.length === 0) {
      gameOver.value = true
      winner.value = XQ.opp(turn.value) // 当前方无子可走 → 对方胜
      result.value = winner.value === humanColor.value ? 'win' : 'lose'
    }
  }

  function selectAt(x: number, y: number) {
    selected.value = [x, y]
    const all = XQ.legalMoves(board.value, turn.value)
    legalTargets.value = all
      .filter((m) => m.from[0] === x && m.from[1] === y)
      .map((m) => m.to)
  }

  function clickSquare(x: number, y: number) {
    if (thinking.value || gameOver.value || turn.value !== humanColor.value) return
    const p = board.value[x][y]

    if (selected.value) {
      const isTarget = legalTargets.value.some((t) => t[0] === x && t[1] === y)
      if (isTarget) {
        commitMove(
          { from: selected.value, to: [x, y], piece: board.value[selected.value[0]][selected.value[1]]! },
          humanColor.value,
        )
        selected.value = null
        legalTargets.value = []
        return
      }
      if (p && p.c === humanColor.value) {
        selectAt(x, y)
        return
      }
      selected.value = null
      legalTargets.value = []
      return
    }
    if (p && p.c === humanColor.value) selectAt(x, y)
  }

  // 悔棋：撤销「电脑一步 + 玩家一步」，把走子权交还玩家。
  // 若历史仅剩玩家一步（电脑尚未应招），则只撤玩家那一步。
  function undo() {
    if (thinking.value || history.value.length === 0) return
    if (gameOver.value) {
      gameOver.value = false
      winner.value = null
      result.value = null
    }
    let e = history.value.pop()!
    XQ.undoMove(board.value, e.mv, e.cap)
    if (history.value.length > 0 && history.value[history.value.length - 1].color === humanColor.value) {
      e = history.value.pop()!
      XQ.undoMove(board.value, e.mv, e.cap)
    }
    board.value = XQ.cloneBoard(board.value)
    moveList.value = history.value.map((h) => h.note)
    lastMove.value = history.value.length ? history.value[history.value.length - 1].mv : null
    turn.value = humanColor.value
    thinking.value = false
  }

  // 认输：直接判负并结束对局（供自动保存战绩使用）
  function resign() {
    if (gameOver.value || thinking.value) return
    gameOver.value = true
    winner.value = aiColor.value
    result.value = 'lose'
  }

  // 强引擎搜索用时（毫秒）：难度越高想越久
  const millisFor = computed(() =>
    difficulty.value === 'easy' ? 300 : difficulty.value === 'medium' ? 1000 : 2000,
  )

  function scheduleAi() {
    thinking.value = true
    // 让「思考中」状态先渲染出来，再跑搜索（搜索是同步阻塞）
    setTimeout(() => {
      const color = aiColor.value
      let mv: Move | null = null
      // easy 难度保留 30% 随机走子（新手友好，原版设定）
      if (difficulty.value === 'easy' && Math.random() < 0.3) {
        const ms = XQ.legalMoves(board.value, color)
        const r = ms[Math.floor(Math.random() * ms.length)]
        if (r) mv = { from: r.from, to: r.to, piece: board.value[r.from[0]][r.from[1]]! }
      } else if (isXqAvailable()) {
        // 优先用象眼 xqwlight 专业引擎
        mv = strongAiMove(board.value, color, millisFor.value)
      }
      // 兜底：强引擎未加载或异常时退回内置搜索
      if (!mv) {
        mv = XQ.searchWithTime(board.value, color, depthFor.value)
      }
      thinking.value = false
      if (mv) commitMove(mv, color)
    }, 30)
  }

  function newGame() {
    reset()
    if (turn.value === aiColor.value) scheduleAi()
  }

  return {
    board,
    turn,
    selected,
    legalTargets,
    lastMove,
    thinking,
    gameOver,
    winner,
    result,
    moveList,
    history,
    humanColor,
    difficulty,
    aiColor,
    canUndo,
    status,
    movesForSave,
    clickSquare,
    newGame,
    undo,
    resign,
  }
}

let _game: ReturnType<typeof createGame> | null = null
export function useGame() {
  if (!_game) _game = createGame()
  return _game
}
