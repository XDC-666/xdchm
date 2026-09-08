<script setup lang="ts">
defineProps<{
  difficulty: 'easy' | 'medium' | 'hard'
  humanColor: 'r' | 'b'
  canUndo: boolean
  gameOver: boolean
}>()

const emit = defineEmits<{
  (e: 'update:difficulty', v: 'easy' | 'medium' | 'hard'): void
  (e: 'update:humanColor', v: 'r' | 'b'): void
  (e: 'new-game'): void
  (e: 'undo'): void
  (e: 'resign'): void
}>()

const diffOptions = [
  { label: '简单', value: 'easy' },
  { label: '中等', value: 'medium' },
  { label: '困难', value: 'hard' },
]
const colorOptions = [
  { label: '红（先手）', value: 'r' },
  { label: '黑（后手）', value: 'b' },
]
</script>

<template>
  <div class="controls">
    <div class="row">
      <span class="label">难度</span>
      <n-select
        :value="difficulty"
        :options="diffOptions"
        @update:value="(v: 'easy' | 'medium' | 'hard') => emit('update:difficulty', v)"
      />
    </div>
    <div class="row">
      <span class="label">执子</span>
      <n-select
        :value="humanColor"
        :options="colorOptions"
        @update:value="(v: 'r' | 'b') => emit('update:humanColor', v)"
      />
    </div>
    <n-button type="primary" block @click="emit('new-game')">新对局</n-button>
    <n-space>
      <n-button :disabled="!canUndo" @click="emit('undo')">悔棋</n-button>
      <n-button :disabled="gameOver" tertiary type="error" @click="emit('resign')">认输</n-button>
    </n-space>
  </div>
</template>
