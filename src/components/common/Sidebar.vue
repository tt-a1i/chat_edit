<script setup lang="ts">
import {
  IconAlertTriangle,
  IconEdit,
  IconMessageCode,
  IconMoon,
  IconPlus,
  IconSettings2,
  IconSun,
  IconTrash,
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
    ['message'],
    {
      configProviderProps: {
        theme: isDarkMode.value ? darkTheme : undefined,
      },
    },
  ),
)

// 删除对话框状态
const showDeleteDialog = ref(false)
const deleteDialogType = ref<'current' | 'all'>('current')
const isDeleting = ref(false)

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

// 打开删除当前会话对话框
function openDeleteCurrentDialog() {
  const chat = currentChat.value
  const { message } = discreteApi.value

  if (!chat?.id) {
    message.warning('未找到要删除的会话')
    return
  }

  deleteDialogType.value = 'current'
  showDeleteDialog.value = true
}

// 打开删除所有会话对话框
function openDeleteAllDialog() {
  deleteDialogType.value = 'all'
  showDeleteDialog.value = true
}

// 关闭删除对话框
function closeDeleteDialog() {
  showDeleteDialog.value = false
  isDeleting.value = false
}

// 执行删除操作
async function handleConfirmDelete() {
  const { message } = discreteApi.value
  isDeleting.value = true

  try {
    if (deleteDialogType.value === 'current') {
      const chatId = currentChat.value?.id
      if (chatId) {
        await deleteChat(chatId)
        message.success('会话已删除')
      }
    } else {
      await wipeDatabase()
      message.success('所有会话已删除')
    }
    closeDeleteDialog()
  } catch (error) {
    logger.error(`删除${deleteDialogType.value === 'current' ? '会话' : '所有会话'}失败`, error)
    const errorMessage = error instanceof Error
      ? error.message
      : '删除失败，请重试'
    message.error(errorMessage)
    isDeleting.value = false
  }
}

