<script setup lang="ts">
/**
 * Settings 面板 - 简化版
 * API 配置已移至环境变量 (env.ts)
 * 只保留数据管理功能
 */
import { IconFileExport, IconLayoutSidebarRightCollapse, IconTrashX, IconUpload } from '@tabler/icons-vue'
import { ref } from 'vue'
import ExportButton from '@/components/history/ExportButton.vue'
import ImportButton from '@/components/history/ImportButton.vue'
import { useAppStore, useChatStore } from '@/stores'

// Stores
const appStore = useAppStore()
const chatStore = useChatStore()
const { toggleSettingsPanel } = appStore
const { wipeDatabase } = chatStore

const showConfirmDialog = ref(false)

function confirmWipe() {
  showConfirmDialog.value = true
}

function handleConfirmWipe() {
  wipeDatabase()
  showConfirmDialog.value = false
}
</script>

<template>
  <!-- 设置模态窗口 -->
  <div
    class="relative mx-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl dark:bg-gray-800 overflow-hidden"
    @click.stop
  >
    <!-- 确认删除对话框 -->
    <div
      v-if="showConfirmDialog"
      class="absolute inset-0 z-50 flex items-center justify-center bg-black/50 rounded-xl"
      @click.self="showConfirmDialog = false"
    >
      <div class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-700">
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          确认删除
        </h3>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-300">
          确定要删除所有聊天历史吗？此操作无法撤销。
        </p>
        <div class="flex justify-end gap-2">
          <button
            class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
            @click="showConfirmDialog = false"
          >
            取消
          </button>
          <button
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="handleConfirmWipe"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>

    <div
      class="relative max-h-[85vh] flex flex-col overflow-y-auto py-6 px-8"
    >
      <div class="mb-4 flex items-center gap-x-2 px-2 text-gray-900 dark:text-gray-100">
        <button
          class="inline-flex rounded-lg p-1 hover:bg-gray-100 hover:dark:bg-gray-700"
          @click="toggleSettingsPanel()"
        >
          <IconLayoutSidebarRightCollapse class="h-6 w-6" />

          <span class="sr-only">Close settings sidebar</span>
        </button>
        <h2 class="text-lg font-medium">
          Settings
        </h2>
      </div>

      <!-- 数据管理 -->
      <div
        class="mt-auto px-2 space-y-2 text-gray-900 dark:text-gray-100"
      >
        <ImportButton
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
        >
          <IconUpload class="size-4 opacity-50 group-hover:opacity-80" />

          Import chats
        </ImportButton>
        <ExportButton
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
        >
          <IconFileExport class="size-4 opacity-50 group-hover:opacity-80" />

          Export chats
        </ExportButton>
        <button
          class="group flex w-full items-center gap-x-2 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-900 transition-colors duration-100 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-300 dark:hover:bg-gray-700 dark:focus:ring-blue-500"
          @click="confirmWipe"
        >
          <IconTrashX class="size-4 opacity-50 group-hover:opacity-80" />

          Delete all chats
        </button>
      </div>
    </div>
  </div>
</template>
