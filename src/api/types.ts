import type { Message } from '@/services/database'
import type { APIMessage } from '@/types/api'

// 聊天相关接口
export interface ChatRequest {
  model: string
  messages?: Message[] | APIMessage[]
}

export interface ChatMessage {
  role: string
  content: string
}

export interface ChatCompletedResponse {
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

export interface ChatPartResponse {
  model: string
  created_at: string
  message: ChatMessage
  done: boolean
}

export type ChatResponse = ChatCompletedResponse | ChatPartResponse

// 模型管理相关接口
export interface CreateModelRequest {
  name: string
  path: string
}

export interface CreateModelResponse {
  status: string
}

export interface Model {
  name: string
  modified_at: string
  size: number
}

export interface ListLocalModelsResponse {
  models: Model[]
}

export interface ShowModelInformationRequest {
  name: string
}

export interface ShowModelInformationResponse {
  license: string
  modelfile: string
  parameters: string
  template: string
}

export interface CopyModelRequest {
  source: string
  destination: string
}

export interface CopyModelResponse {
  status: string
}

export interface DeleteModelRequest {
  model: string
}

export interface DeleteModelResponse {
  status: string
}

export interface PullModelRequest {
  name: string
  insecure?: boolean
}

export interface PullModelResponse {
  status: string
  digest: string
  total: number
}

export interface PushModelRequest {
  name: string
  insecure?: boolean
}

export interface PushModelResponse {
  status: string
}

// 嵌入向量相关接口
export interface GenerateEmbeddingsRequest {
  model: string
  prompt: string
  options?: Record<string, unknown>
}

export interface GenerateEmbeddingsResponse {
  embeddings: number[]
}
