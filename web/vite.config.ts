import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // 相对路径：本地 dev / 预览 / GitHub Pages 子路径都能正确加载资源
  base: './',
  plugins: [vue()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
  },
})
