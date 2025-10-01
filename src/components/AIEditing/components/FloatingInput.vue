<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  isGenerating?: boolean
}>()

const emit = defineEmits<{
  (e: 'send', prompt: string): void
  (e: 'abort'): void
}>()

const promptInput = ref<HTMLTextAreaElement>()
const promptValue = ref('')

/**
 * 自动调整文本框高度
 */
function autoResize(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  if (textarea.value.includes('\n')) {
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  } else {
    textarea.style.height = '2.5rem'
  }
}

/**
 * 处理键盘事件
 */
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    sendPrompt()
  }
}

/**
 * 发送提示词
 */
function sendPrompt() {
  const value = promptInput.value?.value || ''
  if (value.trim()) {
    emit('send', value)
    if (promptInput.value) {
      promptInput.value.value = ''
      promptInput.value.style.height = '2.5rem'
    }
  }
}

/**
 * 中止生成
 */
function abort() {
  emit('abort')
}

// 暴露方法供父组件调用
defineExpose({
  promptInput,
  sendPrompt,
})
</script>

<template>
  <div id="floatingInput" class="floating-input" tabindex="0">
    <div class="input-container">
      <textarea
        id="promptInput"
        ref="promptInput"
        v-model="promptValue"
        placeholder="请输入内容"
        rows="1"
        @input="autoResize"
        @keydown="handleKeydown"
      />
      <button
        id="sendBtn"
        class="send-btn"
        :class="{ loading: isGenerating }"
        @click="isGenerating ? abort() : sendPrompt()"
      >
        <i v-if="!isGenerating" class="fas fa-paper-plane send-icon" />
        <i v-else class="fas fa-stop send-icon" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.floating-input {
  position: absolute;
  z-index: 1000;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 8px;
  min-width: 300px;
  display: none;
}

.input-container {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

#promptInput {
  flex: 1;
  min-height: 2.5rem;
  max-height: 160px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  resize: none;
  font-family: inherit;
  line-height: 1.5;
  overflow-y: auto;
}

#promptInput:focus {
  outline: none;
  border-color: #4096ff;
}

.send-btn {
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: #4096ff;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.send-btn:hover {
  background: #1677ff;
}

.send-btn.loading {
  background: #ff4d4f;
}

.send-icon {
  font-size: 14px;
}
</style>
