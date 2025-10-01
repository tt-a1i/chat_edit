<script setup lang="ts">
import { useChatStore } from '@/stores'
import { logger } from '@/utils/logger'
import { showError } from '@/utils/toast'

const chatStore = useChatStore()
const { importChats } = chatStore

const uploadChats = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files) return
  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = function (e) {
    if (!e.target?.result) return
    try {
      const jsonData = JSON.parse(e.target.result as string)
      importChats(jsonData)
    }
    catch (error) {
      logger.error('解析导入文件失败', error)
      showError('导入失败：文件格式不正确')
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <label class="cursor-pointer">
    <slot />
    <input class="sr-only" type="file" @change="uploadChats">
  </label>
</template>
