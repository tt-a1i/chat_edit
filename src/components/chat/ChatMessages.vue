<script setup lang="ts">
import { useAppStore, useChatStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onMounted, onUnmounted, onUpdated, ref, watch } from 'vue'
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
</script>

<template>
  <div
    ref="chatElement"
    class="flex-1 overflow-y-auto scroll-smooth text-sm leading-6 text-gray-900 dark:text-gray-100 sm:text-base sm:leading-7 chat-messages-container"
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
    />
  </div>
</template>

<style scoped>
.chat-messages-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.chat-messages-container::-webkit-scrollbar {
  width: 6px;
}

.chat-messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 20px;
}

.dark .chat-messages-container::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.7);
}

.dark .chat-messages-container {
  scrollbar-color: rgba(156, 163, 175, 0.7) transparent;
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
