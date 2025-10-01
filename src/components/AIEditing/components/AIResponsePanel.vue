<script setup lang="ts">
defineProps<{
  isTranslationPrompt?: boolean
}>()

const emit = defineEmits<{
  (e: 'insertAfter'): void
  (e: 'replace'): void
  (e: 'compare'): void
  (e: 'regenerate'): void
  (e: 'copy'): void
}>()
</script>

<template>
  <div id="aiResponse" class="ai-response">
    <div class="response-content" />
    <div id="actionButtons" class="action-buttons">
      <div class="left-buttons">
        <button id="insertAfter" @click="emit('insertAfter')">
          <i class="fas fa-plus" />
          插入到后面
        </button>
        <button id="replace" @click="emit('replace')">
          <i class="fas fa-exchange-alt" />
          替换内容
        </button>
        <button
          v-show="!isTranslationPrompt"
          id="compare"
          @click="emit('compare')"
        >
          <i class="fas fa-code-compare" />
          原文对比
        </button>
      </div>
      <div class="right-buttons">
        <button id="aiResponseRegenerateBtn" @click="emit('regenerate')">
          <i class="fas fa-sync-alt" />
          重新生成
        </button>
        <button id="aiResponseCopyBtn" @click="emit('copy')">
          <i class="fas fa-copy" />
          复制
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-response {
  position: absolute;
  z-index: 1001;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  min-width: 400px;
  max-width: 600px;
  display: none;
}

.response-content {
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  max-height: 300px;
  overflow-y: auto;
}

.response-content.loading {
  color: #999;
  font-style: italic;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.left-buttons,
.right-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons button {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.action-buttons button:hover {
  border-color: #4096ff;
  color: #4096ff;
}

.action-buttons button i {
  font-size: 12px;
}
</style>
