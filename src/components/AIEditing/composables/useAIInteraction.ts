import type Quill from 'quill'
import type { Ref } from 'vue'
import { ref } from 'vue'
import { handleSend } from '../util'

/**
 * AI 交互 Composable
 * 封装 AI 请求、响应处理、中断控制等逻辑
 */
export function useAIInteraction(quill: Ref<Quill | null>) {
  const isGenerating = ref(false)
  const abortController = ref<AbortController | null>(null)
  const aiResponse = ref('')
  const isTranslationPrompt = ref(false)
  const hiddenPrompt = ref('')

  /**
   * 发送 AI 提示词
   */
  async function sendPrompt(
    promptValue: string,
    currentRange: any,
    aiResponseRef: HTMLElement,
    actionButtonsRef: HTMLElement,
    onResponse: (response: any) => void,
  ) {
    if (!quill.value) return

    await handleSend({
      promptInputRef: null as any,
      promptValue,
      currentRange,
      quill: quill.value,
      aiResponseRef,
      actionButtonsRef,
      isGenerating,
      abortController,
      onResponse,
    })
  }

  /**
   * 中止当前 AI 生成
   */
  function abortGeneration() {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
      isGenerating.value = false
    }
  }

  /**
   * 重置 AI 交互状态
   */
  function resetState() {
    isGenerating.value = false
    abortController.value = null
    aiResponse.value = ''
    isTranslationPrompt.value = false
    hiddenPrompt.value = ''
  }

  return {
    isGenerating,
    abortController,
    aiResponse,
    isTranslationPrompt,
    hiddenPrompt,
    sendPrompt,
    abortGeneration,
    resetState,
  }
}
