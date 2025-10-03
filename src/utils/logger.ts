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
   * TODO(priority:low): 集成错误监控服务
   * 未来可以集成以下服务之一：
   * - Sentry (https://sentry.io) - 推荐用于生产环境
   * - LogRocket (https://logrocket.com) - 包含会话回放功能
   * - Rollbar (https://rollbar.com) - 轻量级选择
   *
   * 实施时需要：
   * 1. 选择并配置监控服务
   * 2. 添加环境变量配置 (VITE_SENTRY_DSN)
   * 3. 在此处添加错误上报逻辑
   * 4. 在 vite.config.ts 中配置 source map 上传
   */
  private reportError(_message: string, _error?: unknown, _context?: Record<string, unknown>) {
    // 预留接口，当前仅记录到控制台
    // 生产环境应该集成专业的错误监控服务
    // 示例代码：
    // if (import.meta.env.PROD && window.Sentry) {
    //   Sentry.captureException(_error, {
    //     extra: { message: _message, context: _context }
    //   })
    // }
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
