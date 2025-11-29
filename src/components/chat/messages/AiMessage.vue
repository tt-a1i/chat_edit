<script setup lang="ts">
import type { Message } from '@/services/database.ts'
import { ArrowPathIcon, CheckIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import { computed, ref } from 'vue'
import AIAvatar from '@/components/common/AIAvatar.vue'
import { env } from '@/config/env'
import { useChatStore } from '@/stores'
import Markdown from '@/utils/markdown.ts'
import 'highlight.js/styles/github-dark.css'

interface Props {
  message: Message
  isStreaming?: boolean
  isLastMessage?: boolean
}

const { message, isStreaming = false, isLastMessage = false } = defineProps<Props>()
const chatStore = useChatStore()
const enableMarkdown = env.enableMarkdown
const { regenerateResponse } = chatStore

const thought = computed(() => {
  const end = message.content.indexOf('</think>')
  if (end !== -1) {
    return [
      message.content.substring('<think>'.length, end),
      message.content.substring(end + '</think>'.length),
    ]
  } else {
    return [null, message.content]
  }
})

const copied = ref(false)

function copyToClipboard() {
  if (thought.value[1]) {
    navigator.clipboard.writeText(thought.value[1]).then(() => {
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 1500)
    })
  }
}

function handleRegenerate() {
  if (message.id) {
    regenerateResponse(message.id)
  }
}
</script>

<template>
  <div class="group flex items-start gap-3 sm:gap-4 py-2">
    <!-- AI 头像 -->
    <AIAvatar :size="32" variant="default" class="flex-shrink-0 sm:w-9 sm:h-9 mt-0.5" />

    <!-- 消息卡片 -->
    <div class="relative flex-1 min-w-0">
      <div class="transition-all duration-300 ease-out">
        <!-- 加载动画 - 更精致的脉冲效果 -->
        <div v-if="message.isStreaming || isStreaming" class="flex min-h-10 min-w-20 items-center py-3">
          <div class="flex items-center justify-center space-x-2">
            <div class="h-2.5 w-2.5 animate-bounce rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
            <div class="h-2.5 w-2.5 animate-bounce rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-[0_0_8px_rgba(20,184,166,0.5)]" style="animation-delay: 0.15s" />
            <div class="h-2.5 w-2.5 animate-bounce rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-[0_0_8px_rgba(20,184,166,0.5)]" style="animation-delay: 0.3s" />
          </div>
          <span class="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">AI 思考中...</span>
        </div>

        <!-- 消息内容 -->
        <code
          v-if="!enableMarkdown && message.content"
          class="whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200"
        >{{ message.content }}</code>
        <div
          v-else-if="message.content"
          class="prose prose-sm dark:prose-invert prose-p:my-0 prose-headings:my-2 prose-a:text-teal-600 dark:prose-a:text-teal-400 prose-code:text-xs prose-pre:text-sm prose-ul:my-0 prose-ol:my-0 [&_*:first-child]:mt-0 [&_*:last-child]:mb-0"
        >
          <!-- 思考过程 - 更精致的折叠卡片 -->
          <details
            v-if="thought[0]"
            class="mb-4 whitespace-pre-wrap rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-amber-50/60 to-yellow-50/40 p-4 text-xs text-amber-900
                   shadow-[0_2px_8px_-2px_rgba(245,158,11,0.15),0_4px_16px_-4px_rgba(245,158,11,0.1)]
                   dark:border-amber-700/40 dark:from-amber-900/30 dark:via-amber-900/20 dark:to-yellow-900/10 dark:text-amber-100
                   dark:shadow-[0_2px_8px_-2px_rgba(245,158,11,0.1),0_4px_16px_-4px_rgba(0,0,0,0.2)]
                   transition-all duration-300"
          >
            <summary class="mb-2 cursor-pointer font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 transition-colors">
              💭 思考过程
            </summary>
            {{ thought[0] }}
          </details>

          <!-- AI 响应 -->
          <div :class="{ 'animate-pulse': message.isStreaming || isStreaming }">
            <Markdown :source="thought[1] || ''" />
          </div>
        </div>
      </div>

      <!-- 操作按钮栏 - 更精致的悬浮效果 -->
      <div
        v-if="!message.isStreaming && !isStreaming && message.content"
        class="mt-3 flex items-center gap-1.5 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100"
      >
        <button
          v-if="isLastMessage"
          type="button"
          title="重新生成"
          class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-500
                 bg-white/60 backdrop-blur-sm border border-gray-200/50
                 shadow-[0_1px_3px_rgba(0,0,0,0.05)]
                 hover:bg-teal-50 hover:border-teal-200/60 hover:text-teal-600 hover:shadow-[0_2px_8px_-2px_rgba(20,184,166,0.2)]
                 dark:bg-gray-800/60 dark:border-gray-700/50 dark:text-gray-400
                 dark:hover:bg-teal-900/30 dark:hover:border-teal-700/50 dark:hover:text-teal-400
                 transition-all duration-200"
          @click="handleRegenerate"
        >
          <ArrowPathIcon class="h-3.5 w-3.5" />
          <span>重新生成</span>
        </button>
        <button
          type="button"
          title="复制"
          class="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-500
                 bg-white/60 backdrop-blur-sm border border-gray-200/50
                 shadow-[0_1px_3px_rgba(0,0,0,0.05)]
                 hover:bg-teal-50 hover:border-teal-200/60 hover:text-teal-600 hover:shadow-[0_2px_8px_-2px_rgba(20,184,166,0.2)]
                 dark:bg-gray-800/60 dark:border-gray-700/50 dark:text-gray-400
                 dark:hover:bg-teal-900/30 dark:hover:border-teal-700/50 dark:hover:text-teal-400
                 transition-all duration-200"
          @click="copyToClipboard"
        >
          <CheckIcon v-if="copied" class="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
          <ClipboardDocumentIcon v-else class="h-3.5 w-3.5" />
          <span>{{ copied ? '已复制' : '复制' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
