<script setup lang="ts">
/**
 * 流式 Markdown 渲染组件
 * 使用 markstream-vue 实现高性能流式渲染
 * - 支持流式增量渲染
 * - 支持 Mermaid 图表
 * - 支持代码高亮 (使用 Monaco 编辑器 + stream-monaco)
 */
import MarkdownRender from 'markstream-vue'
import { computed } from 'vue'
import { useAppStore } from '@/stores'
import 'markstream-vue/index.css'

interface Props {
  content: string
  isStreaming?: boolean
}

defineProps<Props>()

const appStore = useAppStore()
const isDark = computed(() => appStore.isDarkMode)
</script>

<template>
  <MarkdownRender
    :content="content"
    :typewriter="isStreaming"
    :code-block-stream="isStreaming"
    :is-dark="isDark"
    :themes="['github-dark', 'github-light']"
    code-block-dark-theme="github-dark"
    code-block-light-theme="github-light"
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

/* Mermaid 样式修复 */
.markdown-render [class*="_mermaid"],
.markdown-render [class*="mermaid"] {
  @apply rounded-xl overflow-hidden;
}

/* Mermaid 头部样式 - 修复图标和文字对齐 */
.markdown-render [class*="_mermaid"] .flex.items-center,
.markdown-render [class*="mermaid"] .flex.items-center {
  display: flex !important;
  align-items: center !important;
  line-height: 1 !important;
}

/* Mermaid 头部 img 图标 - 关键修复 */
.markdown-render [class*="_mermaid"] .flex.items-center img,
.markdown-render [class*="mermaid"] .flex.items-center img {
  width: 1rem !important;
  height: 1rem !important;
  flex-shrink: 0 !important;
  display: block !important;
  margin: 0 !important;
}

/* Mermaid 头部 span 文字 - 关键修复 */
.markdown-render [class*="_mermaid"] .flex.items-center span,
.markdown-render [class*="mermaid"] .flex.items-center span {
  display: flex !important;
  align-items: center !important;
  line-height: 1 !important;
  margin: 0 !important;
}

/* Mermaid 内容区域 - 白色/暗色背景 */
.markdown-render [class*="_mermaid"] > div:last-child,
.markdown-render [class*="mermaid"] [class*="content"],
.markdown-render [class*="mermaid"] > div:not([class*="header"]):not(:first-child) {
  @apply bg-white dark:bg-gray-900 p-4;
}

/* Mermaid 图表 SVG 样式 - 排除头部图标 */
.markdown-render [class*="_mermaid"] > div:last-child svg,
.markdown-render [class*="mermaid"] svg.mermaid-svg,
.markdown-render [class*="mermaid"] svg[id^="mermaid"] {
  @apply max-w-full h-auto;
}

/* 亮色模式下 Mermaid 容器 */
.markdown-render [class*="mermaid-container"],
.markdown-render [class*="mermaid-block"],
.markdown-render [class*="_mermaid"] {
  @apply bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl;
}
</style>
