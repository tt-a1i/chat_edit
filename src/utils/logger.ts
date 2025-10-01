/**
 * 统一日志工具
 * 提供日志记录、错误追踪、用户提示功能
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: Date
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 100 // 最多保留 100 条日志

  /**
   * 调试日志（仅开发环境）
   */
  debug(message: string, data?: any) {
    if (import.meta.env.DEV) {
      console.log(`[DEBUG] ${message}`, data)
      this.addLog('debug', message, data)
    }
  }

  /**
   * 信息日志
   */
  info(message: string, data?: any) {
    console.info(`[INFO] ${message}`, data)
    this.addLog('info', message, data)
  }

  /**
   * 警告日志
   */
  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data)
    this.addLog('warn', message, data)
  }

  /**
   * 错误日志
   */
  error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error)
    this.addLog('error', message, error)

    // 可选: 上报到错误监控服务
    // this.reportError(message, error)
  }

  /**
   * 添加日志到内存
   */
  private addLog(level: LogLevel, message: string, data?: any) {
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
   */
  private reportError(_message: string, _error?: any) {
    // TODO: 集成 Sentry 或其他监控服务
    // Sentry.captureException(_error, { extra: { _message } })
  }
}

// 导出单例
export const logger = new Logger()
