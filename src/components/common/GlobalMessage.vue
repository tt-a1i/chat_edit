<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { onMounted } from 'vue'

const message = useMessage()

onMounted(() => {
  window.$message = message
})
</script>

<template>
  <div style="display: none;" />
</template>
