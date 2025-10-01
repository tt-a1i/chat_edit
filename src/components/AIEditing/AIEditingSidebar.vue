<script setup lang="ts">
import { IconBrush, IconCode, IconFileText, IconTerminal } from '@tabler/icons-vue'

defineProps({
  selectedSection: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:selectedSection'])

const sections = [
  { id: 'code-editing', name: 'Code Editing', icon: IconCode },
  { id: 'document-editing', name: 'Document Editing', icon: IconFileText },
  { id: 'image-editing', name: 'Image Editing', icon: IconBrush },
  { id: 'command-generation', name: 'Command Generation', icon: IconTerminal },
]

const selectSection = (sectionId: string) => {
  emit('update:selectedSection', sectionId)
}
</script>

<template>
  <div class="w-64 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
    <div class="flex flex-col p-4">
      <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        AI Editing
      </h2>

      <div class="space-y-2">
        <button
          v-for="section in sections"
          :key="section.id"
          :class="{
            'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300': selectedSection === section.id,
            'hover:bg-gray-100 dark:hover:bg-gray-700': selectedSection !== section.id,
          }"
          class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors duration-200 dark:text-gray-200"
          @click="selectSection(section.id)"
        >
          <component :is="section.icon" class="h-5 w-5" />
          <span>{{ section.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
