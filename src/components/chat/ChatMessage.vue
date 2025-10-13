<script setup lang="ts">
import type { Message } from '@/services/database.ts'
import AiMessage from './messages/AiMessage.vue'
import SystemMessage from './messages/SystemMessage.vue'
import UserMessage from './messages/UserMessage.vue'

interface Props {
  message: Message
  isStreaming?: boolean
  isLastAiMessage?: boolean
}

const { message, isStreaming = false, isLastAiMessage = false } = defineProps<Props>()
</script>

<template>
  <SystemMessage v-if="message.role === 'system'" :message="message" />
  <UserMessage v-if="message.role === 'user'" :message="message" />
  <AiMessage v-if="message.role === 'assistant'" :message="message" :is-streaming="isStreaming" :is-last-message="isLastAiMessage" />
</template>
