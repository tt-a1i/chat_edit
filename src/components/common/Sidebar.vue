<script setup lang="ts">
import {
  IconEdit,
  IconMessageCode,
  IconMoon,
  IconPlus,
  IconSettings2,
  IconSun,
  IconTrashX,
  IconUserCircle,
} from '@tabler/icons-vue'
import { createDiscreteApi, darkTheme } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { SCENES, useAppStore, useChatStore } from '@/stores'
import { formatSmartTime, simplifyModelName } from '@/utils/format'
import { logger } from '@/utils/logger'

const appStore = useAppStore()
const chatStore = useChatStore()
const { currentScene, isDarkMode, isSystemPromptOpen, isSidebarCollapsed } = storeToRefs(appStore)
const { sortedChats, currentChat } = storeToRefs(chatStore)
const { switchScene, toggleSettingsPanel, toggleSystemPromptPanel, toggleDarkMode, toggleSidebar } = appStore
const { switchChat, deleteChat, startNewChat, wipeDatabase } = chatStore

// 缓存响应式的 discrete API，根据暗色模式自动更新主题
const discreteApi = computed(() =>
  createDiscreteApi(
    ['dialog', 'message'],
    {
      configProviderProps: {
        theme: isDarkMode.value ? darkTheme : undefined,
      },
    },
  ),
)

const sidebarBodyRef = ref<HTMLElement | null>(null)
const showSidebarText = ref(!isSidebarCollapsed.value)
const SIDEBAR_READY_WIDTH = 200
let widthCheckRaf: number | undefined
let isInitialSidebarWatch = true

watch(
  isSidebarCollapsed,
  (collapsed) => {
    if (widthCheckRaf) {
      cancelAnimationFrame(widthCheckRaf)
      widthCheckRaf = undefined
    }

    if (isInitialSidebarWatch) {
      showSidebarText.value = !collapsed
      isInitialSidebarWatch = false
      if (!collapsed) return
    }

    if (collapsed) {
      showSidebarText.value = false
      return
    }

    showSidebarText.value = false

    const checkWidth = () => {
      const width = sidebarBodyRef.value?.offsetWidth ?? 0
      if (width >= SIDEBAR_READY_WIDTH) {
        showSidebarText.value = true
        widthCheckRaf = undefined
        return
      }
      widthCheckRaf = requestAnimationFrame(checkWidth)
    }

    widthCheckRaf = requestAnimationFrame(checkWidth)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (widthCheckRaf) {
    cancelAnimationFrame(widthCheckRaf)
  }
})

function onNewChat() {
  checkSystemPromptPanel()
  switchScene(SCENES.CHAT)
  return startNewChat('New chat')
}

function onSwitchChat(chatId: number) {
  checkSystemPromptPanel()
  switchScene(SCENES.CHAT)
  return switchChat(chatId)
}

function checkSystemPromptPanel() {
  appStore.isSystemPromptOpen = false
}

