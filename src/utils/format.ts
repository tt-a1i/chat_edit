/**
 * 格式化工具函数
 */

/**
 * 智能格式化时间戳
 * - 今天: "今天 HH:mm"
 * - 昨天: "昨天 HH:mm"
 * - 本周: "周一 HH:mm"
 * - 更早: "MM-DD"
 */
export function formatSmartTime(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const targetDate = new Date(date)
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())

  const hours = targetDate.getHours().toString().padStart(2, '0')
  const minutes = targetDate.getMinutes().toString().padStart(2, '0')
  const time = `${hours}:${minutes}`

  // 今天
  if (targetDay.getTime() === today.getTime()) {
    return `今天 ${time}`
  }

  // 昨天
  if (targetDay.getTime() === yesterday.getTime()) {
    return `昨天 ${time}`
  }

  // 本周
  if (targetDay >= weekAgo) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[targetDate.getDay()]
    return `${weekday} ${time}`
  }

  // 更早
  const month = (targetDate.getMonth() + 1).toString().padStart(2, '0')
  const day = targetDate.getDate().toString().padStart(2, '0')
  return `${month}-${day}`
}

/**
 * 简化模型名称
 * moonshot-v1-8k -> v1-8k
 * kimi-k2-0905-preview -> k2-0905
 * moonshot-v1-32k-vision-preview -> v1-32k-vision
 */
export function simplifyModelName(modelName: string): string {
  if (!modelName) return ''

  // 移除 moonshot 前缀
  let simplified = modelName.replace(/^moonshot-/, '')

  // 移除 kimi 前缀
  simplified = simplified.replace(/^kimi-/, '')

  // 移除 preview 后缀
  simplified = simplified.replace(/-preview$/, '')

  // 如果简化后的名称过长（>15字符），进一步简化
  if (simplified.length > 15) {
    // 保留版本号和主要特性
    const parts = simplified.split('-')
    if (parts.length > 2) {
      // 取前两个部分，例如 v1-8k 或 k2-turbo
      simplified = `${parts[0]}-${parts[1]}`
    }
  }

  return simplified
}

/**
 * 格式化文件大小
 * 1024 -> "1 KB"
 * 1048576 -> "1 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Math.round(bytes / k ** i)} ${sizes[i]}`
}

/**
 * 截断长文本
 * "这是一段很长的文本" -> "这是一段..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}
