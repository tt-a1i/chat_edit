<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue'
import { useAppStore, useChatStore } from '@/stores'
import ChatEmptyState from './ChatEmptyState.vue'
import ChatMessage from './ChatMessage.vue'

const appStore = useAppStore()
const chatStore = useChatStore()
const { showSystem } = storeToRefs(appStore)
const { messages } = storeToRefs(chatStore)
const chatElement = ref<HTMLElement>()
const userInterferedWithScroll = ref(false)

function isAtBottom() {
  if (!chatElement.value) {
    return false
  }

  const { scrollTop, scrollHeight, clientHeight } = chatElement.value
  return scrollHeight - scrollTop <= clientHeight + 10 // 10 is a small threshold
}

function handleUserScroll() {
  userInterferedWithScroll.value = !isAtBottom()
}

function scrollToBottom() {
  if (userInterferedWithScroll.value) {
    return
  }

  nextTick(() => {
    if (chatElement.value) {
      chatElement.value.scrollTop = chatElement.value.scrollHeight
    }
  })
}

onMounted(() => {
  scrollToBottom()
  chatElement.value?.addEventListener('scroll', handleUserScroll)
})

onUpdated(() => scrollToBottom())

watch(messages, () => {
  if (isAtBottom()) {
    userInterferedWithScroll.value = false
  }
})

onUnmounted(() => chatElement.value?.removeEventListener('scroll', handleUserScroll))

const visibleMessages = computed(() =>
  showSystem.value ? messages?.value : messages?.value.filter(m => m.role !== 'system'),
)

// Ensure we scroll during streaming
const streamingMessageId = computed(() => {
  const lastMessage = visibleMessages.value[visibleMessages.value.length - 1]
  if (lastMessage?.isStreaming) {
    return lastMessage.id
  }
  return null
})

// 获取最后一条 AI 消息的 ID
const lastAiMessageId = computed(() => {
  const aiMessages = visibleMessages.value.filter(m => m.role === 'assistant')
  const lastAiMessage = aiMessages[aiMessages.length - 1]
  return lastAiMessage?.id || null
})
</script>

<template>
  <div
    ref="chatElement"
    class="flex-1 overflow-y-auto scroll-smooth chat-messages-container w-full"
  >
    <!-- 内容容器 - 居中且有最大宽度 -->
    <div
      class="mx-auto max-w-7xl text-sm leading-6 text-gray-900 dark:text-gray-100 sm:text-base sm:leading-7"
      :class="visibleMessages.length > 0 ? 'p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6' : ''"
    >
      <!-- 空状态 -->
      <ChatEmptyState v-if="visibleMessages.length === 0" />

      <!-- 消息列表 -->
      <ChatMessage
        v-for="message in visibleMessages"
        :key="message.id"
        :message="message"
        :is-streaming="message.id === streamingMessageId"
        :is-last-ai-message="message.id === lastAiMessageId"
      />
    </div>
  </div>
</template>

<style scoped>
/* macOS 风格滚动条 - 默认隐藏，悬停/滚动时显示 */
.chat-messages-container {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.3s ease;
}

.chat-messages-container:hover {
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

/* Webkit 滚动条 */
.chat-messages-container::-webkit-scrollbar {
  width: 0px;
  transition: width 0.3s ease;
}

.chat-messages-container:hover::-webkit-scrollbar {
  width: 6px;
}

.chat-messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages-container::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 20px;
  transition: background-color 0.3s ease;
}

.chat-messages-container:hover::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
}

.chat-messages-container:hover::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}

/* 暗色模式 */
.dark .chat-messages-container:hover {
  scrollbar-color: rgba(156, 163, 175, 0.4) transparent;
}

.dark .chat-messages-container:hover::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.4);
}

.dark .chat-messages-container:hover::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.6);
}

/* 动画优化 */
@media (prefers-reduced-motion: no-preference) {
  .dark .animate-pulse {
    animation: darkPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
}

@keyframes darkPulse {
  0%, 100% {
    opacity: 0.85;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
