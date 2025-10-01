<script setup lang="ts">
import { useChatStore } from '@/stores'
import { IconBulb, IconCode, IconPencil, IconSparkles } from '@tabler/icons-vue'

const chatStore = useChatStore()

// 示例问题
const exampleQuestions = [
  {
    icon: IconPencil,
    title: '写一篇博客',
    prompt: '帮我写一篇关于人工智能发展趋势的博客文章',
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: IconCode,
    title: '解释代码',
    prompt: '请解释这段 JavaScript 代码的作用',
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    icon: IconBulb,
    title: '创意灵感',
    prompt: '给我一些创意的项目想法',
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: IconSparkles,
    title: '润色文章',
    prompt: '帮我润色这篇文章，使其更加专业',
    color: 'text-pink-500',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
  },
]

function handleExampleClick(prompt: string) {
  chatStore.addUserMessage(prompt, null)
}
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center px-4">
    <!-- Logo 和欢迎文字 -->
    <div class="mb-8 text-center">
      <div class="mb-4 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-4 shadow-lg">
        <IconSparkles :size="48" class="text-white" />
      </div>
      <h1 class="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        开始你的 AI 对话
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        选择一个示例问题，或直接输入你的问题
      </p>
    </div>

    <!-- 示例问题卡片 -->
    <div class="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        v-for="(example, index) in exampleQuestions"
        :key="index"
        class="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
        @click="handleExampleClick(example.prompt)"
      >
        <!-- 图标 -->
        <div class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg" :class="[example.bg]">
          <component :is="example.icon" :size="20" :class="example.color" />
        </div>

        <!-- 文字 -->
        <div class="flex-1 overflow-hidden">
          <div class="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ example.title }}
          </div>
          <div class="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
            {{ example.prompt }}
          </div>
        </div>

        <!-- 箭头图标 -->
        <div class="flex-shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    </div>

    <!-- 底部提示 -->
    <div class="mt-8 text-center">
      <p class="text-xs text-gray-400 dark:text-gray-500">
        Powered by <span class="font-medium">Moonshot AI</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
/* 限制文本显示为最多两行 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
