<script setup lang="ts">
import { ref, watch } from 'vue'
import ChessBoard from '../components/ChessBoard.vue'
import StatusBar from '../components/StatusBar.vue'
import ControlPanel from '../components/ControlPanel.vue'
import { useGame } from '../composables/useGame'
import { useAuth } from '../composables/useAuth'
import { api } from '../api/client'

const g = useGame()
const auth = useAuth()

// 对局结束 → 已登录则自动保存战绩（从原 App 迁移过来）
let savedForCurrent = false
watch(
  () => [g.gameOver.value, auth.user.value],
  async ([over]) => {
    if (!over || savedForCurrent) return
    if (!auth.isLoggedIn()) {
      ;(window as any).$message?.warning('登录后可自动保存战绩')
      return
    }
    savedForCurrent = true
    try {
      await api.saveGame({
        result: g.result.value!,
        difficulty: g.difficulty.value,
        human_color: g.humanColor.value,
        moves: g.movesForSave(),
      })
      ;(window as any).$message?.success('战绩已自动保存')
    } catch (e) {
      ;(window as any).$message?.error('保存失败：' + (e as Error).message)
    }
  },
)
watch(
  () => g.history.value.length,
  (n) => {
    if (n === 0) savedForCurrent = false
  },
)
</script>

<template>
  <div class="home">
    <section class="board-col">
      <div class="board-wrap">
        <ChessBoard
          :board="g.board.value"
          :selected="g.selected.value"
          :legal-targets="g.legalTargets.value"
          :last-move="g.lastMove.value"
          @square-click="g.clickSquare"
        />
        <div class="thinking-overlay" :class="{ show: g.thinking.value }">电脑思考中…</div>
      </div>
    </section>

    <aside class="side-col">
      <StatusBar
        :status="g.status.value"
        :moves="g.moveList.value"
        :thinking="g.thinking.value"
        :game-over="g.gameOver.value"
      />
      <ControlPanel
        :difficulty="g.difficulty.value"
        :human-color="g.humanColor.value"
        :can-undo="g.canUndo.value"
        :game-over="g.gameOver.value"
        @update:difficulty="(v) => (g.difficulty.value = v)"
        @update:humanColor="
          (v) => {
            g.humanColor.value = v
            g.newGame()
          }
        "
        @new-game="g.newGame()"
        @undo="g.undo()"
        @resign="g.resign()"
      />
      <p v-if="g.gameOver.value" class="result-tip">
        {{ g.result.value === 'win' ? '🎉 你赢了！' : g.result.value === 'lose' ? '惜败，再来一局？' : '和棋' }}
        <template v-if="!auth.isLoggedIn()">登录后战绩自动保存。</template>
      </p>
    </aside>
  </div>
</template>
