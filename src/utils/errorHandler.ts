import { AppError, ERROR_MESSAGES, ErrorCode } from './error-handler'
import { logger } from './logger'

/**
 * 统一错误处理器
 */
export class ErrorHandler {
  /**
   * 处理错误并显示用户提示
   */
  static handle(error: AppError | Error, options?: { silent?: boolean }): AppError {
    const appError = this.normalizeError(error)

    // 记录日志
    logger.error(appError.message, appError.originalError, appError.context)

    // 显示用户提示（除非 silent 模式）
    if (!options?.silent) {
      window.$message?.error(appError.userMessage)
    }

    return appError
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
      this.handle({
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
      this.handle({
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
