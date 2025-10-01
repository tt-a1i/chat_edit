<script setup lang="ts">
import { useAppStore, useChatStore } from '@/stores'
import { IconPhotoPlus, IconPlayerStopFilled, IconSend, IconWhirl, IconX } from '@tabler/icons-vue' // Corrected Icon Import Order
import { useTextareaAutosize } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useAI } from '../services/useAI.ts'

const { textarea, input: userInput } = useTextareaAutosize({ input: '' })

const appStore = useAppStore()
const chatStore = useChatStore()
const { currentModel } = storeToRefs(appStore)
const { currentMessages } = storeToRefs(chatStore)

const { availableModels } = useAI()
const { addSystemMessage, addUserMessage, abort, regenerateResponse } = chatStore
const hasMessages = computed(() => currentMessages.value.length > 0)

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
      console.warn('Selected file is not an image:', file.type)
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
    <div class="flex px-2 flex-col sm:flex-row items-center">
      <div v-if="hasMessages" class="ml-auto">
        <button
          type="button"
          class="rounded-lg text-blue-700 text-sm font-medium transition duration-200 ease-in-out hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:text-gray-400 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300 dark:focus:ring-blue-800 dark:disabled:text-gray-600"
          @click="regenerateResponse"
        >
          重新生成回答
        </button>
      </div>
    </div>
    <div class="relative">
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
        class="block max-h-[500px] w-full resize-none rounded-xl border-none bg-gray-50 p-4 pl-14 pr-20 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:text-gray-50 dark:placeholder-gray-300 dark:focus:ring-blue-500 sm:text-base shadow-sm transition-all duration-300"
        placeholder="输入内容"
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
        class="absolute bottom-2.5 left-2.5 flex size-10 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors duration-200"
        @click="triggerFileInput"
      >
        <IconPhotoPlus :size="24" />
      </button>
      <button
        type="submit"
        :disabled="!isInputValid && !isAiResponding"
        class="group absolute bottom-2 right-2.5 flex size-10 items-center justify-center rounded-lg bg-blue-700 text-sm font-medium text-white transition duration-200 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-500/70 dark:disabled:bg-gray-600 sm:text-base"
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
