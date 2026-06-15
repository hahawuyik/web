import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      // 👇 新增图片代理
      '/uploads': {
        target: 'http://localhost:3000',  // 与后端端口一致
        changeOrigin: true
        // 不需要 rewrite，直接转发 /uploads/xxx 到后端
      }
    }
  }
})