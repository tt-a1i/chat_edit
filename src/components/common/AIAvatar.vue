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
    class="ai-avatar flex flex-shrink-0 items-center justify-center rounded-full"
    :style="{
      width: avatarSize,
      height: avatarSize,
      background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 50%, #0d9488 100%)',
      boxShadow: '0 2px 8px -1px rgba(20, 184, 166, 0.4), 0 4px 16px -2px rgba(13, 148, 136, 0.2)',
    }"
  >
    <IconSparkles :size="iconSize" class="text-white drop-shadow-sm" stroke-width="2.5" />
  </div>

  <!-- 简约版 AI 头像 -->
  <div
    v-else-if="variant === 'minimal'"
    class="ai-avatar flex flex-shrink-0 items-center justify-center rounded-full border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-emerald-50 shadow-sm dark:border-teal-700 dark:from-teal-900/30 dark:to-emerald-900/20"
    :style="{ width: avatarSize, height: avatarSize }"
  >
    <IconSparkles :size="iconSize" class="text-teal-600 dark:text-teal-400" stroke-width="2.5" />
  </div>

  <!-- 默认版 AI 头像（带外圈） -->
  <div
    v-else
    class="ai-avatar flex flex-shrink-0 items-center justify-center rounded-full ring-2 ring-white/80 dark:ring-gray-800/80"
    :style="{
      width: avatarSize,
      height: avatarSize,
      background: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 50%, #0d9488 100%)',
      boxShadow: '0 2px 8px -1px rgba(20, 184, 166, 0.4), 0 4px 16px -2px rgba(13, 148, 136, 0.2)',
    }"
  >
    <IconSparkles :size="iconSize" class="text-white drop-shadow-sm" stroke-width="2.5" />
  </div>
</template>

<style scoped>
.ai-avatar {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ai-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.4);
}
</style>
