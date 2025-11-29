<script setup lang="ts">
import type { Message } from '@/services/database.ts'
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useAppStore } from '@/stores'
import Markdown from '@/utils/markdown.ts'

interface Props {
  message: Message
}

const { message } = defineProps<Props>()
const appStore = useAppStore()
const { enableMarkdown } = storeToRefs(appStore)
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
  <div class="group flex flex-row-reverse items-start gap-3 sm:gap-4 py-2">
    <!-- 头像 -->
    <div
      class="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-full
             bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600
             text-sm font-semibold text-white
             shadow-[0_2px_8px_-1px_rgba(20,184,166,0.4),0_4px_16px_-2px_rgba(16,185,129,0.2)]
             ring-2 ring-white/80 dark:ring-gray-800/80
             mt-0.5 transition-transform duration-200 hover:scale-105"
    >
      U
    </div>

    <!-- 消息气泡 -->
    <div class="relative flex-1 flex justify-end min-w-0">
      <div class="relative max-w-[85%] group/bubble">
        <div
          class="relative rounded-[20px] px-4 sm:px-5 py-3 sm:py-4 transition-all duration-300 ease-out
                 bg-gradient-to-br from-teal-50 via-teal-50/80 to-emerald-50/60
                 border border-teal-200/50
                 shadow-[0_2px_12px_-2px_rgba(20,184,166,0.15),0_4px_24px_-4px_rgba(20,184,166,0.08)]
                 hover:shadow-[0_4px_20px_-2px_rgba(20,184,166,0.2),0_8px_32px_-4px_rgba(20,184,166,0.12)]
                 hover:border-teal-300/60 hover:-translate-y-0.5
                 dark:from-teal-800/30 dark:via-teal-800/25 dark:to-teal-900/20
                 dark:border-teal-600/40 dark:hover:border-teal-500/50
                 dark:shadow-[0_2px_12px_-2px_rgba(20,184,166,0.1),0_4px_24px_-4px_rgba(0,0,0,0.3)]
                 dark:hover:shadow-[0_4px_20px_-2px_rgba(20,184,166,0.15),0_8px_32px_-4px_rgba(0,0,0,0.4)]"
        >
          <code
            v-if="!enableMarkdown"
            class="whitespace-pre-line text-sm leading-relaxed text-gray-900 dark:text-gray-100"
          >{{ message.content }}</code>
          <div
            v-else
            class="prose prose-sm dark:prose-invert prose-p:my-0 prose-headings:my-2 prose-a:text-teal-600 dark:prose-a:text-teal-400 prose-ul:my-0 prose-ol:my-0 prose-pre:my-0 [&_*:first-child]:mt-0 [&_*:last-child]:mb-0"
          >
            <Markdown :source="message.content" />
          </div>

          <!-- 图片 -->
          <div v-if="message.imageUrl" class="mt-3">
            <img
              :src="message.imageUrl"
              alt="用户上传的图片"
              class="max-h-64 rounded-xl object-contain shadow-sm"
            >
          </div>
        </div>

        <!-- 复制按钮 -->
        <button
          title="复制"
          class="absolute -bottom-2 -right-2 rounded-full bg-white p-1.5 text-gray-400 opacity-0 shadow-md transition-all duration-200 hover:scale-110 hover:bg-gray-50 hover:text-teal-600 active:scale-95 group-hover:opacity-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-teal-400"
          @click="copyToClipboard"
        >
          <CheckIcon v-if="copied" class="h-4 w-4 text-green-500 dark:text-green-400" />
          <ClipboardDocumentIcon v-else class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>
