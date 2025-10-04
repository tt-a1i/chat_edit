import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    // 测试环境配置
    environment: 'happy-dom',

    // 全局变量
    globals: true,

    // 包含的测试文件
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],

    // 排除的文件（包括 E2E 测试）
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'tests/e2e/**'],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules',
        'dist',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'tests',
        '**/{vite,vitest,tailwind,postcss,eslint}.config.*',
        'src/main.ts',
        'src/types',
      ],
      // 覆盖率阈值
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },

    // 测试超时时间
    testTimeout: 10000,

    // 单个测试文件的超时时间
    hookTimeout: 10000,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
