import type { ChatResponse } from '@/types/ai-editing'
import {
  EventStreamContentType,
  fetchEventSource,
} from '@microsoft/fetch-event-source'
import { ref } from 'vue'
import { getApiUrl, getHeaders } from '../../api/api'
import { logger } from '@/utils/logger'

/**
 * HTTP 错误类
 */
class HttpError extends Error {
  status: number
  statusText: string
  code?: string
  data?: any

  constructor(options: {
    status: number
    statusText: string
    code?: string
    message?: string
    data?: any
  }) {
    super(options.message || options.statusText)
    this.name = 'HttpError'
    this.status = options.status
    this.statusText = options.statusText
    this.code = options.code
    this.data = options.data
  }
}
export interface PromptHistory {
  id: string
  prompt: string
  timestamp: string
}
export interface ChatEditingRequest {
  session_id: string
  prompt: string
  selected_text: string
  model?: string
}
let lastMessageWasEmpty = false
// 创建abort controller和signal
const abortController = ref<AbortController>(new AbortController())
const signal = ref<AbortSignal>(abortController.value.signal)

/**
 * 使用流式方式进行AI编辑会话
 * @param prompt 用户提问
 * @param selected_text 选中的文本内容
 * @param callback 接收数据的回调函数
 * @param controller 可选的AbortController
 * @param model 可选的模型名称
 * @returns 返回对话响应
 */
export async function streamChat(
  prompt: string,
  selected_text: string,
  callback: (data: ChatResponse) => void,
  controller?: AbortController,
  model?: string,
): Promise<ChatResponse> {
  const data: ChatResponse = {
    content: '',
    done: false,
  }

  const _controller = controller || new AbortController()

  await fetchEventSource(getApiUrl('/v1/chat/completions'), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: 'moonshot-v1-32k',
      messages: [
        {
          role: 'user',
          content: `选中的文本内容: ${selected_text}， 用户提问: ${prompt}`,
        },
      ],
      stream: true,
      temperature: 0.3,
    }),
    signal: _controller.signal,
    openWhenHidden: true,

    async onopen(response) {
      if (
        response.ok
        && response.headers.get('content-type') === EventStreamContentType
      ) {
        return // 连接成功
      }
      const responseClone = response.clone()
      const errorData = await responseClone.json()

      // 处理限流错误的特殊情况
      if (response.status === 429 && errorData.rate_limit) {
        const timeSpace = errorData.rate_limit.window / 3600
        const shuffle = errorData.rate_limit.limit
        if (window.$message) {
          window.$message.error(`API 限流: ${timeSpace}小时内限制${shuffle}次请求`)
        }
      }
      if (response.headers.get('content-type')?.includes('application/json')) {
        const error = await response.json()
        throw new HttpError({
          status: response.status,
          statusText: response.statusText,
          code: error?.code,
          message: error?.message || response.statusText,
          data: error?.data,
        })
      }
      throw new Error(
        `Failed to open SSE connection: ${response.status} ${response.statusText}`,
      )
    },

    onmessage(msg) {
      try {
        // 处理完成信号
        if (msg.data === '[DONE]') {
          data.done = true
          callback({
            ...data,
            done: true,
          })
          _controller.abort()
          return
        }

        // 跳过特殊事件
        if (msg.event === 'meta' || msg.event === 'msg_id') {
          return
        }

        try {
          // 尝试解析JSON
          const jsonData = JSON.parse(msg.data)

          if (jsonData.choices && jsonData.choices[0]) {
            // 处理内容增量
            if (jsonData.choices[0].delta && jsonData.choices[0].delta.content) {
              const content = jsonData.choices[0].delta.content
              data.content += content
              callback({
                ...data,
                content: data.content,
              })
            }

            // 处理结束原因
            if (jsonData.choices[0].finish_reason === 'stop') {
              data.done = true
              callback({
                ...data,
                done: true,
              })
              _controller.abort()
            }
          }
        } catch (e) {
          // 如果不是JSON格式，按原始方式处理
          if (msg.data.trim() === '') {
            if (!lastMessageWasEmpty) {
              data.content += '\n' // 添加一个换行符
              lastMessageWasEmpty = true
            }
          } else {
            data.content += msg.data
            lastMessageWasEmpty = false
          }

          callback({
            ...data,
            content: data.content,
          })
        }
      } catch (err) {
        logger.error('处理消息失败:', err)
      }
    },

    onerror(err) {
      data.error = err.message
      callback(data)
      throw err // 停止重试
    },
  })

  return data
}
