<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { nextTick, onMounted, ref } from 'vue'
import AIEditingMain from './components/AIEditing/index.vue'
import ChatInput from './components/chat/ChatInput.vue'
import ChatMessages from './components/chat/ChatMessages.vue'
import SystemPrompt from './components/chat/SystemPrompt.vue'
import CompactModelSelector from './components/common/CompactModelSelector.vue'
import Sidebar from './components/common/Sidebar.vue'
import TextInput from './components/Inputs/TextInput.vue'
import Settings from './components/Settings.vue'
import { applyDarkModeToDocument, syncSystemDarkMode } from './composables/useTheme.ts'
import { useAI } from './services/ai.ts'
import { SCENES, useAppStore, useChatStore } from './stores'

// Stores
const appStore = useAppStore()
const chatStore = useChatStore()
const { currentScene, isDarkMode, isSettingsOpen, isSystemPromptOpen, currentModel } = storeToRefs(appStore)
const { currentChat } = storeToRefs(chatStore)

// Services
const { refreshModels, availableModels } = useAI()
const { renameChat, initialize } = chatStore
const isEditingChatName = ref(false)
const editedChatName = ref('')
const chatNameInput = ref()

// 初始化暗色模式
syncSystemDarkMode()
applyDarkModeToDocument()

function startEditing() {
  isEditingChatName.value = true
  editedChatName.value = currentChat.value?.name || ''
  nextTick(() => {
    if (!chatNameInput.value) {
      return
    }
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
  if (currentChat.value && editedChatName.value) {
    renameChat(editedChatName.value)
    isEditingChatName.value = false
  }
}

onMounted(() => {
  refreshModels().then(async () => {
    await initialize()
    if (!currentModel.value && availableModels.value.length > 0) {
      appStore.currentModel = availableModels.value[0].name
    }
  })
})
</script>

<template>
  <div :class="{ dark: isDarkMode }" class="transition-colors duration-300">
    <main class="flex h-full w-full flex-1 flex-row items-stretch bg-white dark:bg-gray-900">
      <Sidebar />

      <!-- Chat Scene -->
      <div v-if="currentScene === SCENES.CHAT" class="mx-auto flex h-screen w-full flex-col">
        <div v-if="isSystemPromptOpen" class="mx-auto flex h-screen w-full max-w-4xl flex-col gap-4 px-4 pb-4">
          <SystemPrompt />
        </div>

        <div v-else class="flex h-screen w-full flex-col">
          <!-- 现代化顶部栏 - 全宽但内容居中 -->
          <div class="w-full border-b bg-white/50 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/50 sticky top-0 z-10">
            <div class="mx-auto flex max-w-5xl items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 lg:px-6">
              <!-- 左侧：会话信息 -->
              <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div class="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <span class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Chat</span>
                </div>
                <div class="hidden sm:block h-4 w-px bg-gray-300 dark:bg-gray-600" />
                <CompactModelSelector />
              </div>

              <!-- 右侧：会话名称 -->
              <div v-if="currentChat" class="flex items-center gap-2 ml-2 sm:ml-4">
                <button
                  v-if="!isEditingChatName"
                  type="button"
                  title="点击重命名会话"
                  class="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100 truncate max-w-xs"
                  @click.prevent="startEditing"
                >
                  {{ currentChat.name }}
                </button>
                <div v-else class="flex items-center gap-2">
                  <TextInput
                    id="chat-name"
                    ref="chatNameInput"
                    v-model="editedChatName"
                    class="w-48 text-sm"
                    @keyup.enter="confirmRename"
                    @keyup.esc="cancelEditing"
                  />
                  <button
                    class="rounded-lg px-2 py-1 text-sm text-green-600 hover:bg-green-50 font-medium dark:text-green-400 dark:hover:bg-green-900/20 transition-colors"
                    @click="confirmRename"
                  >
                    确认
                  </button>
                  <button
                    class="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 font-medium dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                    @click="cancelEditing"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 消息区域 - 全宽滚动，内容居中 -->
          <ChatMessages class="flex-1" />

          <!-- 输入区域 - 全宽但内容居中 -->
          <div class="w-full border-t bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-700">
            <div class="mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 pt-4 pb-2">
              <ChatInput />
            </div>
          </div>
        </div>
      </div>

      <!-- AI Editing Scene -->
      <div v-else-if="currentScene === SCENES.AI_EDITING" class="mx-auto flex h-screen w-full flex-col">
        <AIEditingMain />
      </div>

      <!-- 设置模态窗口 -->
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isSettingsOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          @click.self="appStore.toggleSettingsPanel()"
        >
          <Settings />
        </div>
      </Transition>
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
