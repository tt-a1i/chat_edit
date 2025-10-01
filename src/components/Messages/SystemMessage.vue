<script setup lang="ts">
import type { Message } from '../../services/database.ts'

interface Props {
  message: Message
}
const { message } = defineProps<Props>()
</script>

<template>
  <div class="mb-4 flex rounded-xl bg-blue-50 px-2 py-6 dark:bg-blue-900/90 sm:px-4 border border-blue-100 dark:border-blue-600 shadow-sm hover:shadow-md transition-all duration-300">
    <div
      class="mr-1 flex size-10 aspect-square items-center justify-center rounded-full bg-blue-100 dark:bg-blue-700 text-center text-2xl sm:mr-3"
    >
      🧠
    </div>

    <div class="flex max-w-3xl items-center">
      <pre
        class="whitespace-pre-wrap rounded-md border border-blue-200 bg-blue-50 p-4 text-sm leading-tight text-blue-900 dark:border-blue-500 dark:bg-blue-900/95 dark:text-blue-50"
      >{{ message.content }}</pre>
    </div>
  </div>
</template>
