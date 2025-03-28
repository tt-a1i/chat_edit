import type {
  ChatCompletedResponse,
  ChatPartResponse,
  ChatResponse,
  Model,
} from '../api/api.ts'
import type { Message } from './database'

import { ref } from 'vue'
import {
  useApi,
} from '../api/api.ts'

// Define availableModels outside the function to ensure a shared state.
const availableModels = ref<Model[]>([])

export function useAI() {
  const { generateChat, listLocalModels } = useApi()
  const generate = async (
    model: string,
    messages: Message[],
    system?: Message,
    historyMessageLength?: number,
    onMessage?: (data: ChatResponse | ChatPartResponse | ChatCompletedResponse) => void,
    onDone?: (data: ChatCompletedResponse) => void,
  ) => {
    let chatHistory = messages.slice(-(historyMessageLength ?? 0))
    if (system) {
      chatHistory.unshift(system)
    }
    await generateChat({ model, messages: chatHistory }, (data: ChatResponse) => {
      if (!data.done && onMessage) {
        onMessage(data as ChatPartResponse)
      }
      else if (data.done && onDone) {
        onDone(data as ChatCompletedResponse)
      }
    })
  }

  const refreshModels = async () => {
    const response = await listLocalModels()
    availableModels.value = response.models
  }

  // Use toRefs to keep reactivity when destructuring in components.
  return {
    availableModels,
    generate,
    refreshModels,
  }
}
