/**
 * 环境配置管理
 * 统一管理所有环境变量，提供类型安全的访问接口
 */

interface EnvConfig {
  // API 配置
  apiBaseUrl: string
  apiKey: string

  // 应用配置
  appTitle: string
  appDescription: string

  // 功能开关
  enableMarkdown: boolean
  showSystemMessages: boolean

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

/**
 * 导出环境配置对象
 */
export const env: EnvConfig = {
  // API 配置
  apiBaseUrl: getEnv('VITE_API_BASE_URL', 'https://api.moonshot.cn'),
  apiKey: getEnv('VITE_API_KEY', ''),

  // 应用配置
  appTitle: getEnv('VITE_APP_TITLE', 'Chat & Edit'),
  appDescription: getEnv('VITE_APP_DESCRIPTION', 'AI 聊天与编辑工具'),

  // 功能开关
  enableMarkdown: getBoolEnv('VITE_ENABLE_MARKDOWN', true),
  showSystemMessages: getBoolEnv('VITE_SHOW_SYSTEM_MESSAGES', true),

  // 开发模式
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
}

/**
 * 验证必需的环境变量
 */
export function validateEnv(): void {
  const missingKeys: string[] = []

  if (!env.apiKey) {
    missingKeys.push('VITE_API_KEY')
  }

  if (missingKeys.length > 0) {
    console.warn(
      '⚠️ 缺少必需的环境变量:',
      missingKeys.join(', '),
      '\n请在 .env.local 文件中配置',
    )
  }
}

// 在开发环境下自动验证
if (env.isDev) {
  validateEnv()
}
