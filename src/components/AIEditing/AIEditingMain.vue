<script setup lang="ts">
import ModelSelector from '../ModelSelector.vue'
import NavHeader from '../NavHeader.vue'
// @ts-ignore - No type declaration available for large component
import AIEditingComponent from './index.vue'
</script>

<template>
  <div class="flex h-full w-full flex-col">
    <NavHeader title="AI Editing">
      <template #actions>
        <ModelSelector />
      </template>
    </NavHeader>

    <div class="flex flex-1 overflow-hidden">
      <!-- Main content area for AI Editing -->
      <div class="w-full h-full p-4">
        <AIEditingComponent />
      </div>
    </div>
  </div>
</template>
