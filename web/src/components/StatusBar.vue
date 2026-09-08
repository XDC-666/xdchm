<script setup lang="ts">
import { computed } from 'vue'
import { isXqAvailable } from '../engine'

defineProps<{
  status: string
  moves: string[]
  thinking: boolean
  gameOver: boolean
}>()

// 强引擎脚本由 index.html 普通 <script> 在 main.ts 之前加载，此处直接探测是否就绪
const engineName = computed(() => (isXqAvailable() ? '象眼 xqwlight 强引擎' : '内置引擎（弱）'))
</script>

<template>
  <div class="status-row">
    <div class="status" :class="{ thinking, win: gameOver }">{{ status }}</div>
    <span class="engine-badge" :class="isXqAvailable() ? 'strong' : 'weak'">{{ engineName }}</span>
  </div>
  <div class="movelist" v-if="moves.length">
    <span v-for="(m, i) in moves" :key="i">{{ i + 1 }}.{{ m }}　</span>
  </div>
</template>
