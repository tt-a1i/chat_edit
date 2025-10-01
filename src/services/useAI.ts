import type {
  ChatCompletedResponse,
  ChatPartResponse,
  ChatResponse,
  Model,
} from '../api/api.ts'
import type { Message } from './database'
import { ref } from 'vue'
import { useApi } from '../api/api.ts'

type ChatRole = 'user' | 'assistant' | 'system'

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
    const chatHistory = messages.slice(-(historyMessageLength ?? 0))
    if (system) {
      chatHistory.unshift(system)
    }

    interface APIMessage {
      role: ChatRole
      content: string | any[]
    }

    const apiMessages: APIMessage[] = chatHistory.map((msg): APIMessage => {
      if (msg.role === 'user' && msg.imageUrl) {
        const contentPayload: any[] = [
          {
            type: 'image_url',
            image_url: { url: msg.imageUrl },
          },
          {
            type: 'text',
            text: msg.content || '', // Ensure text part is always present, even if empty
          },
        ]
        return {
          role: msg.role,
          content: contentPayload,
        }
      }
      return {
        role: msg.role,
        content: msg.content,
      }
    })

    await generateChat({ model, messages: apiMessages as any }, (data: ChatResponse) => {
      if (!data.done && onMessage) {
        onMessage(data as ChatPartResponse)
      } else if (data.done && onDone) {
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