// 确认删除当前会话
async function confirmDeleteChat() {
  const chat = currentChat.value
  const { dialog, message } = discreteApi.value

  if (!chat?.id) {
    message.warning('未找到要删除的会话')
    return
  }

  const chatId: number = chat.id // 提取 ID 避免闭包中的类型问题

  dialog.warning({
    title: '删除会话',
    content: `确定要删除会话"${chat.name}"吗？此操作无法撤销。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await deleteChat(chatId)
        message.success('会话已删除')
      } catch (error) {
        logger.error('删除会话失败', error)
        const errorMessage = error instanceof Error
          ? error.message
          : '删除会话失败，请重试'
        message.error(errorMessage)
      }
    },
  })
}

// 确认删除所有会话
async function confirmWipeDatabase() {
  const { dialog, message } = discreteApi.value

  dialog.error({
    title: '删除所有会话',
    content: '确定要删除所有会话吗？此操作将清空所有聊天记录，且无法撤销！',
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await wipeDatabase()
        message.success('所有会话已删除')
      } catch (error) {
        logger.error('删除所有会话失败', error)
        const errorMessage = error instanceof Error
          ? error.message
          : '删除失败，请重试'
        message.error(errorMessage)
      }
    },
  })
}

// 以下划线开头命名未使用的函数，避免警告
function _toggleAIEditing() {
  switchScene(currentScene.value === SCENES.AI_EDITING ? SCENES.CHAT : SCENES.AI_EDITING)
  if (currentScene.value === SCENES.AI_EDITING) {
    isSystemPromptOpen.value = false
  }
}

// 格式化聊天元数据（时间 + 模型）
function formatChatMeta(chat: typeof sortedChats.value[number]): string {
  const time = formatSmartTime(chat.createdAt)
  const model = simplifyModelName(chat.model)
  return `${time} • ${model}`
}
</script>

<template>
  <aside
    class="relative flex transition-all duration-300 ease-in-out"
    :class="isSidebarCollapsed ? 'w-16' : 'w-60 sm:w-64'"
  >
    <!-- 折叠/展开按钮 - 垂直居中 -->
    <button
      class="absolute -right-3 top-1/2 -translate-y-1/2 z-50 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95 dark:border-gray-800"
      :title="isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
      @click="toggleSidebar"
    >
      <svg
        class="h-4 w-4 text-white transition-transform duration-300"
        :class="isSidebarCollapsed ? 'rotate-180' : ''"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    <div
      ref="sidebarBodyRef"
      class="flex h-screen flex-col overflow-y-auto border-r border-gray-200 bg-white pt-2 dark:border-gray-800 dark:bg-gray-900"
      :class="isSidebarCollapsed ? 'w-16' : 'w-full'"
    >
      <div class="mx-2 mb-2">
        <button
          class="flex w-full items-center justify-center rounded-md bg-blue-600 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-offset-gray-900 overflow-hidden"
          :class="isSidebarCollapsed ? 'px-2 gap-x-0' : 'px-4 gap-x-2'"
          :title="isSidebarCollapsed ? 'New Chat' : ''"
          :aria-label="isSidebarCollapsed ? '新建聊天' : undefined"
          @click="onNewChat"
        >
          <IconPlus class="h-5 w-5 flex-shrink-0" :class="isSidebarCollapsed ? 'mx-auto' : ''" />
          <span
            v-if="showSidebarText"
            class="whitespace-nowrap transition-opacity duration-200"
          >New Chat</span>
        </button>
      </div>

      <!-- Menu options -->
      <div class="flex flex-col gap-2 p-2 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          class="flex items-center rounded-lg py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 overflow-hidden"
          :class="[
            { 'bg-gray-100 dark:bg-gray-800': currentScene === SCENES.CHAT },
            isSidebarCollapsed ? 'justify-center px-2 gap-0' : 'px-4 gap-2',
          ]"
          :title="isSidebarCollapsed ? 'Chat' : ''"
          :aria-label="isSidebarCollapsed ? '聊天' : undefined"
          @click="switchScene(SCENES.CHAT)"
        >
          <IconMessageCode class="size-5 flex-shrink-0" />
          <span
            v-if="showSidebarText"
            class="whitespace-nowrap transition-opacity duration-200"
          >Chat</span>
        </button>

        <button
          type="button"
          class="flex items-center rounded-lg py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 overflow-hidden"
          :class="[
            { 'bg-gray-100 dark:bg-gray-800': currentScene === SCENES.AI_EDITING },
            isSidebarCollapsed ? 'justify-center px-2 gap-0' : 'px-4 gap-2',
          ]"
          :title="isSidebarCollapsed ? 'AI Editing' : ''"
          :aria-label="isSidebarCollapsed ? 'AI 编辑器' : undefined"
          @click="switchScene(SCENES.AI_EDITING)"
        >
          <IconEdit class="size-5 flex-shrink-0" />
          <span
            v-if="showSidebarText"
            class="whitespace-nowrap transition-opacity duration-200"
          >AI Editing</span>
        </button>
      </div>

      <!-- Chat history -->
      <div
        v-if="!isSidebarCollapsed"
        class="h-full space-y-4 overflow-y-auto border-b border-gray-200 px-2 py-4 dark:border-gray-800"
      >
        <button
          v-for="(chat, index) in sortedChats"
          :key="index"
          :class="{
            'bg-gray-100 dark:bg-gray-800': currentChat?.id === chat.id,
          }"
          class="flex w-full flex-col gap-y-1 rounded-md px-3 py-2.5 text-left transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
          @click="onSwitchChat(chat.id!)"
        >
          <span class="text-sm font-medium leading-tight text-gray-900 dark:text-gray-100 truncate">
            {{ chat.name }}
          </span>
          <span class="text-xs leading-tight text-gray-500 dark:text-gray-400 truncate">
            {{ formatChatMeta(chat) }}
          </span>
        </button>
      </div>
      <div class="mt-auto w-full space-y-2 px-2 py-4">
        <button
          class="group flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500 overflow-hidden"
          :class="isSidebarCollapsed ? 'justify-center px-2 gap-x-0' : 'gap-x-2'"
          :title="isSidebarCollapsed ? (isDarkMode ? 'Light Mode' : 'Dark Mode') : ''"
          :aria-label="isSidebarCollapsed ? (isDarkMode ? '切换到亮色模式' : '切换到暗色模式') : undefined"
          @click="toggleDarkMode"
        >
          <IconSun v-if="isDarkMode" class="size-4 opacity-50 group-hover:opacity-80 flex-shrink-0" />
          <IconMoon v-else class="size-4 opacity-50 group-hover:opacity-80 flex-shrink-0" />

          <span
            v-if="showSidebarText"
            class="whitespace-nowrap transition-opacity duration-200"
          >Toggle dark mode</span>
        </button>
        <button
          v-if="false"
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
        >
          <IconUserCircle class="size-4 opacity-50 group-hover:opacity-80" />
          User
        </button>
        <button
          class="group flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500 overflow-hidden"
          :class="isSidebarCollapsed ? 'justify-center px-2 gap-x-0' : 'gap-x-2'"
          :title="isSidebarCollapsed ? 'System prompt' : ''"
          :aria-label="isSidebarCollapsed ? '系统提示词' : undefined"
          @click="toggleSystemPromptPanel"
        >
          <IconMessageCode class="size-4 opacity-50 group-hover:opacity-80 flex-shrink-0" />

          <span
            v-if="showSidebarText"
            class="whitespace-nowrap transition-opacity duration-200"
          >System prompt</span>
        </button>
        <button
          class="group flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500 overflow-hidden"
          :class="isSidebarCollapsed ? 'justify-center px-2 gap-x-0' : 'gap-x-2'"
          :title="isSidebarCollapsed ? 'Settings' : ''"
          :aria-label="isSidebarCollapsed ? '设置' : undefined"
          @click="toggleSettingsPanel"
        >
          <IconSettings2 class="size-4 opacity-50 group-hover:opacity-80 flex-shrink-0" />

          <span
            v-if="showSidebarText"
            class="whitespace-nowrap transition-opacity duration-200"
          >Settings</span>
        </button>
        <!-- 删除当前聊天按钮 -->
        <button
          v-if="currentChat && showSidebarText"
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
          @click="confirmDeleteChat"
        >
          <IconTrashX class="size-4 opacity-50 group-hover:opacity-80" />
          删除当前会话
        </button>
        <!-- 删除所有会话按钮 -->
        <button
          v-if="showSidebarText"
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors duration-100 ease-in-out hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus:ring-red-500"
          @click="confirmWipeDatabase"
        >
          <IconTrashX class="size-4" />
          删除所有会话
        </button>
      </div>
    </div>
  </aside>
</template>
