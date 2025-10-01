<script setup lang="ts">
import CodeEditing from './sections/CodeEditing.vue'
import DocumentEditing from './sections/DocumentEditing.vue'
import ImageEditing from './sections/ImageEditing.vue'
import CommandGeneration from './sections/CommandGeneration.vue'

defineProps({
  section: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="flex-1 overflow-auto p-6">
    <CodeEditing v-if="section === 'code-editing'" />
    <DocumentEditing v-else-if="section === 'document-editing'" />
    <ImageEditing v-else-if="section === 'image-editing'" />
    <CommandGeneration v-else-if="section === 'command-generation'" />
    <div v-else class="flex h-full items-center justify-center">
      <p class="text-gray-500 dark:text-gray-400">Select a section from the sidebar</p>
    </div>
  </div>
</template>
