import { onMounted, shallowRef } from 'vue'

/**
 * DOM 引用管理 Composable
 * 集中管理所有 DOM 元素的引用
 */
export function useDOMRefs() {
  const floatingInputRef = shallowRef<HTMLElement | null>(null)
  const verticalMenuRef = shallowRef<HTMLElement | null>(null)
  const promptInputRef = shallowRef<HTMLInputElement | null>(null)
  const sendBtnRef = shallowRef<HTMLElement | null>(null)
  const aiResponseRef = shallowRef<HTMLElement | null>(null)
  const actionButtonsRef = shallowRef<HTMLElement | null>(null)
  const exportMenuRef = shallowRef<HTMLElement | null>(null)
  const creationTimeDisplay = shallowRef<HTMLElement | null>(null)
  const wordCountDisplay = shallowRef<HTMLElement | null>(null)

  /**
   * 初始化所有 DOM 引用
   */
  function initDOMRefs() {
    floatingInputRef.value = document.getElementById('floatingInput')
    verticalMenuRef.value = document.getElementById('verticalMenu')
    promptInputRef.value = document.getElementById('promptInput') as HTMLInputElement
    sendBtnRef.value = document.getElementById('sendBtn')
    aiResponseRef.value = document.getElementById('aiResponse')
    actionButtonsRef.value = document.getElementById('actionButtons')
    exportMenuRef.value = document.getElementById('exportMenu')
  }

  /**
   * 隐藏所有 AI UI 元素
   */
  function hideAllAIUI() {
    if (floatingInputRef.value) floatingInputRef.value.style.display = 'none'
    if (aiResponseRef.value) aiResponseRef.value.style.display = 'none'
    if (actionButtonsRef.value) actionButtonsRef.value.style.display = 'none'
    if (verticalMenuRef.value) verticalMenuRef.value.style.display = 'none'
  }

  return {
    floatingInputRef,
    verticalMenuRef,
    promptInputRef,
    sendBtnRef,
    aiResponseRef,
    actionButtonsRef,
    exportMenuRef,
    creationTimeDisplay,
    wordCountDisplay,
    initDOMRefs,
    hideAllAIUI,
  }
}
