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
  <div class="group flex flex-row-reverse items-start px-2 py-0.5 sm:px-3 sm:py-1 mb-1.5">
    <img
      v-if="avatarUrl"
      :src="avatarUrl"
      class="w-7 h-7 rounded-full shadow-sm ring-1 ring-offset-1 ring-indigo-200 dark:ring-indigo-700 object-cover ml-2 sm:ml-2.5 mt-0.5"
      alt="avatar"
    >
    <div
      v-else
      class="w-7 h-7 rounded-full shadow-sm flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-semibold ml-2 sm:ml-2.5 mt-0.5"
    >
      U
    </div>

    <div class="bg-blue-600 dark:bg-blue-700 text-white rounded-md shadow-sm p-1.5 max-w-3xl">
      <code
        v-if="!enableMarkdown"
        class="whitespace-pre-line text-sm"
      >{{ message.content }}</code>
      <div
        v-else
        class="prose prose-xs sm:prose-sm dark:prose-invert prose-headings:font-medium prose-headings:my-1 prose-p:text-white prose-p:my-0.5 prose-a:text-blue-200 hover:prose-a:underline prose-code:bg-blue-500 prose-code:text-white prose-code:px-1 prose-code:rounded prose-pre:bg-blue-800 prose-pre:text-white prose-pre:p-2"
      >
        <Markdown :source="message.content" />
      </div>
    </div>
  </div>
</template>