// 获取删除对话框的配置
const deleteDialogConfig = computed(() => {
  if (deleteDialogType.value === 'current') {
    return {
      title: '删除当前会话',
      description: `确定要删除会话「${currentChat.value?.name || ''}」吗？此操作无法撤销。`,
      icon: IconTrash,
      iconClass: 'warning',
      confirmText: '删除',
    }
  }
  return {
    title: '删除所有会话',
    description: '此操作将永久删除所有聊天记录，且无法恢复。请确认您已备份重要数据。',
    icon: IconAlertTriangle,
    iconClass: 'danger',
    confirmText: '确认删除',
  }
})

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
  <!-- 删除确认对话框 -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showDeleteDialog"
        class="delete-dialog-overlay"
        @click.self="closeDeleteDialog"
      >
        <Transition name="scale">
          <div v-if="showDeleteDialog" class="delete-dialog">
            <div class="dialog-icon" :class="deleteDialogConfig.iconClass">
              <component :is="deleteDialogConfig.icon" class="h-6 w-6" />
            </div>
            <h3 class="dialog-title">
              {{ deleteDialogConfig.title }}
            </h3>
            <p class="dialog-description">
              {{ deleteDialogConfig.description }}
            </p>
            <div class="dialog-actions">
              <button
                class="btn-cancel"
                :disabled="isDeleting"
                @click="closeDeleteDialog"
              >
                取消
              </button>
              <button
                class="btn-danger"
                :class="{ 'is-loading': isDeleting }"
                :disabled="isDeleting"
                @click="handleConfirmDelete"
              >
                {{ isDeleting ? '删除中...' : deleteDialogConfig.confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>

  <aside
    class="relative flex transition-all duration-300 ease-in-out"
    :class="isSidebarCollapsed ? 'w-16' : 'w-60 sm:w-64'"
  >
    <!-- 折叠/展开按钮 - 垂直居中，更精致的设计 -->
    <button
      class="absolute -right-3 top-1/2 -translate-y-1/2 z-50 flex h-7 w-7 items-center justify-center rounded-full
             border-2 border-white bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600
             shadow-[0_2px_8px_-1px_rgba(20,184,166,0.5),0_4px_12px_-2px_rgba(16,185,129,0.3)]
             transition-all duration-300 ease-out
             hover:scale-110 hover:-translate-y-[calc(50%+2px)] hover:shadow-[0_4px_12px_-1px_rgba(20,184,166,0.6),0_6px_16px_-2px_rgba(16,185,129,0.4)]
             active:scale-95
             dark:border-gray-800 dark:from-teal-500 dark:via-teal-600 dark:to-emerald-700"
      :title="isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
      @click="toggleSidebar"
    >
      <svg
        class="h-4 w-4 text-white drop-shadow-sm transition-transform duration-300"
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
      class="sidebar-container flex h-screen flex-col overflow-y-auto
             border-r border-gray-200/60
             bg-gradient-to-b from-white via-gray-50/50 to-white
             backdrop-blur-md pt-2
             dark:border-gray-700/60 dark:from-gray-900 dark:via-gray-850/95 dark:to-gray-900"
      :class="isSidebarCollapsed ? 'w-16' : 'w-full'"
    >
      <div class="mx-2 mb-3">
        <button
          class="flex w-full items-center justify-center rounded-[14px]
                 bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600
                 py-3 text-sm font-semibold text-white
                 shadow-[0_2px_8px_-1px_rgba(20,184,166,0.5),0_4px_16px_-2px_rgba(16,185,129,0.3)]
                 transition-all duration-300 ease-out overflow-hidden
                 hover:shadow-[0_4px_12px_-1px_rgba(20,184,166,0.6),0_6px_20px_-2px_rgba(16,185,129,0.4)]
                 hover:scale-[1.02] hover:-translate-y-0.5
                 active:scale-[0.98] active:translate-y-0
                 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2
                 dark:from-teal-500 dark:via-teal-600 dark:to-emerald-700
                 dark:shadow-[0_2px_8px_-1px_rgba(20,184,166,0.4),0_4px_16px_-2px_rgba(0,0,0,0.3)]
                 dark:focus:ring-offset-gray-900"
          :class="isSidebarCollapsed ? 'px-2 gap-x-0' : 'px-4 gap-x-2'"
          :title="isSidebarCollapsed ? 'New Chat' : ''"
          :aria-label="isSidebarCollapsed ? '新建聊天' : undefined"
          @click="onNewChat"
        >
          <IconPlus class="h-5 w-5 flex-shrink-0 drop-shadow-sm" :class="isSidebarCollapsed ? 'mx-auto' : ''" />
          <span
            v-if="showSidebarText"
            class="whitespace-nowrap transition-opacity duration-200"
          >New Chat</span>
        </button>
      </div>

      <!-- Menu options - 更精致的选项卡 -->
      <div class="flex flex-col gap-1.5 p-2 border-b border-gray-200/60 dark:border-gray-700/60">
        <button
          type="button"
          class="flex items-center rounded-xl py-2.5 text-gray-700 transition-all duration-200 ease-out overflow-hidden
                 hover:bg-gray-100/80 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]
                 dark:text-gray-200 dark:hover:bg-gray-800/80"
          :class="[
            currentScene === SCENES.CHAT
              ? 'bg-teal-50/80 text-teal-700 shadow-[0_2px_8px_-2px_rgba(20,184,166,0.15)] dark:bg-teal-900/30 dark:text-teal-300'
              : '',
            isSidebarCollapsed ? 'justify-center px-2 gap-0' : 'px-4 gap-2.5',
          ]"
          :title="isSidebarCollapsed ? 'Chat' : ''"
          :aria-label="isSidebarCollapsed ? '聊天' : undefined"
          @click="switchScene(SCENES.CHAT)"
        >
          <IconMessageCode class="size-5 flex-shrink-0" :class="currentScene === SCENES.CHAT ? 'text-teal-600 dark:text-teal-400' : ''" />
          <span
            v-if="showSidebarText"
            class="whitespace-nowrap font-medium transition-opacity duration-200"
          >Chat</span>
        </button>

        <button
          type="button"
          class="flex items-center rounded-xl py-2.5 text-gray-700 transition-all duration-200 ease-out overflow-hidden
                 hover:bg-gray-100/80 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]
                 dark:text-gray-200 dark:hover:bg-gray-800/80"
          :class="[
            currentScene === SCENES.AI_EDITING
              ? 'bg-teal-50/80 text-teal-700 shadow-[0_2px_8px_-2px_rgba(20,184,166,0.15)] dark:bg-teal-900/30 dark:text-teal-300'
              : '',
            isSidebarCollapsed ? 'justify-center px-2 gap-0' : 'px-4 gap-2.5',
          ]"
          :title="isSidebarCollapsed ? 'AI Editing' : ''"
          :aria-label="isSidebarCollapsed ? 'AI 编辑器' : undefined"
          @click="switchScene(SCENES.AI_EDITING)"
        >
          <IconEdit class="size-5 flex-shrink-0" :class="currentScene === SCENES.AI_EDITING ? 'text-teal-600 dark:text-teal-400' : ''" />
          <span
            v-if="showSidebarText"
            class="whitespace-nowrap font-medium transition-opacity duration-200"
          >AI Editing</span>
        </button>
      </div>

      <!-- Chat history - 更精致的历史列表 -->
      <div
        v-if="!isSidebarCollapsed"
        class="h-full space-y-1.5 overflow-y-auto border-b border-gray-200/60 px-2 py-3 dark:border-gray-700/60"
      >
        <button
          v-for="(chat, index) in sortedChats"
          :key="index"
          :class="currentChat?.id === chat.id
            ? 'bg-gradient-to-r from-teal-50 to-teal-50/50 border-l-[3px] border-teal-500 shadow-[0_2px_8px_-2px_rgba(20,184,166,0.15)] dark:from-teal-900/30 dark:to-teal-900/10 dark:border-teal-400'
            : 'border-l-[3px] border-transparent hover:bg-gray-50/80 hover:border-gray-200 dark:hover:bg-gray-800/50 dark:hover:border-gray-700'"
          class="flex w-full flex-col gap-y-1 rounded-xl px-3.5 py-3 text-left transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:text-gray-100"
          @click="onSwitchChat(chat.id!)"
        >
          <span class="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100 truncate">
            {{ chat.name }}
          </span>
          <span class="text-xs leading-tight text-gray-500 dark:text-gray-400 truncate">
            {{ formatChatMeta(chat) }}
          </span>
        </button>
      </div>
      <!-- 底部功能按钮 - 更精致的设计 -->
      <div class="mt-auto w-full space-y-1 px-2 py-4 border-t border-gray-200/40 dark:border-gray-700/40">
        <button
          class="group flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-600 transition-all duration-200 ease-out
                 hover:bg-amber-50/80 hover:text-amber-700 hover:shadow-[0_2px_8px_-2px_rgba(245,158,11,0.15)]
                 focus:outline-none focus:ring-2 focus:ring-amber-400/30
                 dark:text-gray-400 dark:hover:bg-amber-900/20 dark:hover:text-amber-300 overflow-hidden"
          :class="isSidebarCollapsed ? 'justify-center px-2 gap-x-0' : 'gap-x-2.5'"
          :title="isSidebarCollapsed ? (isDarkMode ? 'Light Mode' : 'Dark Mode') : ''"
          :aria-label="isSidebarCollapsed ? (isDarkMode ? '切换到亮色模式' : '切换到暗色模式') : undefined"
          @click="toggleDarkMode"
        >
          <IconSun v-if="isDarkMode" class="size-4.5 text-amber-500 flex-shrink-0 drop-shadow-sm" />
          <IconMoon v-else class="size-4.5 text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex-shrink-0 transition-colors" />

          <span
            v-if="showSidebarText"
            class="whitespace-nowrap transition-opacity duration-200"
          >Toggle dark mode</span>
        </button>
        <button
          v-if="false"
          class="group flex w-full items-center gap-x-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-600 transition-all duration-200 ease-out hover:bg-gray-100/80 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-400/30 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100"
        >
          <IconUserCircle class="size-4.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          User
        </button>
        <button
          class="group flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-600 transition-all duration-200 ease-out
                 hover:bg-teal-50/80 hover:text-teal-700 hover:shadow-[0_2px_8px_-2px_rgba(20,184,166,0.15)]
                 focus:outline-none focus:ring-2 focus:ring-teal-400/30
                 dark:text-gray-400 dark:hover:bg-teal-900/20 dark:hover:text-teal-300 overflow-hidden"
          :class="isSidebarCollapsed ? 'justify-center px-2 gap-x-0' : 'gap-x-2.5'"
          :title="isSidebarCollapsed ? 'System prompt' : ''"
          :aria-label="isSidebarCollapsed ? '系统提示词' : undefined"
          @click="toggleSystemPromptPanel"
        >
          <IconMessageCode class="size-4.5 text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 flex-shrink-0 transition-colors" />

          <span
            v-if="showSidebarText"
            class="whitespace-nowrap transition-opacity duration-200"
          >System prompt</span>
        </button>
        <button
          class="group flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-600 transition-all duration-200 ease-out
                 hover:bg-gray-100/80 hover:text-gray-900 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]
                 focus:outline-none focus:ring-2 focus:ring-gray-400/30
                 dark:text-gray-400 dark:hover:bg-gray-800/80 dark:hover:text-gray-100 overflow-hidden"
          :class="isSidebarCollapsed ? 'justify-center px-2 gap-x-0' : 'gap-x-2.5'"
          :title="isSidebarCollapsed ? 'Settings' : ''"
          :aria-label="isSidebarCollapsed ? '设置' : undefined"
          @click="toggleSettingsPanel"
        >
          <IconSettings2 class="size-4.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0 transition-colors" />

          <span
            v-if="showSidebarText"
            class="whitespace-nowrap transition-opacity duration-200"
          >Settings</span>
        </button>
        <!-- 删除当前聊天按钮 -->
        <button
          v-if="currentChat && showSidebarText"
          class="group flex w-full items-center gap-x-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-500 transition-all duration-200 ease-out
                 hover:bg-gray-100/80 hover:text-gray-700
                 focus:outline-none focus:ring-2 focus:ring-gray-400/30
                 dark:text-gray-500 dark:hover:bg-gray-800/80 dark:hover:text-gray-300"
          @click="openDeleteCurrentDialog"
        >
          <IconTrashX class="size-4.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
          删除当前会话
        </button>
        <!-- 删除所有会话按钮 -->
        <button
          v-if="showSidebarText"
          class="group flex w-full items-center gap-x-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400/80 transition-all duration-200 ease-out
                 hover:bg-red-50/80 hover:text-red-600 hover:shadow-[0_2px_8px_-2px_rgba(239,68,68,0.15)]
                 focus:outline-none focus:ring-2 focus:ring-red-400/30
                 dark:text-red-400/70 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          @click="openDeleteAllDialog"
        >
          <IconTrashX class="size-4.5 transition-colors" />
          删除所有会话
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
/* 删除对话框遮罩 */
.delete-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

