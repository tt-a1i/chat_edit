/**
 * 错误处理工具函数
 */

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
