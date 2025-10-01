<script setup lang="ts">
import { IconSparkles } from '@tabler/icons-vue'
import { computed } from 'vue'

interface Props {
  size?: number
  variant?: 'default' | 'gradient' | 'minimal'
}

const { size = 32, variant = 'gradient' } = defineProps<Props>()

const avatarSize = computed(() => `${size}px`)
const iconSize = computed(() => size * 0.6)
</script>

<template>
  <!-- 渐变圆形 AI 头像 -->
  <div
    v-if="variant === 'gradient'"
    class="ai-avatar flex flex-shrink-0 items-center justify-center rounded-full shadow-sm"
    :style="{
      width: avatarSize,
      height: avatarSize,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }"
  >
    <IconSparkles :size="iconSize" class="text-white" stroke-width="2.5" />
  </div>

  <!-- 简约版 AI 头像 -->
  <div
    v-else-if="variant === 'minimal'"
    class="ai-avatar flex flex-shrink-0 items-center justify-center rounded-full border-2 border-purple-300 bg-purple-50 shadow-sm dark:border-purple-700 dark:bg-purple-900/30"
    :style="{ width: avatarSize, height: avatarSize }"
  >
    <IconSparkles :size="iconSize" class="text-purple-600 dark:text-purple-400" stroke-width="2.5" />
  </div>

  <!-- 默认版 AI 头像（带外圈） -->
  <div
    v-else
    class="ai-avatar flex flex-shrink-0 items-center justify-center rounded-full shadow-sm ring-2 ring-white dark:ring-gray-700"
    :style="{
      width: avatarSize,
      height: avatarSize,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }"
  >
    <IconSparkles :size="iconSize" class="text-white" stroke-width="2.5" />
  </div>
</template>

<style scoped>
.ai-avatar {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ai-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>
