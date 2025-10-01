<script setup lang="ts">
import { SCENES, useAppStore, useChatStore } from '@/stores'
import { formatSmartTime, simplifyModelName } from '@/utils/format'
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
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const chatStore = useChatStore()
const { currentScene, isDarkMode, isSystemPromptOpen, isSidebarCollapsed } = storeToRefs(appStore)
const { sortedChats, currentChat } = storeToRefs(chatStore)
const { switchScene, toggleSettingsPanel, toggleSystemPromptPanel, toggleDarkMode, toggleSidebar } = appStore
const { switchChat, deleteChat, startNewChat, wipeDatabase } = chatStore

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
    class="flex transition-all duration-300 ease-in-out"
    :class="isSidebarCollapsed ? 'w-16' : 'w-60 sm:w-64'"
  >
    <div
      class="flex h-screen flex-col overflow-y-auto border-r border-gray-200 bg-white pt-2 dark:border-gray-800 dark:bg-gray-900 relative"
      :class="isSidebarCollapsed ? 'w-16' : 'w-full'"
    >
      <!-- 折叠按钮 -->
      <button
        class="absolute top-2 -right-3 z-10 h-6 w-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-md transition-colors"
        :title="isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        @click="toggleSidebar"
      >
        <svg class="w-4 h-4 transition-transform duration-300" :class="isSidebarCollapsed ? 'rotate-180' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="mx-2 mb-2">
        <button
          class="flex w-full items-center justify-center gap-x-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-offset-gray-900"
          :class="isSidebarCollapsed ? 'px-2' : 'px-4'"
          :title="isSidebarCollapsed ? 'New Chat' : ''"
          @click="onNewChat"
        >
          <IconPlus class="h-5 w-5" :class="isSidebarCollapsed ? 'mx-auto' : ''" />
          <span v-if="!isSidebarCollapsed">New Chat</span>
        </button>
      </div>

      <!-- Menu options -->
      <div class="flex flex-col gap-2 p-2 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          :class="[
            { 'bg-gray-100 dark:bg-gray-800': currentScene === SCENES.CHAT },
            isSidebarCollapsed ? 'justify-center px-2' : '',
          ]"
          :title="isSidebarCollapsed ? 'Chat' : ''"
          @click="switchScene(SCENES.CHAT)"
        >
          <IconMessageCode class="size-5" />
          <span v-if="!isSidebarCollapsed">Chat</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          :class="[
            { 'bg-gray-100 dark:bg-gray-800': currentScene === SCENES.AI_EDITING },
            isSidebarCollapsed ? 'justify-center px-2' : '',
          ]"
          :title="isSidebarCollapsed ? 'AI Editing' : ''"
          @click="switchScene(SCENES.AI_EDITING)"
        >
          <IconEdit class="size-5" />
          <span v-if="!isSidebarCollapsed">AI Editing</span>
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
          @keyup.delete="deleteChat(chat.id!)"
        >
          <span class="text-sm font-medium leading-tight text-gray-900 dark:text-gray-100 truncate">
            {{ chat.name }}
          </span>
          <span class="text-xs leading-tight text-gray-500 dark:text-gray-400 truncate">
            {{ formatChatMeta(chat) }}
          </span>
        </button>
      </div>      <div class="mt-auto w-full space-y-2 px-2 py-4">
        <button
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
          :class="isSidebarCollapsed ? 'justify-center px-2' : ''"
          :title="isSidebarCollapsed ? (isDarkMode ? 'Light Mode' : 'Dark Mode') : ''"
          @click="toggleDarkMode"
        >
          <IconSun v-if="isDarkMode" class="size-4 opacity-50 group-hover:opacity-80" />
          <IconMoon v-else class="size-4 opacity-50 group-hover:opacity-80" />

          <span v-if="!isSidebarCollapsed">Toggle dark mode</span>
        </button>
        <button
          v-if="false"
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
        >
          <IconUserCircle class="size-4 opacity-50 group-hover:opacity-80" />
          User
        </button>
        <button
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
          :class="isSidebarCollapsed ? 'justify-center px-2' : ''"
          :title="isSidebarCollapsed ? 'System prompt' : ''"
          @click="toggleSystemPromptPanel"
        >
          <IconMessageCode class="size-4 opacity-50 group-hover:opacity-80" />

          <span v-if="!isSidebarCollapsed">System prompt</span>
        </button>
        <button
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
          :class="isSidebarCollapsed ? 'justify-center px-2' : ''"
          :title="isSidebarCollapsed ? 'Settings' : ''"
          @click="toggleSettingsPanel"
        >
          <IconSettings2 class="size-4 opacity-50 group-hover:opacity-80" />

          <span v-if="!isSidebarCollapsed">Settings</span>
        </button>        <!-- 删除当前聊天按钮 -->
        <button
          v-if="currentChat && !isSidebarCollapsed"
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
          @click="deleteChat(currentChat.id!)"
        >
          <IconTrashX class="size-4 opacity-50 group-hover:opacity-80" />
          删除当前会话
        </button>
        <!-- 删除所有会话按钮 -->
        <button
          v-if="!isSidebarCollapsed"
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors duration-100 ease-in-out hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/20 dark:focus:ring-red-500"
          @click="wipeDatabase()"
        >
          <IconTrashX class="size-4" />
          删除所有会话
        </button>
      </div>
    </div>
  </aside>
</template>
