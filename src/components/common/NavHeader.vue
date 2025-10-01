<script setup lang="ts">
import { SCENES, useAppStore } from '@/stores'
import { storeToRefs } from 'pinia'

defineProps({
  title: {
    type: String,
    default: '',
  },
})

const appStore = useAppStore()
const { currentScene } = storeToRefs(appStore)
const { switchScene } = appStore
</script>

<template>
  <div class="flex w-full flex-row items-center justify-between gap-4 rounded-b-xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
    <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
      {{ title }}
    </h1>

    <div class="flex space-x-2">
      <button
        class="px-3 py-1 rounded-md transition-colors duration-200"
        :class="currentScene === SCENES.CHAT
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'"
        @click="switchScene(SCENES.CHAT)"
      >
        Chat
      </button>

      <button
        class="px-3 py-1 rounded-md transition-colors duration-200"
        :class="currentScene === SCENES.AI_EDITING
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'"
        @click="switchScene(SCENES.AI_EDITING)"
      >
        AI Editing
      </button>
    </div>

    <slot name="actions"></slot>
  </div>
</template>
