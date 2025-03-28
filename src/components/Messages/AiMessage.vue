<script setup lang="ts">
import { Message } from '../../services/database.ts'
import { enableMarkdown } from '../../services/appConfig.ts'
import Markdown from '../Markdown.ts'
import 'highlight.js/styles/github-dark.css'
import logo from '/logo.png'
import { computed } from 'vue'

type Props = {
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
  } else {
    return [null, message.content]
  }
})
</script>

<template>
  <div class="flex rounded-xl bg-gray-50 px-2 py-6 dark:bg-gray-800/80 sm:px-4 mb-4 border border-gray-100 dark:border-gray-700 shadow-sm">
    <img
      class="mr-2 flex size-10 aspect-square rounded-full border border-gray-200 bg-white object-contain sm:mr-4"
      :src="logo"
      alt="Ollama"
    />

    <div class="flex max-w-3xl items-start rounded-xl">
      <code v-if="!enableMarkdown" class="whitespace-pre-line text-gray-800 dark:text-gray-200">{{ message.content }}</code>
      <div
        v-else
        class="prose prose-base max-w-full dark:prose-invert prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h3:text-base prose-p:first:mt-0 prose-a:text-blue-600 prose-code:text-sm prose-pre:p-2 dark:prose-code:text-gray-100"
      >
        <details
          v-if="thought[0]"
          class="whitespace-pre-wrap rounded-md mb-4 border border-blue-200 bg-blue-50 p-4 text-sm leading-tight text-blue-900 dark:border-blue-700 dark:bg-blue-800 dark:text-blue-50"
        >
          <summary class="cursor-pointer font-medium">思考过程</summary>
          {{ thought[0] }}
        </details>
        <div :class="{'animate-pulse': isStreaming}">
          <Markdown :source="thought[1]" />
        </div>
      </div>
    </div>
  </div>
</template>
