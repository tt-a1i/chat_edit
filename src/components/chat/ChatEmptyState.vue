<script setup lang="ts">
import { IconBulb, IconCode, IconPencil, IconSparkles } from '@tabler/icons-vue'
import { useChatStore } from '@/stores'

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
  <div class="flex h-full flex-col items-center justify-center px-4 py-8">
    <!-- Logo 和欢迎文字 -->
    <div class="mb-12 text-center animate-fade-in">
      <div class="mb-6 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-5 shadow-xl animate-float">
        <IconSparkles :size="56" class="text-white" />
      </div>
      <h1 class="mb-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
        开始你的 AI 对话
      </h1>
      <p class="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
        选择一个示例问题快速开始，或直接输入你的问题
      </p>
    </div>

    <!-- 示例问题卡片 -->
    <div class="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 animate-slide-up">
      <button
        v-for="(example, index) in exampleQuestions"
        :key="index"
        class="group relative flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
        :style="{ animationDelay: `${index * 100}ms` }"
        @click="handleExampleClick(example.prompt)"
      >
        <!-- 图标 -->
        <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110" :class="[example.bg]">
          <component :is="example.icon" :size="24" :class="example.color" />
        </div>

        <!-- 文字 -->
        <div class="flex-1 overflow-hidden">
          <div class="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            {{ example.title }}
          </div>
          <div class="line-clamp-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {{ example.prompt }}
          </div>
        </div>

        <!-- 箭头图标 -->
        <div class="flex-shrink-0 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          <svg class="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </button>
    </div>

    <!-- 底部提示 -->
    <div class="mt-12 text-center animate-fade-in" style="animation-delay: 400ms;">
      <p class="text-sm text-gray-500 dark:text-gray-500 flex items-center justify-center gap-2">
        <span>Powered by</span>
        <span class="font-semibold text-gray-700 dark:text-gray-400">Moonshot AI</span>
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

/* 动画效果 */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.animate-slide-up {
  animation: slide-up 0.8s ease-out;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>
