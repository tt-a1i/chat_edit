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
    rollupOptions: {
      output: {
        manualChunks: {
          // Monaco Editor 单独打包（98MB）- 懒加载
          'monaco-editor': ['monaco-editor'],
          // Quill 编辑器单独打包（3.7MB）
          'quill': ['quill', 'quill-table-ui'],
          // Markdown 渲染相关库（~5MB）
          'markdown': [
            'markdown-it',
            'markdown-it-link-attributes',
            'markdown-it-texmath',
            'katex',
            'highlight.js',
          ],
          // UI 框架（Naive UI）
          'naive-ui': ['naive-ui'],
          // 文档处理库
          'document': ['docx', 'mammoth', 'turndown', 'html2pdf.js'],
          // Vue 核心和 Pinia
          'vue-vendor': ['vue', 'pinia', '@vueuse/core'],
        },
      },
    },
  },
})
