<script setup lang="ts">
import { useAI } from '../services/useAI.ts'
import ModelSelector from './ModelSelector.vue'

const { currentModel } = useAI()
</script>

<template>
  <div class="flex h-full w-full flex-col">
    <div class="flex w-full flex-row items-center justify-between gap-4 rounded-b-xl bg-gray-100 px-4 py-2 dark:bg-gray-800">
      <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
        AI Editing
      </h1>
      <ModelSelector />
    </div>

    <div class="flex-1 overflow-auto p-4">
      <div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          AI Editing Workspace
        </h2>
        <p class="text-gray-700 dark:text-gray-300">
          This is the AI editing interface. Implement your editing features here.
        </p>
      </div>
    </div>
  </div>
</template>
