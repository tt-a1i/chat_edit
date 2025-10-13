import type { Ref } from 'vue'
import { useEventListener } from '@vueuse/core'

/**
 * 编辑器事件监听器管理
 * 使用 VueUse 的 useEventListener 自动清理监听器
 */
export function useEditorEventListeners() {
  /**
   * 为元素 ID 添加点击事件监听器
   */
  function onElementClick(elementId: string, handler: (event: MouseEvent) => void) {
    const element = document.getElementById(elementId)
    if (element) {
      useEventListener(element, 'click', handler)
    }
  }

  /**
   * 为 document 添加事件监听器
   */
  function onDocumentEvent<K extends keyof DocumentEventMap>(
    event: K,
    handler: (event: DocumentEventMap[K]) => void,
  ) {
    useEventListener(document, event, handler)
  }

  /**
   * 为 window 添加事件监听器
   */
  function onWindowEvent<K extends keyof WindowEventMap>(
    event: K,
    handler: (event: WindowEventMap[K]) => void,
  ) {
    useEventListener(window, event, handler)
  }

  /**
   * 为 ref 元素添加事件监听器
   */
  function onRefElementEvent<K extends keyof HTMLElementEventMap>(
    elementRef: Ref<HTMLElement | null | undefined>,
    event: K,
    handler: (event: HTMLElementEventMap[K]) => void,
  ) {
    if (elementRef.value) {
      useEventListener(elementRef, event, handler)
    }
  }

  return {
    onElementClick,
    onDocumentEvent,
    onWindowEvent,
    onRefElementEvent,
  }
}
