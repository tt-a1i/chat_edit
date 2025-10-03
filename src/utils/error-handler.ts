/**
 * 统一的错误处理模块
 * 合并了 error.ts 和 errors.ts 的功能
 */

/**
 * 错误码枚举
 */
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  IMPORT_ERROR = 'IMPORT_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  EDITOR_ERROR = 'EDITOR_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 应用错误类
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public userMessage: string,
    public originalError?: Error,
    public context?: Record<string, unknown>,
  ) {
    super(userMessage)
    this.name = 'AppError'
  }
}

/**
 * 错误消息映射表
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ErrorCode.API_ERROR]: 'AI 服务暂时不可用，请稍后重试',
  [ErrorCode.IMPORT_ERROR]: '文件导入失败，请检查文件格式',
  [ErrorCode.EXPORT_ERROR]: '文件导出失败，请重试',
  [ErrorCode.STORAGE_ERROR]: '数据保存失败，请检查存储空间',
  [ErrorCode.VALIDATION_ERROR]: '输入数据格式不正确',
  [ErrorCode.EDITOR_ERROR]: '编辑器操作失败',
  [ErrorCode.UNKNOWN_ERROR]: '操作失败，请重试',
}

/**
 * 将未知错误转换为 Error 对象
 */
export function toError(err: unknown): Error {
  if (err instanceof Error) {
    return err
  }
  if (typeof err === 'string') {
    return new Error(err)
  }
  return new Error(String(err))
}

/**
 * 安全地获取错误消息
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'string') {
    return err
  }
  return '未知错误'
}

/**
 * 统一错误处理器
 */
export class ErrorHandler {
  /**
   * 处理错误并显示用户提示
   */
  static handle(error: AppError | Error, options?: { silent?: boolean }): AppError {
    // 动态导入 logger 以避免循环依赖
    import('./logger').then(({ logger }) => {
      const appError = ErrorHandler.normalizeError(error)

      // 记录日志
      logger.error(appError.message, appError.originalError, appError.context)

      // 显示用户提示（除非 silent 模式）
      if (!options?.silent) {
        window.$message?.error(appError.userMessage)
      }
    })

    return ErrorHandler.normalizeError(error)
  }

  /**
   * 异步错误处理装饰器
   */
  static async asyncHandler<T>(
    fn: () => Promise<T>,
    errorCode: ErrorCode,
    customMessage?: string,
  ): Promise<T | null> {
    try {
      return await fn()
    } catch (error) {
      ErrorHandler.handle({
        code: errorCode,
        message: `${errorCode} failed`,
        userMessage: customMessage || ERROR_MESSAGES[errorCode],
        originalError: error as Error,
      } as AppError)
      return null
    }
  }

  /**
   * 同步错误处理装饰器
   */
  static syncHandler<T>(
    fn: () => T,
    errorCode: ErrorCode,
    customMessage?: string,
  ): T | null {
    try {
      return fn()
    } catch (error) {
      ErrorHandler.handle({
        code: errorCode,
        message: `${errorCode} failed`,
        userMessage: customMessage || ERROR_MESSAGES[errorCode],
        originalError: error as Error,
      } as AppError)
      return null
    }
  }

  /**
   * 将普通 Error 转换为 AppError
   */
  private static normalizeError(error: AppError | Error): AppError {
    if ('code' in error && 'userMessage' in error) {
      return error as AppError
    }

    // 将普通 Error 转换为 AppError
    return new AppError(
      ErrorCode.UNKNOWN_ERROR,
      ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR],
      error as Error,
    )
  }
}

/**
 * Vue Composable 形式的错误处理器
 */
export function useErrorHandler() {
  return {
    handle: ErrorHandler.handle,
    asyncHandler: ErrorHandler.asyncHandler,
    syncHandler: ErrorHandler.syncHandler,
  }
}
