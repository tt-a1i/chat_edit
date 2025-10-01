// 防抖函数
function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (...args: any[]) {
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
const debouncedSaveToServer = debounce(async (sessionId: string, content: string) => {
  try {
    await AIEditingAPI.saveDraft(sessionId, content)
  } catch (error) {
    console.error('Failed to save content to server:', error)
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
      // 优先从服务器加载
      const serverContent = await AIEditingAPI.loadDraft(sessionId)
      if (serverContent) {
        return serverContent
      }
    } catch (error) {
      console.log('Failed to load content from server:', error)
    }
  }
  return null
}
