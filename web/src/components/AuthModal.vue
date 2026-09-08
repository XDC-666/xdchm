<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const auth = useAuth()
const emit = defineEmits<{ (e: 'close'): void }>()

const mode = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')

async function submit() {
  const u = username.value.trim()
  const p = password.value
  if (!u || !p) {
    ;(window as any).$message?.error('请输入用户名和密码')
    return
  }
  const ok = mode.value === 'login' ? await auth.login(u, p) : await auth.register(u, p)
  if (ok) {
    ;(window as any).$message?.success(mode.value === 'login' ? '登录成功' : '注册成功')
    emit('close')
  } else {
    ;(window as any).$message?.error(auth.error.value || '操作失败')
  }
}
</script>

<template>
  <n-modal
    :show="true"
    preset="card"
    :title="mode === 'login' ? '登录' : '注册'"
    style="width: 420px"
    @update:show="(v: boolean) => { if (!v) emit('close') }"
  >
    <n-space vertical :size="14">
      <n-radio-group v-model:value="mode">
        <n-space>
          <n-radio value="login">登录</n-radio>
          <n-radio value="register">注册</n-radio>
        </n-space>
      </n-radio-group>

      <n-text v-if="mode === 'register'" depth="3" style="font-size: 13px">
        用户名限字母/数字/下划线（≤20 位），密码至少 8 位
      </n-text>

      <n-input v-model:value="username" placeholder="用户名" autocomplete="username" />
      <n-input
        v-model:value="password"
        type="password"
        placeholder="密码"
        show-password-on="click"
        autocomplete="current-password"
      />

      <n-button type="primary" block :loading="auth.loading.value" @click="submit">
        {{ mode === 'login' ? '登录' : '注册' }}
      </n-button>
    </n-space>
  </n-modal>
</template>
