<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import AIEditingMain from './components/AIEditing/AIEditingMain.vue'
import ChatInput from './components/ChatInput.vue'
import ChatMessages from './components/ChatMessages.vue'
import TextInput from './components/Inputs/TextInput.vue'
import ModelSelector from './components/ModelSelector.vue'
import NavHeader from './components/NavHeader.vue'
import Settings from './components/Settings.vue'
import Sidebar from './components/Sidebar.vue'
import SystemPrompt from './components/SystemPrompt.vue'
import {
  currentModel,
  currentScene,
  isDarkMode,
  isSettingsOpen,
  isSystemPromptOpen,
  SCENES,
} from './services/appConfig.ts'
import { useChats } from './services/chat.ts'
import { useAI } from './services/useAI.ts'
import { applyDarkModeToDocument, syncSystemDarkMode } from './utils/darkMode.ts'

const { refreshModels, availableModels } = useAI()
const { activeChat, renameChat, switchModel, initialize } = useChats()
const isEditingChatName = ref(false)
const editedChatName = ref('')
const chatNameInput = ref()

// 初始化暗色模式
syncSystemDarkMode()
applyDarkModeToDocument()

function startEditing() {
  isEditingChatName.value = true
  editedChatName.value = activeChat.value?.name || ''
  nextTick(() => {
    if (!chatNameInput.value)
      return
    const input = chatNameInput.value.$el.querySelector('input')
    input.focus()
    input.select()
  })
}

function cancelEditing() {
  isEditingChatName.value = false
  editedChatName.value = ''
}

function confirmRename() {
  if (activeChat.value && editedChatName.value) {
    renameChat(editedChatName.value)
    isEditingChatName.value = false
  }
}

onMounted(() => {
  refreshModels().then(async () => {
    await initialize()
    await switchModel(currentModel.value ?? availableModels.value[0].name)
  })
})
</script>

<template>
  <div :class="{ dark: isDarkMode }" class="transition-colors duration-300">
    <main class="flex h-full w-full flex-1 flex-row items-stretch bg-white dark:bg-gray-900">
      <Sidebar />

      <!-- Chat Scene -->
      <div v-if="currentScene === SCENES.CHAT" class="mx-auto flex h-screen w-full flex-col">
        <div v-if="isSystemPromptOpen" class="mx-auto flex h-screen w-full max-w-7xl flex-col gap-4 px-4 pb-4">
          <SystemPrompt />
        </div>

        <div v-else class="mx-auto flex h-screen w-full max-w-7xl flex-col gap-4 px-4 pb-4">
          <div class="flex w-full flex-row items-center justify-center gap-4 rounded-b-xl bg-gray-100 px-4 py-2 dark:bg-gray-800/95 border-b dark:border-gray-700">
            <div v-if="activeChat" class="mr-auto flex h-full items-center">
              <div>
                <div v-if="isEditingChatName">
                  <TextInput
                    id="chat-name"
                    ref="chatNameInput"
                    v-model="editedChatName"
                    @keyup.enter="confirmRename"
                    @keyup.esc="cancelEditing"
                    @blur="cancelEditing"
                  />
                </div>

                <button
                  v-else
                  type="button"
                  class="block h-full rounded border-none p-2 text-gray-900 decoration-gray-400 decoration-dashed outline-none hover:underline focus:ring-2 focus:ring-blue-600 dark:text-gray-100 dark:focus:ring-blue-600"
                  @click.prevent="startEditing"
                >
                  {{ activeChat.name }}
                </button>
              </div>
            </div>

            <ModelSelector />
          </div>

          <ChatMessages />
          <ChatInput />
        </div>
      </div>

      <!-- AI Editing Scene -->
      <div v-else-if="currentScene === SCENES.AI_EDITING" class="mx-auto flex h-screen w-full flex-col">
        <AIEditingMain />
      </div>

      <transition name="slide">
        <Settings v-if="isSettingsOpen" />
      </transition>
    </main>
  </div>
</template>

<style>
/* 暗色模式全局变量 */
:root {
  --message-bg-user: #ffffff;
  --message-bg-user-dark: #111827;
  --message-bg-ai: #f9fafb;
  --message-bg-ai-dark: #1e2736;
  --text-color-primary: #111827;
  --text-color-primary-dark: #f3f4f6;
  --border-color: #e5e7eb;
  --border-color-dark: #374151;
}

/* 暗色模式过渡效果 */
.dark-mode-transition {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

/* 自定义滚动条全局样式 */
.dark *::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.7);
}

.dark *::-webkit-scrollbar-track {
  background: transparent;
}

.dark * {
  scrollbar-color: rgba(156, 163, 175, 0.7) transparent;
}

/* 改进暗色模式下的代码块样式 */
.dark .prose pre {
  background-color: rgba(30, 41, 59, 0.95) !important;
  border-color: rgba(71, 85, 105, 0.5) !important;
}

.dark .prose code {
  color: #e2e8f0 !important;
  background-color: #1e293b !important;
  border-radius: 0.25rem;
  padding: 0.125rem 0.25rem;
}

/* 添加暗色模式下更好的可见性 */
.dark .prose p,
.dark .prose li,
.dark .prose blockquote {
  color: #e2e8f0 !important;
}

.dark .prose-invert h1,
.dark .prose-invert h2,
.dark .prose-invert h3,
.dark .prose-invert h4 {
  color: #f8fafc !important;
}

/* 确保暗色模式下的行内代码也是暗色背景 */
.dark .prose code:not(pre code) {
  background-color: #1e293b !important;
  color: #e2e8f0 !important;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

/* 改进行内代码的背景色，避免使用浅色背景 */
.dark .prose *:not(pre) > code {
  background-color: #1e293b !important;
  color: #e2e8f0 !important;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}

/* 确保表格中的文本在暗色模式下可见 */
.dark .prose table td,
.dark .prose table th {
  color: #e2e8f0 !important;
  border-color: #4b5563 !important;
}

.dark .prose table {
  border-color: #4b5563 !important;
}

/* 确保暗色模式下的链接文本可见 */
.dark .prose a {
  color: #60a5fa !important;
  text-decoration: underline;
}

/* 加强代码块的暗色模式适配 */
.dark .prose pre code {
  color: #e2e8f0 !important;
  background-color: transparent !important;
}
</style>
