<script setup lang="ts">
import type { Message } from '../../services/database.ts'
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import { ref } from 'vue'
import { avatarUrl, enableMarkdown, isDarkMode } from '../../services/appConfig.ts'
import Markdown from '../Markdown.ts'

interface Props {
  message: Message
}

const { message } = defineProps<Props>()
const copied = ref(false)

function copyToClipboard() {
  navigator.clipboard.writeText(message.content).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1500)
  })
}
</script>

<template>
  <div class="group flex flex-row-reverse items-start px-2 py-0.5 sm:px-3 sm:py-1 mb-1.5 relative">
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

    <div class="bg-blue-600 dark:bg-blue-700 text-white rounded-md shadow-sm p-1.5 max-w-3xl relative">
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
      <button
        title="复制"
        class="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-110 active:scale-95"
        @click="copyToClipboard"
      >
        <CheckIcon v-if="copied" class="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
        <ClipboardDocumentIcon v-else class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
