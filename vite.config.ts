import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    // Vite 8 使用 Rolldown，rollupOptions 仍然兼容但推荐使用 rolldownOptions
    rollupOptions: {
      output: {
        // Vite 8/Rolldown 使用 advancedChunks 替代 manualChunks
        advancedChunks: {
          groups: [
            // Monaco Editor 单独打包（98MB）- 懒加载
            { name: 'monaco-editor', test: /[\\/]node_modules[\\/]monaco-editor[\\/]/ },
            // Quill 编辑器单独打包（3.7MB）
            { name: 'quill', test: /[\\/]node_modules[\\/]quill(?:-table-ui)?[\\/]/ },
            // Markdown 渲染相关库（~5MB）
            { name: 'markdown', test: /[\\/]node_modules[\\/](markdown-it|markdown-it-link-attributes|markdown-it-texmath|katex|highlight\.js)[\\/]/ },
            // UI 框架（Naive UI）
            { name: 'naive-ui', test: /[\\/]node_modules[\\/]naive-ui[\\/]/ },
            // 文档处理库
            { name: 'document', test: /[\\/]node_modules[\\/](docx|mammoth|turndown|html2pdf\.js)[\\/]/ },
            // Vue 核心和 Pinia
            { name: 'vue-vendor', test: /[\\/]node_modules[\\/](vue|pinia|@vueuse[\\/]core)[\\/]/ },
          ],
        },
      },
    },
  },
})
