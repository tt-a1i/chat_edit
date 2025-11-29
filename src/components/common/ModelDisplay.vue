<script setup lang="ts">
import { IconSparkles } from '@tabler/icons-vue'
import { env } from '@/config/env'

// 显示当前使用的模型名称（只读）
const modelName = env.model
</script>

<template>
  <div
    class="flex items-center gap-2 rounded-lg px-3 py-1.5
           bg-gradient-to-r from-gray-50 to-gray-100/80
           border border-gray-200/60
           dark:from-gray-800/60 dark:to-gray-700/40
           dark:border-gray-600/40"
  >
    <IconSparkles
      :size="16"
      class="text-teal-500 dark:text-teal-400"
    />
    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
      {{ modelName }}
    </span>
  </div>
</template>
