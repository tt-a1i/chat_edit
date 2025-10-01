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
