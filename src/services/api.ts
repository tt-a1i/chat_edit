import { ref } from 'vue'
import { baseUrl, apiKey } from './appConfig.ts'
import { Message } from './database.ts'

export type ChatRequest = {
  model: string
  messages?: Message[]
}

export type ChatMessage = {
  role: string
  content: string
}

export type ChatCompletedResponse = {
  model: string
  created_at: string
  message: ChatMessage
  done: boolean
  total_duration: number
  load_duration: number
  prompt_eval_count: number
  prompt_eval_duration: number
  eval_count: number
  eval_duration: number
}

export type ChatPartResponse = {
  model: string
  created_at: string
  message: ChatMessage
  done: boolean
}

export type ChatResponse = ChatCompletedResponse | ChatPartResponse

export type CreateModelRequest = {
  name: string
  path: string
}

export type CreateModelResponse = {
  status: string
}

export type Model = {
  name: string
  modified_at: string
  size: number
}
export type ListLocalModelsResponse = {
  models: Model[]
}

export type ShowModelInformationRequest = {
  name: string
}

export type ShowModelInformationResponse = {
  license: string
  modelfile: string
  parameters: string
  template: string
}

export type CopyModelRequest = {
  source: string
  destination: string
}

export type CopyModelResponse = {
  status: string
}

export type DeleteModelRequest = {
  model: string
}

export type DeleteModelResponse = {
  status: string
}

export type PullModelRequest = {
  name: string
  insecure?: boolean
}

export type PullModelResponse = {
  status: string
  digest: string
  total: number
}

export type PushModelRequest = {
  name: string
  insecure?: boolean
}

export type PushModelResponse = {
  status: string
}

export type GenerateEmbeddingsRequest = {
  model: string
  prompt: string
  options?: Record<string, any>
}

export type GenerateEmbeddingsResponse = {
  embeddings: number[]
}

// Define a method to get the full API URL for a given path
const getApiUrl = (path: string) => `${baseUrl.value}${path}`

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${apiKey.value}`
})

const abortController = ref<AbortController>(new AbortController())
const signal = ref<AbortSignal>(abortController.value.signal)
// Define the API client functions
export const useApi = () => {
  const error = ref(null)

  const generateChat = async (
    request: ChatRequest,
    onDataReceived: (data: any) => void,
  ): Promise<any[]> => {
    const messages = request.messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || []

    const response = await fetch(getApiUrl('/v1/chat/completions'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        model: request.model,
        messages: messages,
        stream: true,
        temperature: 0.3
      }),
      signal: signal.value
    })

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`)
    }

    const reader = response.body?.getReader()
    let results: ChatResponse[] = []

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6).trim()
              
              // 处理特殊的[DONE]消息
              if (data === '[DONE]') {
                const completedResponse = {
                  model: request.model,
                  created_at: new Date().toISOString(),
                  message: {
                    role: 'assistant',
                    content: ''
                  },
                  done: true
                }
                onDataReceived(completedResponse)
                continue
              }

              const json = JSON.parse(data)
              if (json.choices?.[0]?.delta?.content) {
                const partialResponse = {
                  model: request.model,
                  created_at: new Date().toISOString(),
                  message: {
                    role: 'assistant',
                    content: json.choices[0].delta.content
                  },
                  done: false
                }
                onDataReceived(partialResponse)
                results.push(partialResponse)
              }

              // 处理结束消息
              if (json.choices?.[0]?.finish_reason === 'stop') {
                const completedResponse = {
                  model: request.model,
                  created_at: new Date().toISOString(),
                  message: {
                    role: 'assistant',
                    content: ''
                  },
                  done: true
                }
                onDataReceived(completedResponse)
              }
            } catch (e) {
              console.error('Failed to parse SSE message:', e)
            }
          }
        }
      }
    }

    return results
  }

  // Create a model
  const createModel = async (
    request: CreateModelRequest,
  ): Promise<CreateModelResponse> => {
    const response = await fetch(getApiUrl('/create'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    })

    return await response.json()
  }

  // List local models
  const listLocalModels = async (): Promise<ListLocalModelsResponse> => {
    try {
      const response = await fetch(getApiUrl('/v1/models'), {
        method: 'GET',
        headers: getHeaders(),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        models: (data.data || []).map((model: any) => ({
          name: model.id,
          modified_at: new Date().toISOString(),
          size: 0
        }))
      }
    } catch (error) {
      console.error('Error fetching models:', error)
      // 返回一些默认模型以防止完全失败
      return {
        models: [
          {
            name: 'moonshot-v1-8k',
            modified_at: new Date().toISOString(),
            size: 0
          },
          {
            name: 'moonshot-v1-32k',
            modified_at: new Date().toISOString(),
            size: 0
          }
        ]
      }
    }
  }

  // Show model information
  const showModelInformation = async (
    request: ShowModelInformationRequest,
  ): Promise<ShowModelInformationResponse> => {
    const response = await fetch(getApiUrl('/show'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    })

    return await response.json()
  }

  // Copy a model
  const copyModel = async (request: CopyModelRequest): Promise<CopyModelResponse> => {
    const response = await fetch(getApiUrl('/copy'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    })

    return await response.json()
  }

  // Delete a model
  const deleteModel = async (
    request: DeleteModelRequest,
  ): Promise<DeleteModelResponse> => {
    const response = await fetch(getApiUrl('/delete'), {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify(request),
    })

    return await response.json()
  }

  // Pull a model
  const pullModel = async (request: PullModelRequest): Promise<PullModelResponse> => {
    const response = await fetch(getApiUrl('/pull'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    })
    return await response.json()
  }

  // Push a model
  const pushModel = async (request: PushModelRequest): Promise<PushModelResponse> => {
    const response = await fetch(getApiUrl('/push'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    })

    return await response.json()
  }

  // Generate embeddings
  const generateEmbeddings = async (
    request: GenerateEmbeddingsRequest,
  ): Promise<GenerateEmbeddingsResponse> => {
    const response = await fetch(getApiUrl('/embeddings'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    })

    return await response.json()
  }
  const abort = () => {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = new AbortController()
      signal.value = abortController.value.signal
      console.log('Fetch request aborted and controller reset')
    }
  }

  return {
    error,
    generateChat,
    createModel,
    listLocalModels,
    showModelInformation,
    copyModel,
    deleteModel,
    pullModel,
    pushModel,
    generateEmbeddings,
    abort,
  }
}
