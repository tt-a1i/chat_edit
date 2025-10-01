import antfu from '@antfu/eslint-config'

export default antfu({
  // 添加忽略文件配置
  ignores: [
    'node_modules',
    'dist',
  ],
})
