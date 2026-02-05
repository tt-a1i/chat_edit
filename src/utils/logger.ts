/**
 * 统一日志工具
 * 提供日志记录、错误追踪、用户提示功能
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: unknown
  timestamp: Date
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 100 // 最多保留 100 条日志

  /**
   * 调试日志（仅开发环境）
   */
  debug(message: string, data?: unknown) {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${message}`, data)
      this.addLog('debug', message, data)
    }
  }

  /**
   * 信息日志
   */
  info(message: string, data?: unknown) {
    console.info(`[INFO] ${message}`, data)
    this.addLog('info', message, data)
  }

  /**
   * 警告日志
   */
  warn(message: string, data?: unknown) {
    console.warn(`[WARN] ${message}`, data)
    this.addLog('warn', message, data)
  }

  /**
   * 错误日志
   */
  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const errorStack = error && typeof error === 'object' && 'stack' in error
      ? (error as Error).stack
      : error

    const errorInfo = {
      message,
      error: errorStack || error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    console.error(`[ERROR] ${message}`, errorInfo)
    this.addLog('error', message, errorInfo)

    // 生产环境上报到错误监控服务
    if (import.meta.env.PROD) {
      this.reportError(message, error, context)
    }
  }

  /**
   * 添加日志到内存
   */
  private addLog(level: LogLevel, message: string, data?: unknown) {
    this.logs.push({
      level,
      message,
      data,
      timestamp: new Date(),
    })

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * 导出日志（用于调试）
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * 上报错误到监控服务（可扩展）
   *
   * 已预留接口用于集成错误监控服务（如 Sentry, LogRocket, Rollbar）。
   * 实施步骤：
   * 1. 配置 VITE_SENTRY_DSN 环境变量
   * 2. 在 main.ts 中初始化监控 SDK
   * 3. 在此处实现具体上报逻辑
   */
  private reportError(message: string, error?: unknown, context?: Record<string, unknown>) {
    // 自定义错误上报钩子
    if (typeof window.reportErrorToService === 'function') {
      window.reportErrorToService({ message, error, context })
    }
  }

  /**
   * 性能追踪
   */
  performance<T>(label: string, fn: () => T): T
  performance<T>(label: string, fn: () => Promise<T>): Promise<T>
  performance<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    const start = performance.now()
    const result = fn()

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start
        this.debug(`[PERF] ${label}: ${duration.toFixed(2)}ms`)
      }) as Promise<T>
    }

    const duration = performance.now() - start
    this.debug(`[PERF] ${label}: ${duration.toFixed(2)}ms`)
    return result
  }
}

// 导出单例
export const logger = new Logger()
