/**
 * 全局类型定义
 */

import type { MessageApiInjection } from 'naive-ui/es/message/src/MessageProvider'

declare global {
  interface Window {
    /**
     * Naive UI Message API
     * 用于全局消息提示
     */
    $message?: MessageApiInjection

    /**
     * Monaco Editor 环境配置
     */
    MonacoEnvironment?: {
      getWorkerUrl?: (moduleId: string, label: string) => string
    }
  }

  /**
   * HTTP 错误类型
   * 用于 fetch-event-source 错误处理
   */
  class HttpError extends Error {
    statusCode: number
    constructor(message: string, statusCode: number)
  }
}

export {}
