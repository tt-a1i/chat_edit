import { logger } from '@/utils/logger'

// 防抖函数
function debounce<T extends unknown[]>(
  func: (...args: T) => void,
  wait: number,
): (...args: T) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (...args: T) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// 创建一个防抖的保存函数，500ms 内只执行一次
const debouncedSaveToServer = debounce(async (_sessionId: string, _content: string) => {
  try {
    // TODO(priority:medium): 实现草稿自动保存到服务器功能
    // 需要实现的功能：
    // 1. 在 AIEditingAPI 中添加 saveDraft(sessionId, content) 方法
    // 2. 后端实现草稿保存接口 POST /api/drafts/:sessionId
    // 3. 实现增量保存逻辑（只保存变更部分）
    // 4. 添加保存失败重试机制
    // 示例代码：
    // await AIEditingAPI.saveDraft(sessionId, content)
    // logger.debug('Saved draft to server:', sessionId, content.substring(0, 50))
  } catch (error) {
    logger.error('Failed to save content to server:', error)
  }
}, 500)

/**
 * 保存编辑器内容到服务器
 * @param content 编辑器内容
 * @param sessionId 会话ID
 */
export function saveEditorContent(content: string, sessionId?: string): void {
  // 如果提供了会话ID，则保存到服务器
  if (sessionId) {
    debouncedSaveToServer(sessionId, content)
  }
}

/**
 * 从服务器加载编辑器内容
 * @param sessionId 会话ID
 * @returns 编辑器内容，如果无法获取则返回 null
 */
export async function loadEditorContent(sessionId?: string): Promise<string | null> {
  if (sessionId) {
    try {
      // TODO(priority:medium): 实现从服务器加载草稿功能
      // 需要实现的功能：
      // 1. 在 AIEditingAPI 中添加 loadDraft(sessionId) 方法
      // 2. 后端实现草稿加载接口 GET /api/drafts/:sessionId
      // 3. 添加草稿版本管理（支持历史版本恢复）
      // 4. 实现离线缓存策略（先从本地加载，再从服务器同步）
      // 示例代码：
      // const serverContent = await AIEditingAPI.loadDraft(sessionId)
      // if (serverContent) {
      //   logger.debug('Loaded draft from server:', sessionId)
      //   return serverContent
      // }
    } catch {
      // logger.debug('Failed to load content from server, using local cache')
    }
  }
  return null
}
