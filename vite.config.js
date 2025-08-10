// vite.config.js
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  server: {
    port: 5173, // 指定开发服务器端口
    strictPort: false, // 如果端口已被占用，尝试下一个可用端口
    hmr: {
      overlay: false // 禁用HMR错误覆盖
    }
  }
})
