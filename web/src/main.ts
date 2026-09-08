import { createApp } from 'vue'
import NaiveUi from 'naive-ui'
import { createDiscreteApi } from 'naive-ui'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(router)
app.use(NaiveUi) // 全局注册 Naive UI 组件（n-button / n-menu / n-data-table ...）

// 离散 API：组件内通过 window.$message / window.$dialog 跨级调用 toast / confirm
const { message, dialog } = createDiscreteApi(['message', 'dialog'])
;(window as any).$message = message
;(window as any).$dialog = dialog

app.mount('#app')
