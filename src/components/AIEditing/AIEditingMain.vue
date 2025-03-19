<script setup lang="ts">
import { ref } from 'vue'
import { useAI } from '../../services/useAI.ts'
import ModelSelector from '../ModelSelector.vue'
import NavHeader from '../NavHeader.vue'
import AIEditingSidebar from './AIEditingSidebar.vue'
import AIEditingWorkspace from './AIEditingWorkspace.vue'

const { currentModel } = useAI()
const selectedSection = ref('code-editing')
</script>

<template>
  <div class="flex h-full w-full flex-col">
    <NavHeader title="AI Editing">
      <template #actions>
        <ModelSelector />
      </template>
    </NavHeader>

    <div class="flex flex-1 overflow-hidden">
      <AIEditingSidebar v-model:selectedSection="selectedSection" />
      <AIEditingWorkspace :section="selectedSection" />
    </div>
  </div>
</template>
