<script setup lang="ts">
import { useChatStore } from '@/stores'

const chatStore = useChatStore()
const { exportChats } = chatStore

async function downloadChats() {
  const exportData = await exportChats()
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chats-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
</script>

<template>
  <button @click="downloadChats">
    <slot />
  </button>
</template>
