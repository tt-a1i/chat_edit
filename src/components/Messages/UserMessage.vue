<script setup lang="ts">
import type { Message } from '../../services/database.ts'
import { avatarUrl, enableMarkdown, isDarkMode } from '../../services/appConfig.ts'
import Markdown from '../Markdown.ts'

interface Props {
  message: Message
}

const { message } = defineProps<Props>()
</script>

<template>
  <div class="flex flex-row px-2 py-4 sm:px-4 mb-4 bg-white dark:bg-gray-900/95 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-300">
    <img v-if="avatarUrl" class="mr-2 flex size-10 rounded-full sm:mr-4" :src="avatarUrl">
    <div
      v-else
      class="mr-2 flex size-10 aspect-square items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800 text-center text-2xl sm:mr-4"
    >
      🧑
    </div>

    <div class="flex max-w-3xl items-start">
      <code v-if="!enableMarkdown" class="whitespace-pre-line text-gray-900 dark:text-gray-100">
        {{ message.content }}
      </code>
      <div
        v-else
        class="prose prose-base max-w-full dark:prose-invert prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h3:text-base prose-p:text-gray-900 prose-p:first:mt-0 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-sm prose-code:text-gray-900 prose-pre:p-2 dark:prose-p:text-gray-50 dark:prose-code:bg-gray-800 dark:prose-code:text-gray-100"
      >
        <Markdown :source="message.content" />
      </div>
    </div>
  </div>
</template>
