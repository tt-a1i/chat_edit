<script setup lang="ts">
import type { Message } from '../services/database.ts'
import AiMessage from './Messages/AiMessage.vue'
import SystemMessage from './Messages/SystemMessage.vue'
import UserMessage from './Messages/UserMessage.vue'

interface Props {
  message: Message
  isStreaming?: boolean
}

const { message, isStreaming = false } = defineProps<Props>()
</script>

<template>
  <SystemMessage v-if="message.role === 'system'" :message="message" />
  <UserMessage v-if="message.role === 'user'" :message="message" />
  <AiMessage v-if="message.role === 'assistant'" :message="message" :is-streaming="isStreaming" />
</template>
