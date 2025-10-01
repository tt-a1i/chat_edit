<script setup lang="ts">
import type { Message } from '../../services/database.ts'
import { useAppStore } from '@/stores'
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import Markdown from '../Markdown.ts'

interface Props {
  message: Message
}

const { message } = defineProps<Props>()
const appStore = useAppStore()
const { avatarUrl, enableMarkdown } = storeToRefs(appStore)
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
  <div class="group flex flex-row-reverse items-start gap-3 sm:gap-4 py-1">
    <!-- 头像 -->
    <img
      v-if="avatarUrl"
      :src="avatarUrl"
      class="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-gray-700 mt-1"
      alt="avatar"
    >
    <div
      v-else
      class="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white shadow-sm mt-1"
    >
      U
    </div>

    <!-- 消息气泡 -->
    <div class="relative flex-1 flex justify-end min-w-0">
      <div class="relative max-w-[85%]">
        <div
          class="rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-sm transition-all duration-200 hover:shadow-md"
          style="background-color: var(--message-user-bg); border: 1px solid var(--message-user-border);"
        >
          <code
            v-if="!enableMarkdown"
            class="whitespace-pre-line text-sm leading-relaxed text-gray-900 dark:text-gray-100"
          >{{ message.content }}</code>
          <div
            v-else
            class="prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-a:text-blue-600 dark:prose-a:text-blue-400"
          >
            <Markdown :source="message.content" />
          </div>

          <!-- 图片 -->
          <div v-if="message.imageUrl" class="mt-3">
            <img
              :src="message.imageUrl"
              alt="用户上传的图片"
              class="max-h-64 rounded-lg object-contain shadow-sm"
            >
          </div>
        </div>

        <!-- 复制按钮 -->
        <button
          title="复制"
          class="absolute -bottom-2 -right-2 rounded-full bg-white p-1.5 text-gray-500 opacity-0 shadow-sm transition-all duration-200 hover:scale-110 hover:bg-gray-50 active:scale-95 group-hover:opacity-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
          @click="copyToClipboard"
        >
          <CheckIcon v-if="copied" class="h-4 w-4 text-green-600 dark:text-green-400" />
          <ClipboardDocumentIcon v-else class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
