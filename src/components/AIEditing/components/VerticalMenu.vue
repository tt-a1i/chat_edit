<script setup lang="ts">
interface Prompt {
  id: string
  name: string
  name_en: string
  template: string
  en_name: string
}

defineProps<{
  prompts: Prompt[]
  currentLanguage?: string
}>()

const emit = defineEmits<{
  (e: 'select', prompt: Prompt): void
}>()
</script>

<template>
  <div id="verticalMenu" class="vertical-menu" tabindex="0">
    <div class="menu-content system-prompts">
      <div
        v-for="prompt in prompts"
        :key="prompt.id"
        class="menu-item"
        :data-prompt-id="prompt.id"
        @click="emit('select', prompt)"
      >
        {{ prompt.en_name }}
        {{ currentLanguage === 'en-US' ? prompt.name_en : prompt.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.vertical-menu {
  position: absolute;
  z-index: 1000;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  max-height: 400px;
  overflow-y: auto;
  display: none;
}

.menu-content {
  padding: 4px;
}

.menu-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item:active {
  background: #e6f7ff;
}
</style>
