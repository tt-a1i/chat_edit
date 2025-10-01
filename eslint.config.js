import antfu from '@antfu/eslint-config'

export default antfu({
  // Vue 和 TypeScript 支持
  vue: true,
  typescript: true,

  // 忽略文件配置
  ignores: [
    'node_modules',
    'dist',
    'dist-ssr',
    '*.local',
    '.git',
    '.vscode',
    'public',
    'ollama_data',
    'pnpm-lock.yaml',
  ],

  // 自定义规则
  rules: {
    // 允许 console 语句（开发阶段）
    'no-console': 'off',

    // Vue 相关规则
    'vue/multi-word-component-names': 'off', // 允许单词组件名
    'vue/require-default-prop': 'off', // 可选的默认 prop
    'vue/html-self-closing': 'off', // 允许不自闭合标签

    // TypeScript 相关规则
    '@typescript-eslint/no-explicit-any': 'warn', // any 类型警告而非错误
    '@typescript-eslint/ban-ts-comment': 'off', // 允许 @ts-ignore 等注释

    // 代码风格
    'unused-imports/no-unused-vars': 'warn', // 未使用变量警告
    'style/brace-style': ['error', '1tbs'], // 统一大括号风格
    'curly': ['error', 'multi-line'], // 多行语句必须使用大括号

    // 关闭某些严格规则（适应现有代码）
    'antfu/if-newline': 'off',
    'antfu/top-level-function': 'off',
  },
})
