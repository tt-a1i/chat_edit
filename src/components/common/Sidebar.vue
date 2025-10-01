<script setup lang="ts">
import { SCENES, useAppStore, useChatStore } from '@/stores'
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
const { currentScene, isDarkMode, isSystemPromptOpen } = storeToRefs(appStore)
const { sortedChats, currentChat } = storeToRefs(chatStore)
const { switchScene, toggleSettingsPanel, toggleSystemPromptPanel, toggleDarkMode } = appStore
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

const lang = navigator.language
</script>

<template>
  <aside class="flex">
    <div
      class="flex h-screen w-60 flex-col overflow-y-auto border-r border-gray-200 bg-white pt-2 dark:border-gray-800 dark:bg-gray-900 sm:h-screen sm:w-64"
    >
      <div class="mx-2 mb-2">
        <button
          class="flex w-full items-center justify-center gap-x-2 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-offset-gray-900"
          @click="onNewChat"
        >
          <IconPlus class="h-5 w-5" />
          <span>New Chat</span>
        </button>
      </div>

      <!-- Menu options -->
      <div class="flex flex-col gap-2 p-2 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          :class="{ 'bg-gray-100 dark:bg-gray-800': currentScene === SCENES.CHAT }"
          @click="switchScene(SCENES.CHAT)"
        >
          <IconMessageCode class="size-5" />
          <span>Chat</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
          :class="{ 'bg-gray-100 dark:bg-gray-800': currentScene === SCENES.AI_EDITING }"
          @click="switchScene(SCENES.AI_EDITING)"
        >
          <IconEdit class="size-5" />
          <span>AI Editing</span>
        </button>
      </div>

      <!-- Chat history -->
      <div
        class="h-full space-y-4 overflow-y-auto border-b border-gray-200 px-2 py-4 dark:border-gray-800"
      >
        <button
          v-for="(chat, index) in sortedChats"
          :key="index"
          :class="{
            'bg-gray-100 dark:bg-gray-800': currentChat?.id === chat.id,
          }"
          class="flex w-full flex-col gap-y-1 rounded-md px-3 py-2 text-left transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
          @click="onSwitchChat(chat.id!)"
          @keyup.delete="deleteChat(chat.id!)"
        >
          <span class="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
            {{ chat.name }}
          </span>
          <span class="text-xs leading-none text-gray-700 dark:text-gray-300">
            {{ chat.model }}
          </span>
          <span class="text-xs leading-none text-gray-700 dark:text-gray-300">
            {{
              chat.createdAt.toLocaleDateString(lang, {
                day: '2-digit',
                month: 'short',
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            }}
          </span>
        </button>
      </div>      <div class="mt-auto w-full space-y-2 px-2 py-4">
        <button
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
          @click="toggleDarkMode"
        >
          <IconSun v-if="isDarkMode" class="size-4 opacity-50 group-hover:opacity-80" />
          <IconMoon v-else class="size-4 opacity-50 group-hover:opacity-80" />

          Toggle dark mode
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
          @click="toggleSystemPromptPanel"
        >
          <IconMessageCode class="size-4 opacity-50 group-hover:opacity-80" />

          System prompt
        </button>
        <button
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
          @click="toggleSettingsPanel"
        >
          <IconSettings2 class="size-4 opacity-50 group-hover:opacity-80" />

          Settings
        </button>        <!-- 删除当前聊天按钮 -->
        <button
          v-if="currentChat"
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
          @click="deleteChat(currentChat.id!)"
        >
          <IconTrashX class="size-4 opacity-50 group-hover:opacity-80" />
          删除当前会话
        </button>
        <!-- 删除所有会话按钮 -->
        <button
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
          @click="wipeDatabase()"
        >
          <IconTrashX class="size-4 opacity-50 group-hover:opacity-80" />
          删除所有会话
        </button>
      </div>
    </div>
  </aside>
</template>
