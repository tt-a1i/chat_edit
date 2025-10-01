<script setup lang="ts">
import type { Message } from '../../services/database.ts'
import { useAppStore } from '@/stores'
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import AIAvatar from '../common/AIAvatar.vue'
import Markdown from '../Markdown.ts'
import 'highlight.js/styles/github-dark.css'

interface Props {
  message: Message
  isStreaming?: boolean
}

const { message, isStreaming = false } = defineProps<Props>()
const appStore = useAppStore()
const { enableMarkdown } = storeToRefs(appStore)
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
</script>

<template>
  <div class="group flex items-start gap-3 sm:gap-4 py-1">
    <!-- AI 头像 -->
    <AIAvatar :size="32" variant="default" class="flex-shrink-0 sm:w-9 sm:h-9" />

    <!-- 消息卡片 -->
    <div class="relative flex-1 min-w-0">
      <div
        class="rounded-2xl px-4 sm:px-5 pb-3 sm:pb-4 transition-all duration-200"
      >
        <!-- 加载动画 -->
        <div v-if="message.isStreaming || isStreaming" class="flex min-h-10 min-w-20 items-center">
          <div class="flex items-center justify-center space-x-2">
            <div class="h-2 w-2 animate-bounce rounded-full bg-blue-600 dark:bg-blue-400" />
            <div class="h-2 w-2 animate-bounce rounded-full bg-blue-600 dark:bg-blue-400" style="animation-delay: 0.2s" />
            <div class="h-2 w-2 animate-bounce rounded-full bg-blue-600 dark:bg-blue-400" style="animation-delay: 0.4s" />
          </div>
          <span class="ml-3 text-sm text-gray-500 dark:text-gray-400">AI 思考中...</span>
        </div>

        <!-- 消息内容 -->
        <code
          v-if="!enableMarkdown && message.content"
          class="whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200"
        >{{ message.content }}</code>
        <div
          v-else-if="message.content"
          class="prose prose-sm dark:prose-invert prose-p:my-1.5 prose-headings:my-2 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-xs prose-pre:text-sm"
        >
          <!-- 思考过程 -->
          <details
            v-if="thought[0]"
            class="mb-3 whitespace-pre-wrap rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-100"
          >
            <summary class="mb-1.5 cursor-pointer font-medium">
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

      <!-- 复制按钮 -->
      <button
        v-if="!message.isStreaming && !isStreaming && message.content"
        title="复制"
        class="absolute -bottom-2 -left-2 rounded-full bg-white p-1.5 text-gray-500 opacity-0 shadow-sm transition-all duration-200 hover:scale-110 hover:bg-gray-50 active:scale-95 group-hover:opacity-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
        @click="copyToClipboard"
      >
        <CheckIcon v-if="copied" class="h-4 w-4 text-green-600 dark:text-green-400" />
        <ClipboardDocumentIcon v-else class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
