<script setup lang="ts">
/**
 * 流式 Markdown 渲染组件
 * 使用 markstream-vue 实现高性能流式渲染
 * - 支持流式增量渲染
 * - 支持 Mermaid 图表
 * - 支持代码高亮
 */
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'

interface Props {
  content: string
  isStreaming?: boolean
}

defineProps<Props>()
</script>

<template>
  <MarkdownRender
    :content="content"
    :typewriter="isStreaming"
    :code-block-stream="isStreaming"
  />
</template>

<style>
/* markstream-vue 样式覆盖 - 适配项目主题 */
.markdown-render {
  /* 继承 prose 样式 */
  font-size: inherit;
  line-height: inherit;
  color: inherit;
}

/* 代码块样式 */
.markdown-render pre {
  @apply rounded-lg bg-gray-900 dark:bg-gray-950;
}

/* 链接样式 */
.markdown-render a {
  @apply text-teal-600 dark:text-teal-400 hover:underline;
}

/* 表格样式 */
.markdown-render table {
  @apply w-full border-collapse;
}

.markdown-render th,
.markdown-render td {
  @apply border border-gray-200 dark:border-gray-700 px-3 py-2;
}

.markdown-render th {
  @apply bg-gray-100 dark:bg-gray-800 font-semibold;
}
</style>
