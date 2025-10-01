import type {
  ChatPartResponse,
  ChatRequest,
  ChatResponse,
  CopyModelRequest,
  CopyModelResponse,
  CreateModelRequest,
  CreateModelResponse,
  DeleteModelRequest,
  DeleteModelResponse,
  GenerateEmbeddingsRequest,
  GenerateEmbeddingsResponse,
  ListLocalModelsResponse,
  PullModelRequest,
  PullModelResponse,
  PushModelRequest,
  PushModelResponse,
  ShowModelInformationRequest,
  ShowModelInformationResponse,
} from './types.ts'
import { useAppStore } from '@/stores'
import { toError } from '@/utils/error-handler'
import { logger } from '@/utils/logger'
import { ref } from 'vue'

export type {
  ChatCompletedResponse,
  ChatPartResponse,
  ChatResponse,
  Model,
} from './types.ts'

// 定义获取完整 API URL 的方法
export function getApiUrl(path: string): string {
  const appStore = useAppStore()
  return `${appStore.baseUrl}${path}`
}

// 定义获取请求头的方法
export function getHeaders(): Record<string, string> {
  const appStore = useAppStore()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${appStore.apiKey}`,
  }
}

// 创建中止控制器
function createAbortController() {
  const controller = ref<AbortController>(new AbortController())
  const signal = ref<AbortSignal>(controller.value.signal)

  const abort = () => {
    controller.value.abort()
    controller.value = new AbortController()
    signal.value = controller.value.signal
    logger.debug('请求已中止并重置控制器')
  }

  return { controller, signal, abort }
}

// 导出 API 钩子函数
export function useApi() {
  const error = ref<Error | null>(null)
  const { signal, abort } = createAbortController()

  // 聊天相关 API
  const chatApi = {
    // 生成聊天内容
    generateChat: async (
      request: ChatRequest,
      onDataReceived: (data: any) => void,
    ): Promise<ChatResponse[]> => {
      try {
        const messages = request.messages?.map(msg => ({
          role: msg.role,
          content: msg.content,
        })) || []

        const response = await fetch(getApiUrl('/v1/chat/completions'), {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            model: request.model,
            messages,
            stream: true,
            temperature: 0.3,
          }),
          signal: signal.value,
        })

        if (!response.ok) {
          throw new Error(`网络响应错误: ${response.status}`)
        }

        return await processStreamResponse(response, request.model, onDataReceived)
      } catch (err) {
        logger.error('生成聊天内容时出错', err)
        error.value = toError(err)
        return []
      }
    },
  }

  // 模型管理 API
  const modelApi = {
    // 创建模型
    createModel: async (
      request: CreateModelRequest,
    ): Promise<CreateModelResponse> => {
      try {
        const response = await fetch(getApiUrl('/create'), {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          throw new Error(`创建模型失败: ${response.status}`)
        }

        return await response.json()
      } catch (err) {
        logger.error('创建模型时出错', err)
        error.value = toError(err)
        throw err
      }
    },

    // 列出本地模型
    listLocalModels: async (): Promise<ListLocalModelsResponse> => {
      try {
        const response = await fetch(getApiUrl('/v1/models'), {
          method: 'GET',
          headers: getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`获取模型列表失败: ${response.status}`)
        }

        const data = await response.json()

        return {
          models: (data.data || []).map((model: any) => ({
            name: model.id,
            modified_at: new Date().toISOString(),
            size: 0,
          })),
        }
      } catch (err) {
        logger.error('获取模型列表时出错', err)
        error.value = toError(err)
        // 返回默认模型列表以防止完全失败
        return {
          models: [
            {
              name: 'moonshot-v1-8k',
              modified_at: new Date().toISOString(),
              size: 0,
            },
            {
              name: 'moonshot-v1-32k',
              modified_at: new Date().toISOString(),
              size: 0,
            },
          ],
        }
      }
    },

    // 显示模型信息
    showModelInformation: async (
      request: ShowModelInformationRequest,
    ): Promise<ShowModelInformationResponse> => {
      try {
        const response = await fetch(getApiUrl('/show'), {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          throw new Error(`获取模型信息失败: ${response.status}`)
        }

        return await response.json()
      } catch (err) {
        logger.error('获取模型信息时出错', err)
        error.value = toError(err)
        throw err
      }
    },

    // 复制模型
    copyModel: async (request: CopyModelRequest): Promise<CopyModelResponse> => {
      try {
        const response = await fetch(getApiUrl('/copy'), {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          throw new Error(`复制模型失败: ${response.status}`)
        }

        return await response.json()
      } catch (err) {
        logger.error('复制模型时出错', err)
        error.value = toError(err)
        throw err
      }
    },

    // 删除模型
    deleteModel: async (
      request: DeleteModelRequest,
    ): Promise<DeleteModelResponse> => {
      try {
        const response = await fetch(getApiUrl('/delete'), {
          method: 'DELETE',
          headers: getHeaders(),
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          throw new Error(`删除模型失败: ${response.status}`)
        }

        return await response.json()
      } catch (err) {
        logger.error('删除模型时出错', err)
        error.value = toError(err)
        throw err
      }
    },

    // 下载模型
    pullModel: async (request: PullModelRequest): Promise<PullModelResponse> => {
      try {
        const response = await fetch(getApiUrl('/pull'), {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          throw new Error(`下载模型失败: ${response.status}`)
        }

        return await response.json()
      } catch (err) {
        logger.error('下载模型时出错', err)
        error.value = toError(err)
        throw err
      }
    },

    // 上传模型
    pushModel: async (request: PushModelRequest): Promise<PushModelResponse> => {
      try {
        const response = await fetch(getApiUrl('/push'), {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          throw new Error(`上传模型失败: ${response.status}`)
        }

        return await response.json()
      } catch (err) {
        logger.error('上传模型时出错', err)
        error.value = toError(err)
        throw err
      }
    },
  }

  // 嵌入式 API
  const embeddingsApi = {
    // 生成嵌入向量
    generateEmbeddings: async (
      request: GenerateEmbeddingsRequest,
    ): Promise<GenerateEmbeddingsResponse> => {
      try {
        const response = await fetch(getApiUrl('/embeddings'), {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(request),
        })

        if (!response.ok) {
          throw new Error(`生成嵌入向量失败: ${response.status}`)
        }

        return await response.json()
      } catch (err) {
        logger.error('生成嵌入向量时出错', err)
        error.value = toError(err)
        throw err
      }
    },
  }

  // 处理流式响应的工具函数
  async function processStreamResponse(
    response: Response,
    modelName: string,
    onDataReceived: (data: any) => void,
  ): Promise<ChatResponse[]> {
    const reader = response.body?.getReader()
    const results: ChatResponse[] = []

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6).trim()

              // 处理特殊的[DONE]消息
              if (data === '[DONE]') {
                const completedResponse = {
                  model: modelName,
                  created_at: new Date().toISOString(),
                  message: {
                    role: 'assistant',
                    content: '',
                  },
                  done: true,
                }
                onDataReceived(completedResponse)
                continue
              }

              const json = JSON.parse(data)
              if (json.choices?.[0]?.delta?.content) {
                const partialResponse: ChatPartResponse = {
                  model: modelName,
                  created_at: new Date().toISOString(),
                  message: {
                    role: 'assistant',
                    content: json.choices[0].delta.content,
                  },
                  done: false,
                }
                onDataReceived(partialResponse)
                results.push(partialResponse)
              }

              // 处理结束消息
              if (json.choices?.[0]?.finish_reason === 'stop') {
                const completedResponse = {
                  model: modelName,
                  created_at: new Date().toISOString(),
                  message: {
                    role: 'assistant',
                    content: '',
                  },
                  done: true,
                }
                onDataReceived(completedResponse)
              }
            } catch (e) {
              logger.error('解析 SSE 消息失败', e, { line, model: modelName })
            }
          }
        }
      }
    }

    return results
  }

  return {
    error,
    ...chatApi,
    ...modelApi,
    ...embeddingsApi,
    abort,
  }
}
