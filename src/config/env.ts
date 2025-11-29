/**
 * 环境配置管理
 * 统一管理所有环境变量，提供类型安全的访问接口
 */

import { logger } from '@/utils/logger'

interface EnvConfig {
  // 共享 API 配置
  apiBaseUrl: string
  apiKey: string
  model: string

  // AI Editing 专用配置（可选，留空则使用共享配置）
  aiEditingBaseUrl: string
  aiEditingApiKey: string
  aiEditingModel: string

  // 应用配置
  appTitle: string
  appDescription: string

  // 功能配置
  enableMarkdown: boolean
  showSystemMessages: boolean
  historyMessageLength: number

  // 开发模式
  isDev: boolean
  isProd: boolean
}

/**
 * 获取环境变量，提供默认值和类型转换
 */
function getEnv(key: string, defaultValue: string = ''): string {
  return import.meta.env[key] || defaultValue
}

function getBoolEnv(key: string, defaultValue: boolean = false): boolean {
  const value = import.meta.env[key]
  if (value === undefined || value === '') {
    return defaultValue
  }
  return value === 'true' || value === '1'
}

function getNumberEnv(key: string, defaultValue: number = 0): number {
  const value = import.meta.env[key]
  if (value === undefined || value === '') {
    return defaultValue
  }
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? defaultValue : parsed
}

/**
 * 导出环境配置对象
 */
export const env: EnvConfig = {
  // 共享 API 配置
  apiBaseUrl: getEnv('VITE_API_BASE_URL', 'https://api.moonshot.cn'),
  apiKey: getEnv('VITE_API_KEY', ''),
  model: getEnv('VITE_MODEL', 'moonshot-v1-8k'),

  // AI Editing 专用配置
  aiEditingBaseUrl: getEnv('VITE_AI_EDITING_BASE_URL', ''),
  aiEditingApiKey: getEnv('VITE_AI_EDITING_API_KEY', ''),
  aiEditingModel: getEnv('VITE_AI_EDITING_MODEL', ''),

  // 应用配置
  appTitle: getEnv('VITE_APP_TITLE', 'Chat & Edit'),
  appDescription: getEnv('VITE_APP_DESCRIPTION', 'AI 聊天与编辑工具'),

  // 功能配置
  enableMarkdown: getBoolEnv('VITE_ENABLE_MARKDOWN', true),
  showSystemMessages: getBoolEnv('VITE_SHOW_SYSTEM_MESSAGES', true),
  historyMessageLength: getNumberEnv('VITE_HISTORY_MESSAGE_LENGTH', 10),

  // 开发模式
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}

/**
 * 获取 Chat 场景配置
 */
export function getChatConfig() {
  return {
    baseUrl: env.apiBaseUrl,
    apiKey: env.apiKey,
    model: env.model,
  }
}

/**
 * 获取 AI Editing 场景配置（如果未设置专用配置，则回退到共享配置）
 */
export function getAIEditingConfig() {
  return {
    baseUrl: env.aiEditingBaseUrl || env.apiBaseUrl,
    apiKey: env.aiEditingApiKey || env.apiKey,
    model: env.aiEditingModel || env.model,
  }
}

/**
 * 验证必需的环境变量
 */
export function validateEnv(): void {
  const missingKeys: string[] = []

  if (!env.apiKey) {
    missingKeys.push('VITE_API_KEY')
  }

  if (!env.model) {
    missingKeys.push('VITE_MODEL')
  }

  if (missingKeys.length > 0) {
    logger.warn(
      '⚠️ 缺少必需的环境变量',
      {
        missing: missingKeys,
        message: '请在 .env.local 文件中配置',
      },
    )
  }
}

// 在开发环境下自动验证
if (env.isDev) {
  validateEnv()
}
