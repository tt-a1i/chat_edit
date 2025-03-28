<script setup lang="ts">
import { IconPlayerStopFilled, IconSend, IconWhirl } from '@tabler/icons-vue'
import { useTextareaAutosize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { currentModel, showSystem } from '../services/appConfig.ts'
import { useChats } from '../services/chat.ts'
import { useAI } from '../services/useAI.ts'

const { textarea, input: userInput } = useTextareaAutosize({ input: '' })
const { addSystemMessage, addUserMessage, abort, hasActiveChat, hasMessages, regenerateResponse, switchModel } = useChats()
const { availableModels } = useAI()

const isSystemMessage = ref(false)
const isInputValid = computed<boolean>(() => !!userInput.value.trim())
const isAiResponding = ref(false)
const flag = ref(true)
const showModelWarning = ref(false)

function checkModelSelected(): boolean {
  // 检查是否已选择模型
  if (!currentModel.value && availableModels.value.length > 0) {
    // 如果没有选择模型但有可用模型，默认选择第一个
    switchModel(availableModels.value[0].name)
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
      addSystemMessage(userInput.value.trim())
    }
    else {
      addUserMessage(userInput.value.trim()).then(() => {
        isAiResponding.value = false
      })
    }
    userInput.value = ''
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
    // Pressing enter while the ai is responding should not abort the request
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
</script>

<template>
  <form @submit.prevent="onSubmit">
    <div class="flex px-2 flex-col sm:flex-row items-center">
      <div v-if="showSystem" class="text-gray-900 dark:text-gray-100 space-x-2 text-sm font-medium mb-2">
        <label>
          <input v-model="isSystemMessage" type="radio" :value="false">
          用户
        </label>
        <label>
          <input v-model="isSystemMessage" type="radio" :value="true">
          系统
        </label>
      </div>
      <div v-if="hasMessages" class="ml-auto">
        <button
          type="button"
          class="rounded-lg text-blue-700 text-sm font-medium transition duration-200 ease-in-out hover:text-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:text-gray-400 disabled:opacity-50 dark:text-blue-500 dark:hover:text-blue-400 dark:focus:ring-blue-800 dark:disabled:text-gray-600"
          @click="regenerateResponse"
        >
          重新生成回答
        </button>
      </div>
    </div>
    <div class="relative">
      <!-- 添加模型警告提示 -->
      <div
        v-if="showModelWarning"
        class="absolute top-[-40px] left-0 right-0 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm dark:bg-red-900 dark:text-red-100"
      >
        请先选择一个模型才能发送消息
      </div>
      <textarea
        ref="textarea"
        v-model="userInput"
        class="block max-h-[500px] w-full resize-none rounded-xl border-none bg-gray-50 p-4 pl-4 pr-20 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:text-gray-50 dark:placeholder-gray-300 dark:focus:ring-blue-600 sm:text-base shadow-sm"
        placeholder="输入内容"
        @keydown="onKeydown"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
      />
      <button
        type="submit"
        :disabled="isInputValid == false && isAiResponding == false"
        class="group absolute bottom-2 right-2.5 flex size-10 items-center justify-center rounded-lg bg-blue-700 text-sm font-medium text-white transition duration-200 ease-in-out hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 dark:disabled:bg-gray-600 sm:text-base"
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
