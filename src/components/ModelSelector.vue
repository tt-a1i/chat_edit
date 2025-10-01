<script setup lang="ts">
import { useAppStore, useChatStore } from '@/stores'
import { IconRefresh } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useAI } from '../services/ai.ts'

const { disabled = false } = defineProps<Props>()

const appStore = useAppStore()
const chatStore = useChatStore()
const { currentModel } = storeToRefs(appStore)
const { currentChat } = storeToRefs(chatStore)

const { refreshModels, availableModels } = useAI()

const refreshingModel = ref(false)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function performRefreshModel() {
  refreshingModel.value = true
  await Promise.all([refreshModels(), sleep(1000)])

  refreshModels().then(() => {
    refreshingModel.value = false
  })
}

async function handleModelChange(event: Event) {
  const wip = event.target as HTMLSelectElement
  appStore.currentModel = wip.value

  // 如果有当前聊天，更新聊天的模型
  if (currentChat.value && currentChat.value.id) {
    await chatStore.updateChat(currentChat.value.id, { model: wip.value })
  }
}

interface Props {
  disabled?: boolean
}
</script>

<template>
  <div class="flex flex-row text-gray-900 dark:text-gray-100">
    <div class="inline-flex items-center gap-2">
      <select
        :disabled="disabled"
        :value="currentChat?.model ?? currentModel"
        class="w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 transition-colors duration-300"
        @change="handleModelChange"
      >
        <option :value="undefined" disabled selected>
          选择模型
        </option>
        <option v-for="model in availableModels" :key="model.name" :value="model.name" class="dark:bg-gray-800">
          {{ model.name }}
        </option>
      </select>

      <button
        :disabled="disabled"
        title="刷新可用模型"
        class="inline-flex items-center justify-center rounded-lg border-none bg-gray-100 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        @click="performRefreshModel"
      >
        <IconRefresh
          class="h-4 w-4 -scale-100 text-gray-700 dark:text-gray-200"
          :class="{ 'animate-spin': refreshingModel }"
        />
      </button>
    </div>
  </div>
</template>