/* 删除对话框 */
.delete-dialog {
  width: calc(100% - 2rem);
  max-width: 22rem;
  padding: var(--space-xl, 2rem);
  margin: 1rem;
  background: var(--bg-primary, #ffffff);
  border-radius: var(--radius-2xl, 1.25rem);
  box-shadow: var(--shadow-2xl, 0 25px 50px -12px rgb(0 0 0 / 0.25));
  text-align: center;
}

.dark .delete-dialog {
  background: var(--dark-bg-secondary, #25262b);
  border: 1px solid var(--dark-border-light, #373a40);
}

/* 对话框图标 */
.dialog-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  margin-bottom: var(--space-md, 1rem);
  border-radius: var(--radius-full, 9999px);
  transition: all 0.2s ease;
}

.dialog-icon.warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #d97706;
}

.dialog-icon.danger {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  color: #dc2626;
}

.dark .dialog-icon.warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%);
  color: #fbbf24;
}

.dark .dialog-icon.danger {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%);
  color: #f87171;
}

/* 对话框标题 */
.dialog-title {
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-primary, #1c1917);
  margin-bottom: var(--space-sm, 0.5rem);
}

.dark .dialog-title {
  color: var(--dark-text-primary, #f8f9fa);
}

/* 对话框描述 */
.dialog-description {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-secondary, #57534e);
  line-height: 1.6;
  margin-bottom: var(--space-xl, 2rem);
}

.dark .dialog-description {
  color: var(--dark-text-secondary, #c1c2c5);
}

/* 对话框操作按钮 */
.dialog-actions {
  display: flex;
  gap: var(--space-sm, 0.5rem);
}

.btn-cancel,
.btn-danger {
  flex: 1;
  padding: 0.75rem 1.25rem;
  border-radius: var(--radius-lg, 0.75rem);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel {
  background: var(--bg-tertiary, #f5f5f4);
  color: var(--text-primary, #1c1917);
  border: 1px solid var(--border-light, #e7e5e4);
}

.btn-cancel:hover:not(:disabled) {
  background: var(--bg-secondary, #fafaf9);
  border-color: var(--border-medium, #d6d3d1);
}

.btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dark .btn-cancel {
  background: var(--dark-bg-tertiary, #2c2e33);
  color: var(--dark-text-primary, #f8f9fa);
  border-color: var(--dark-border-light, #373a40);
}

.dark .btn-cancel:hover:not(:disabled) {
  background: var(--dark-bg-elevated, #373a40);
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 8px -2px rgba(239, 68, 68, 0.4);
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px -2px rgba(239, 68, 68, 0.5);
}

.btn-danger:active:not(:disabled) {
  transform: translateY(0);
}

.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-danger.is-loading {
  background: #f87171;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
