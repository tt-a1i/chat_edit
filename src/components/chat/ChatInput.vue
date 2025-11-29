<script setup lang="ts">
/**
 * 聊天输入组件 - 简化版
 * 模型配置已移至环境变量 (env.ts)
 */
import { IconPhotoPlus, IconPlayerStopFilled, IconSend, IconWhirl, IconX } from '@tabler/icons-vue'
import { useTextareaAutosize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useChatStore } from '@/stores'
import { logger } from '@/utils/logger'

const { textarea, input: userInput } = useTextareaAutosize({ input: '' })

const chatStore = useChatStore()
const { addSystemMessage, addUserMessage, abort } = chatStore

const selectedImage = ref<string | null>(null)
const isSystemMessage = ref(false)
const isInputValid = computed<boolean>(() => !!userInput.value.trim() || !!selectedImage.value)
const isAiResponding = ref(false)
const flag = ref(true)
const fileInput = ref<HTMLInputElement | null>(null)

function onSubmit() {
  if (isAiResponding.value) {
    abort()
    isAiResponding.value = false
    return
  }

  if (isInputValid.value) {
    if (isSystemMessage.value) {
      // System messages typically don't have images, but you could adapt if needed
      addSystemMessage(userInput.value.trim())
    } else {
      addUserMessage(userInput.value.trim(), selectedImage.value).then(() => { // Pass selectedImage
        isAiResponding.value = false
      })
    }
    userInput.value = ''
    selectedImage.value = null // Clear image after sending
    if (fileInput.value) {
      fileInput.value.value = '' // Reset file input
    }
    if (!isSystemMessage.value) {
      isAiResponding.value = true
    }
  }
}

function shouldSubmit({ key, shiftKey }: KeyboardEvent): boolean {
  return key === 'Enter' && !shiftKey
}

function onKeydown(event: KeyboardEvent) {
  if (shouldSubmit(event) && flag.value) {
    if (isAiResponding.value) {
      return
    }
    event.preventDefault()
    onSubmit()
  }
}

function handleCompositionStart() {
  flag.value = false
}

function handleCompositionEnd() {
  flag.value = true
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    // Basic validation for image type (optional, but good practice)
    if (!file.type.startsWith('image/')) {
      // Handle non-image file selection (e.g., show an error message)
      logger.warn('Selected file is not an image:', file.type)
      if (fileInput.value) {
        fileInput.value.value = '' // Reset file input
      }
      selectedImage.value = null
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function clearImage() {
  selectedImage.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <div class="relative px-2">
      <!-- Image Preview -->
      <div v-if="selectedImage" class="mb-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg relative max-w-xs">
        <img :src="selectedImage" alt="Selected image preview" class="max-w-full max-h-40 rounded object-contain">
        <button
          type="button"
          title="移除图片"
          class="absolute top-1 right-1 p-0.5 bg-gray-700/50 hover:bg-gray-700/80 text-white rounded-full"
          @click="clearImage"
        >
          <IconX :size="16" />
        </button>
      </div>
      <!-- 输入框容器 -->
      <div class="relative flex items-center">
        <textarea
          ref="textarea"
          v-model="userInput"
          class="chat-input-textarea block max-h-[500px] w-full resize-none rounded-[20px] p-4 pl-14 pr-20 text-sm sm:text-base text-gray-900 placeholder-gray-400
                 bg-white/95 backdrop-blur-md
                 border border-gray-200/60
                 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.08),0_4px_20px_-4px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)]
                 hover:border-gray-300/70 hover:shadow-[0_4px_16px_-3px_rgba(0,0,0,0.1),0_6px_24px_-4px_rgba(0,0,0,0.06)]
                 focus:outline-none focus:border-teal-400/70 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15),0_4px_16px_-3px_rgba(20,184,166,0.1),0_6px_24px_-4px_rgba(0,0,0,0.06)]
                 dark:bg-gray-800/95 dark:border-gray-700/60 dark:text-gray-50 dark:placeholder-gray-500
                 dark:shadow-[0_2px_12px_-3px_rgba(0,0,0,0.3),0_4px_20px_-4px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.05)]
                 dark:hover:border-gray-600/70 dark:focus:border-teal-500/70 dark:focus:shadow-[0_0_0_3px_rgba(20,184,166,0.2),0_4px_16px_-3px_rgba(20,184,166,0.15)]
                 transition-all duration-300 ease-out"
          placeholder="输入消息... (Shift + Enter 换行)"
          @keydown="onKeydown"
          @compositionstart="handleCompositionStart"
          @compositionend="handleCompositionEnd"
        />
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
        >
        <!-- 图片按钮 - 垂直居中 + Tooltip -->
        <div class="group/tooltip absolute left-4 top-1/2 -translate-y-1/2">
          <button
            type="button"
            class="flex size-10 items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-100 hover:text-teal-600 dark:hover:bg-gray-700 dark:hover:text-teal-400 focus:outline-none transition-all duration-200 hover:scale-105 active:scale-95"
            @click="triggerFileInput"
          >
            <IconPhotoPlus :size="22" />
          </button>
          <!-- 自定义 Tooltip -->
          <div class="tooltip-content absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-800 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 pointer-events-none">
            添加图片（仅支持图文模型）
            <!-- 箭头 -->
            <div class="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-800 dark:border-t-gray-700" />
          </div>
        </div>
        <!-- 发送按钮 - 垂直居中 -->
        <button
          type="submit"
          :disabled="!isInputValid && !isAiResponding"
          class="group absolute right-4 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-[14px]
                 bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600
                 text-white
                 shadow-[0_2px_8px_-1px_rgba(20,184,166,0.5),0_4px_16px_-2px_rgba(16,185,129,0.3)]
                 hover:shadow-[0_4px_12px_-1px_rgba(20,184,166,0.6),0_6px_20px_-2px_rgba(16,185,129,0.4)]
                 hover:scale-105 hover:-translate-y-[calc(50%+2px)]
                 active:scale-95 active:-translate-y-1/2
                 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2
                 disabled:from-gray-300 disabled:via-gray-350 disabled:to-gray-400 disabled:opacity-60 disabled:shadow-none disabled:hover:scale-100 disabled:hover:-translate-y-1/2
                 dark:from-teal-500 dark:via-teal-600 dark:to-emerald-700
                 dark:shadow-[0_2px_8px_-1px_rgba(20,184,166,0.4),0_4px_16px_-2px_rgba(0,0,0,0.3)]
                 dark:hover:shadow-[0_4px_12px_-1px_rgba(20,184,166,0.5),0_6px_20px_-2px_rgba(0,0,0,0.4)]
                 dark:disabled:from-gray-600 dark:disabled:via-gray-650 dark:disabled:to-gray-700
                 transition-all duration-300 ease-out"
        >
          <IconPlayerStopFilled
            v-if="isAiResponding"
            class="absolute opacity-0 transition duration-200 ease-in-out group-hover:opacity-100"
            :size="20"
          />
          <IconWhirl
            v-if="isAiResponding"
            class="absolute animate-spin opacity-50 transition duration-200 ease-in-out group-hover:opacity-0"
            :size="20"
          />
          <IconSend v-else :size="20" />
        </button>
      </div>
    </div>
  </form>
</template>

<style scoped>
/* 隐藏输入框滚动条 */
.chat-input-textarea {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.chat-input-textarea::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}
</style>
