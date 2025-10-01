import {
  EventStreamContentType,
  fetchEventSource,
} from '@microsoft/fetch-event-source'
import { ref } from 'vue'
import { getApiUrl, getHeaders } from '../../api/api'
import type { ChatResponse } from '@/types/ai-editing'

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
        console.error('处理消息失败:', err)
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

/**
 * 保存草稿内容到服务器
 * @param sessionId 会话ID
 * @param content 草稿内容
 */
/* export async function saveDraft(sessionId: string, content: string): Promise<void> {
  try {
    const token = useAuthStore().accessToken
    const response = await fetch(`/api/session/${sessionId}/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': useAppStore().acceptLanguage,
      },
      body: JSON.stringify({ text: content }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save draft: ${response.statusText}`)
    }
  }
  catch (error) {
    console.error('Error saving draft:', error)
    throw error
  }
} */

/**
 * 从服务器获取草稿内容
 * @param sessionId 会话ID
 * @returns 草稿内容
 */
/* export async function loadDraft(sessionId: string): Promise<string | null> {
  try {
    const token = useAuthStore().accessToken
    const response = await fetch(`/api/session/${sessionId}/draft`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': useAppStore().acceptLanguage,
      },
    })

    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.log(`Failed to fetch draft: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data?.text || null
  }
  catch (error) {
    console.error('Error loading draft:', error)
    return null
  }
} */

// 添加生成标题的API方法
/* export function generateSessionTitle(sessionId: string) {
  return http({
    url: '/api/chat/gen_title',
    method: 'GET',
    params: { session_id: sessionId },
  })
} */
// 保存提示词到服务器
/* export async function saveSessionPrompt(
  sessionId: string,
  template: string,
): Promise<any> {
  try {
    const token = useAuthStore().accessToken
    const response = await fetch(`/api/session/${sessionId}/prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': useAppStore().acceptLanguage,
      },
      body: JSON.stringify({
        name: template,
        template,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to save prompt: ${response.statusText}`)
    }

    return await response.json()
  }
  catch (error) {
    console.error('Error saving prompt:', error)
    throw error
  }
} */

// 删除提示词
/* export async function deleteSessionPrompt(
  sessionId: string,
  promptId: string,
): Promise<any> {
  try {
    const token = useAuthStore().accessToken
    const response = await fetch(`/api/session/${sessionId}/prompts/${promptId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': useAppStore().acceptLanguage,
      },
    })

    if (!response.ok) {
      throw new Error(`删除提示词失败: ${response.statusText}`)
    }

    return await response.json()
  }
  catch (error) {
    console.error('删除提示词失败:', error)
    throw error
  }
} */
// 更新提示词
/* export async function updateSessionPrompt(
  sessionId: string,
  promptId: string,
  template: string,
): Promise<any> {
  try {
    const token = useAuthStore().accessToken
    const response = await fetch(`/api/session/${sessionId}/prompts/${promptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': useAppStore().acceptLanguage,
      },
      body: JSON.stringify({
        name: template,
        template,
      }),
    })

    if (!response.ok) {
      throw new Error(`更新提示词失败: ${response.statusText}`)
    }

    return await response.json()
  }
  catch (error) {
    console.error('更新提示词失败:', error)
    throw error
  }
} */

// 更新提示词排序
/* export async function updatePromptsOrder(
  sessionId: string,
  ordering: string[],
): Promise<any> {
  try {
    const token = useAuthStore().accessToken
    const response = await fetch(`/api/session/${sessionId}/prompts/ordering`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': useAppStore().acceptLanguage,
      },
      body: JSON.stringify({
        ordering,
      }),
    })

    if (!response.ok) {
      throw new Error(`更新提示词排序失败: ${response.statusText}`)
    }

    return await response.json()
  }
  catch (error) {
    console.error('更新提示词排序失败:', error)
    throw error
  }
} */
/* export function getEditingSessionInitData() {
return {
  title: '',
  type: Session.Type.AIEditing,
  status: Session.Status.Active,
  option: {
    opType: 'draft_editing',
  },
  ext: {},
}
} */

/* export async function getSessionPrompts(
  sessionId: string,
): Promise<PromptHistory[]> {
  try {
    const token = useAuthStore().accessToken
    const response = await fetch(`/api/session/${sessionId}/prompts`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept-Language': useAppStore().acceptLanguage,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch prompts: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data as PromptHistory[]
  }
  catch (error) {
    console.error('Error fetching session prompts:', error)
    throw error
  }
} */
