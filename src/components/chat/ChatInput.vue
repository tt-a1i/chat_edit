<script setup lang="ts">
import { useAI } from '@/services/ai.ts'
import { useAppStore, useChatStore } from '@/stores'
import { logger } from '@/utils/logger'
import { IconPhotoPlus, IconPlayerStopFilled, IconSend, IconWhirl, IconX } from '@tabler/icons-vue' // Corrected Icon Import Order
import { useTextareaAutosize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

const { textarea, input: userInput } = useTextareaAutosize({ input: '' })

const appStore = useAppStore()
const chatStore = useChatStore()
const { currentModel } = storeToRefs(appStore)

const { availableModels } = useAI()
const { addSystemMessage, addUserMessage, abort } = chatStore

const selectedImage = ref<string | null>(null) // To store the base64 image string. Defined before isInputValid
const isSystemMessage = ref(false)
const isInputValid = computed<boolean>(() => !!userInput.value.trim() || !!selectedImage.value) // Input is valid if text or image is present
const isAiResponding = ref(false)
const flag = ref(true)
const showModelWarning = ref(false)
const fileInput = ref<HTMLInputElement | null>(null) // Ref for file input

function checkModelSelected(): boolean {
  // 检查是否已选择模型
  if (!currentModel.value && availableModels.value.length > 0) {
    // 如果没有选择模型但有可用模型，默认选择第一个
    appStore.currentModel = availableModels.value[0].name
    return true
  }
  return !!currentModel.value
}

function onSubmit() {
  if (isAiResponding.value) {
    abort()
    isAiResponding.value = false
    return
  }

  // 检查是否选择了模型
  if (!checkModelSelected()) {
    showModelWarning.value = true
    setTimeout(() => {
      showModelWarning.value = false
    }, 3000) // 3秒后自动隐藏提示
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
      <!-- 添加模型警告提示 -->
      <div
        v-if="showModelWarning"
        class="absolute top-[-40px] left-0 right-0 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm dark:bg-red-900/90 dark:text-red-100 backdrop-blur-sm shadow-md"
      >
        请先选择一个模型才能发送消息
      </div>
      <textarea
        ref="textarea"
        v-model="userInput"
        class="chat-input-textarea block max-h-[500px] w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 pl-14 pr-20 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50 dark:placeholder-gray-400 dark:focus:ring-blue-500 sm:text-base shadow-sm hover:shadow-md transition-all duration-300"
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
      <button
        type="button"
        title="添加图片"
        class="absolute bottom-3 left-4 flex size-10 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-all duration-200 hover:scale-105 active:scale-95"
        @click="triggerFileInput"
      >
        <IconPhotoPlus :size="22" />
      </button>
      <button
        type="submit"
        :disabled="!isInputValid && !isAiResponding"
        class="group absolute bottom-3 right-4 flex size-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-medium text-white transition-all duration-200 ease-in-out hover:bg-blue-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:opacity-50 disabled:hover:scale-100 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500 dark:disabled:bg-gray-600 sm:text-base shadow-lg"
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
