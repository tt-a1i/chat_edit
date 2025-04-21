<script setup lang="ts">
import type { Message } from '../../services/database.ts'
import { computed } from 'vue'
import { enableMarkdown } from '../../services/appConfig.ts'
import Markdown from '../Markdown.ts'
import 'highlight.js/styles/github-dark.css'
import logo from '/logo.png'

interface Props {
  message: Message
  isStreaming?: boolean
}

const { message, isStreaming = false } = defineProps<Props>()
const thought = computed(() => {
  const end = message.content.indexOf('</think>')
  if (end != -1) {
    return [
      message.content.substring('<think>'.length, end),
      message.content.substring(end + '</think>'.length),
    ]
  }
  else {
    return [null, message.content]
  }
})
</script>

<template>
  <div class="group flex items-start px-2 py-1 sm:px-3 sm:py-1.5 mb-2">
    <img
      :src="logo"
      alt="AI"
      class="w-8 h-8 mr-2 sm:mr-3 rounded-full shadow-sm ring-1 ring-offset-1 ring-gray-200 dark:ring-gray-600 object-contain"
    >

    <div class="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg shadow-sm p-2 max-w-3xl">
      <code v-if="!enableMarkdown" class="whitespace-pre-line">{{ message.content }}</code>
      <div
        v-else
        class="prose prose-xs sm:prose-sm dark:prose-invert prose-headings:font-medium prose-headings:my-1.5 prose-p:text-gray-700 dark:prose-p:text-gray-200 prose-p:my-1 prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline prose-code:bg-gray-200 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:p-2"
      >
        <details
          v-if="thought[0]"
          class="whitespace-pre-wrap mb-1.5 rounded border border-blue-200 bg-blue-50 p-1.5 text-xs text-blue-800 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-100"
        >
          <summary class="cursor-pointer font-medium mb-1">
            思考过程
          </summary>
          {{ thought[0] }}
        </details>
        <div :class="{ 'animate-pulse': isStreaming }">
          <Markdown :source="thought[1]" />
        </div>
      </div>
    </div>
  </div>
</template>
