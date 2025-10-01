/**
 * API 相关类型定义
 */

/**
 * 多模态消息内容
 */
export interface MultiModalContent {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
  }
}

/**
 * API 消息格式
 */
export interface APIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | MultiModalContent[]
}

/**
 * 模型信息
 */
export interface ModelInfo {
  id: string
  object: string
  created: number
  owned_by: string
}

/**
 * 模型列表响应
 */
export interface ModelListResponse {
  data: ModelInfo[]
}

/**
 * 通用 API 响应包装器
 */
export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}
