/**
 * 用户提示工具
 * 封装 Naive UI 的 message API
 */

/**
 * 显示成功提示
 */
export function showSuccess(message: string) {
  if (window.$message) {
    window.$message.success(message)
  }
}

/**
 * 显示错误提示
 */
export function showError(message: string) {
  if (window.$message) {
    window.$message.error(message)
  }
}

/**
 * 显示警告提示
 */
export function showWarning(message: string) {
  if (window.$message) {
    window.$message.warning(message)
  }
}

/**
 * 显示信息提示
 */
export function showInfo(message: string) {
  if (window.$message) {
    window.$message.info(message)
  }
}

/**
 * 显示加载提示
 */
export function showLoading(message: string) {
  if (window.$message) {
    return window.$message.loading(message, { duration: 0 })
  }
  return null
}
