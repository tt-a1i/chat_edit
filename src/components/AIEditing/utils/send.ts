/**
 * send.ts
 *
 * AI 请求发送和响应处理
 * 包含: handleSend, handleRegenerate
 */

import type Quill from 'quill'
import type { Ref } from 'vue'
import type { ChatResponse } from '@/types/ai-editing'
import * as AIEditingAPI from '@/api/ai-editing'

export interface HandleSendParams {
  promptInputRef: HTMLInputElement
  promptValue?: string
  currentRange: { index: number, length: number } | null
  quill: Quill
  aiResponseRef: HTMLElement
  actionButtonsRef: HTMLElement
  isGenerating: Ref<boolean>
  abortController: Ref<AbortController | null>
  onResponse: (response: ChatResponse) => void
  isTranslationPrompt?: Ref<boolean>
}

export async function handleSend({
  promptInputRef,
  promptValue,
  currentRange,
  quill,
  aiResponseRef,
  actionButtonsRef,
  isGenerating,
  abortController,
  onResponse,
  isTranslationPrompt,
}: HandleSendParams) {
  const actualPrompt = promptValue || promptInputRef.value
  aiResponseRef.dataset.lastPrompt = actualPrompt

  const originalPlaceholder = promptInputRef.placeholder || ''

  promptInputRef.value = ''
  promptInputRef.placeholder = '正在生成回答...'

  const selectedText = currentRange
    ? quill.getText(currentRange.index, currentRange.length)
    : ''

  const responseContent = aiResponseRef.querySelector('.response-content')
  const sendBtn = document.querySelector('.send-btn')

  if (!selectedText && !actualPrompt.trim()) {
    if (responseContent) {
      responseContent.textContent = '输入提示...'
      responseContent.classList.remove('loading')
    }
    promptInputRef.placeholder = originalPlaceholder
    return
  }

  try {
    isGenerating.value = true
    if (sendBtn) {
      sendBtn.classList.add('loading')
    }
    if (responseContent) {
      responseContent.classList.add('loading')
      responseContent.textContent = '正在生成回答...'
    }
    actionButtonsRef.style.display = 'none'

    abortController.value = new AbortController()

    await AIEditingAPI.streamChat(
      actualPrompt,
      selectedText,
      (response) => {
        if (response.error) {
          if (responseContent) {
            responseContent.classList.remove('loading')
            responseContent.textContent = `错误: ${response.error}`
          }
          promptInputRef.placeholder = originalPlaceholder
          return
        }
        if (responseContent) {
          responseContent.classList.remove('loading')
        }
        onResponse(response) // 调用回调函数而不是直接设置文本内容

        if (isTranslationPrompt?.value) {
          const compareBtn = document.getElementById('compare')
          if (compareBtn) {
            compareBtn.style.display = 'none'
          }
        }
      },
      abortController.value,
    )
    actionButtonsRef.style.display = 'flex'

    if (isTranslationPrompt?.value) {
      const compareBtn = document.getElementById('compare')
      if (compareBtn) {
        compareBtn.style.display = 'none'
      }
    }
  } catch (error: unknown) {
    const isAbortError = error instanceof Error && error.name === 'AbortError'
    if (isAbortError) {
      if (responseContent) {
        responseContent.textContent = '生成已中止'
      }
    } else if (responseContent) {
      responseContent.classList.remove('loading')
      responseContent.textContent = '生成回答时出现错误，请重试。'
    }
  } finally {
    isGenerating.value = false
    // 恢复发送按钮状态
    const sendBtn = document.querySelector('.send-btn')
    if (sendBtn) {
      sendBtn.classList.remove('loading')
      sendBtn.innerHTML = '<i class="fas fa-paper-plane send-icon"></i>'
    }

    promptInputRef.placeholder = originalPlaceholder
    promptInputRef.value = ''

    // 移除 abortController 后置空
    abortController.value = null
  }
}

export function handleRegenerate(params: HandleSendParams) {
  const lastPrompt = params.aiResponseRef.dataset.lastPrompt || ''
  return handleSend({ ...params, promptValue: lastPrompt })
}
