<script setup lang="ts">
import { useChats } from '../../services/chat.ts'

const { exportChats } = useChats()

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
