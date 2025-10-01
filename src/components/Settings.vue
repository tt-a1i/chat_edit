<script setup lang="ts">
import { IconFileExport, IconLayoutSidebarRightCollapse, IconTrashX, IconUpload } from '@tabler/icons-vue'
import { ref } from 'vue'
import {
  apiKey,
  baseUrl,
  enableMarkdown,
  gravatarEmail,
  historyMessageLength,
  showSystem,
  toggleSettingsPanel,
} from '../services/appConfig.ts'
import { useChats } from '../services/chat.ts'
import ExportButton from './History/ExportButton.vue'
import ImportButton from './History/ImportButton.vue'
import TextInput from './Inputs/TextInput.vue'
import ToggleInput from './Inputs/ToggleInput.vue'

const { wipeDatabase } = useChats()

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
  <aside>
    <!-- 确认删除对话框 -->
    <div
      v-if="showConfirmDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showConfirmDialog = false"
    >
      <div class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          确认删除
        </h3>
        <p class="mb-6 text-sm text-gray-600 dark:text-gray-300">
          确定要删除所有聊天历史吗？此操作无法撤销。
        </p>
        <div class="flex justify-end gap-2">
          <button
            class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            @click="showConfirmDialog = false"
          >
            取消
          </button>
          <button
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            @click="handleConfirmWipe"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>

    <div
      class="relative h-screen w-60 flex flex-col overflow-y-auto border-l border-gray-200 bg-white py-4 dark:border-gray-700 dark:bg-gray-900 sm:w-64"
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

      <!-- More Settings -->
      <div
        class="mb-4 border-t border-gray-200 px-2 py-4 text-gray-900 dark:border-gray-700 dark:text-gray-100"
      >
        <div>
          <ToggleInput v-model="enableMarkdown" label="Enable Markdown" />
          <ToggleInput v-model="showSystem" label="Show System messages" />
        </div>

        <TextInput id="base-url" v-model="baseUrl" label="Base URL" />
        <TextInput id="api-key" v-model="apiKey" label="API Key" />

        <TextInput id="gravatar-email" v-model="gravatarEmail" label="Gravatar Email" />

        <div>
          <label for="chat-history-length" class="mb-2 mt-4 block px-2 text-sm font-medium">
            Conversation History Size
          </label>
          <input
            id="chat-history-length"
            v-model="historyMessageLength"
            type="number"
            min="0"
            max="100"
            class="block w-full rounded-lg bg-gray-100 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:placeholder-gray-300 dark:focus:ring-blue-600"
            placeholder="2048"
          >
        </div>

        <div v-if="false">
          <div>
            <label for="max-tokens" class="mb-2 mt-4 block px-2 text-sm font-medium">
              Max tokens
            </label>
            <input
              id="max-tokens"
              type="number"
              disabled
              class="block w-full rounded-lg bg-gray-100 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:placeholder-gray-300 dark:focus:ring-blue-600"
              placeholder="2048"
            >
          </div>

          <div>
            <label for="temperature" class="mb-2 mt-4 block px-2 text-sm font-medium">
              Temperature
            </label>
            <input
              id="temperature"
              type="number"
              disabled
              class="block w-full rounded-lg bg-gray-100 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:placeholder-gray-300 dark:focus:ring-blue-600"
              placeholder="0.7"
            >
          </div>

          <div>
            <label for="top-p" class="mb-2 mt-4 block px-2 text-sm font-medium">
              Top P
            </label>
            <input
              id="top-p"
              type="number"
              disabled
              class="block w-full rounded-lg bg-gray-100 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-gray-800 dark:placeholder-gray-300 dark:focus:ring-blue-600"
              placeholder="1"
            >
          </div>
        </div>
      </div>

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
  </aside>
</template>
