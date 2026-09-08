import { ref } from 'vue'
import { api, getUser, setUser, setToken } from '../api/client'

// 认证状态（组合式函数，单例）：登录/注册/登出，维护响应式 user。
// token / user 实际存于 localStorage（见 api/client.ts），这里只持有内存镜像。
// 做成单例，保证路由切换后各视图共享同一份登录态。
function createAuth() {
  const user = ref<{ username: string } | null>(getUser())
  const error = ref('')
  const loading = ref(false)

  async function register(username: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = ''
    try {
      const r = await api.register(username, password)
      setToken(r.token)
      setUser({ username: r.username })
      user.value = { username: r.username }
      return true
    } catch (e) {
      error.value = (e as Error).message || '注册失败'
      return false
    } finally {
      loading.value = false
    }
  }

  async function login(username: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = ''
    try {
      const r = await api.login(username, password)
      setToken(r.token)
      setUser({ username: r.username })
      user.value = { username: r.username }
      return true
    } catch (e) {
      error.value = (e as Error).message || '登录失败'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    setToken(null)
    setUser(null)
    user.value = null
  }

  return {
    user,
    error,
    loading,
    isLoggedIn: () => !!user.value,
    register,
    login,
    logout,
  }
}

let _instance: ReturnType<typeof createAuth> | null = null
export function useAuth() {
  if (!_instance) _instance = createAuth()
  return _instance
}
