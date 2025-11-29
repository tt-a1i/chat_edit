import type { Message } from './database'
import type {
  ChatCompletedResponse,
  ChatPartResponse,
  ChatResponse,
} from '@/api/api'
import type { APIMessage, MultiModalContent } from '@/types/api'
import { useApi } from '@/api/api'

type ChatRole = 'user' | 'assistant' | 'system'

/**
 * AI 服务 - 简化版
 * 模型配置已移至环境变量 (env.ts)
 */
export function useAI() {
  const { generateChat } = useApi()

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

    const apiMessages: APIMessage[] = chatHistory.map((msg): APIMessage => {
      if (msg.role === 'user' && msg.imageUrl) {
        const contentPayload: MultiModalContent[] = [
          {
            type: 'image_url',
            image_url: { url: msg.imageUrl },
          },
          {
            type: 'text',
            text: msg.content || '',
          },
        ]
        return {
          role: msg.role as ChatRole,
          content: contentPayload,
        }
      }
      return {
        role: msg.role as ChatRole,
        content: msg.content,
      }
    })

    await generateChat({ model, messages: apiMessages }, (data: ChatResponse) => {
      if (!data.done && onMessage) {
        onMessage(data as ChatPartResponse)
      } else if (data.done && onDone) {
        onDone(data as ChatCompletedResponse)
      }
    })
  }

  return {
    generate,
  }
}
