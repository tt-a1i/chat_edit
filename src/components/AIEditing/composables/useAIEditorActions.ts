import type { editor } from 'monaco-editor'
import type Quill from 'quill'
import type { Ref } from 'vue'
import { renderMarkdown } from '../markdown'
import {
  clearHighlight,
  closeDiffEditor,
  handleRegenerate,
  handleSend,
  renderMarkdownToQuill,
  showDiffEditor,
} from '../utils'

/**
 * AI 编辑器操作 Composable
 * 封装所有事件处理逻辑
 */
export function useAIEditorActions(
  quill: Ref<Quill | null>,
  currentRange: Ref<{ index: number, length: number } | null>,
  replacementRange: Ref<{ index: number, length: number } | null>,
  diffEditor: Ref<editor.IStandaloneDiffEditor | null>,
  domRefs: {
    floatingInputRef: Ref<HTMLElement | null>
    verticalMenuRef: Ref<HTMLElement | null>
    aiResponseRef: Ref<HTMLElement | null>
    actionButtonsRef: Ref<HTMLElement | null>
    promptInputRef: Ref<HTMLInputElement | null>
    sendBtnRef: Ref<HTMLElement | null>
    exportMenuRef: Ref<HTMLElement | null>
  },
  aiState: {
    isGenerating: Ref<boolean>
    abortController: Ref<AbortController | null>
    isTranslationPrompt: Ref<boolean>
    hiddenPrompt: Ref<string>
  },
) {
  /**
   * 更新 AI 响应内容
   */
  function handleResponseUpdate(text: string, responseContent: Element) {
    const renderedHtml = renderMarkdown(text)
    responseContent.innerHTML = renderedHtml
    responseContent.setAttribute('data-original-text', text)
  }

  /**
   * 插入到后面
   */
  function handleInsertAfter() {
    if (!currentRange.value || !quill.value) return

    const responseContent = domRefs.aiResponseRef.value?.querySelector('.response-content')
    const aiResponseText = responseContent?.getAttribute('data-original-text')

    if (aiResponseText) {
      const insertIndex = currentRange.value.index + currentRange.value.length
      renderMarkdownToQuill({
        markdownText: aiResponseText,
        quill: quill.value,
        cursorPosition: insertIndex,
      })

      if (domRefs.aiResponseRef.value) domRefs.aiResponseRef.value.style.display = 'none'
      if (domRefs.floatingInputRef.value) domRefs.floatingInputRef.value.style.display = 'none'
      if (domRefs.actionButtonsRef.value) domRefs.actionButtonsRef.value.style.display = 'none'
    }

    const length = quill.value.getLength()
    quill.value.formatText(0, length, 'background', false, 'api')
  }

  /**
   * 替换内容
   */
  function handleReplace() {
    if (!currentRange.value || !quill.value) return

    const responseContent = domRefs.aiResponseRef.value?.querySelector('.response-content')
    const aiResponseText = responseContent?.getAttribute('data-original-text')

    if (!aiResponseText) return

    quill.value.deleteText(currentRange.value.index, currentRange.value.length)
    renderMarkdownToQuill({
      markdownText: aiResponseText,
      quill: quill.value,
      cursorPosition: currentRange.value.index,
    })

    clearHighlight(quill.value, currentRange.value)
    if (domRefs.floatingInputRef.value) domRefs.floatingInputRef.value.style.display = 'none'
    if (domRefs.aiResponseRef.value) domRefs.aiResponseRef.value.style.display = 'none'
    if (domRefs.actionButtonsRef.value) domRefs.actionButtonsRef.value.style.display = 'none'
    currentRange.value = null
  }

  /**
   * 对比功能
   */
  function handleCompare(monacoLoaded: boolean) {
    if (!monacoLoaded || !currentRange.value || !quill.value) return

    const selectedText = quill.value.getText(currentRange.value.index, currentRange.value.length)
    const aiResponseText = domRefs.aiResponseRef.value?.querySelector('.response-content')?.getAttribute('data-original-text') || ''

    if (!selectedText || !aiResponseText) return

    replacementRange.value = { ...currentRange.value }
    diffEditor.value = showDiffEditor({
      currentRange: currentRange.value,
      originalText: selectedText,
      modifiedText: aiResponseText,
      diffEditor: diffEditor.value,
      quill: quill.value,
    })
  }

  /**
   * 重新生成
   */
  function handleRegenerateClick() {
    if (!quill.value) return

    const responseContent = domRefs.aiResponseRef.value?.querySelector('.response-content')
    const prompt = aiState.hiddenPrompt.value || domRefs.promptInputRef.value?.value

    handleRegenerate({
      promptInputRef: domRefs.promptInputRef.value!,
      promptValue: prompt || '',
      currentRange: currentRange.value,
      quill: quill.value,
      aiResponseRef: domRefs.aiResponseRef.value!,
      actionButtonsRef: domRefs.actionButtonsRef.value!,
      isGenerating: aiState.isGenerating,
      abortController: aiState.abortController,
      onResponse: (response) => {
        if (!responseContent) return
        handleResponseUpdate(response.content, responseContent)
      },
    })
  }

  /**
   * 复制响应内容
   */
  function handleCopy() {
    const responseContent = domRefs.aiResponseRef.value?.querySelector('.response-content')?.textContent
    if (responseContent) {
      navigator.clipboard.writeText(responseContent).then(() => {
        const copyBtn = document.getElementById('aiResponseCopyBtn')
        if (copyBtn) {
          const originalText = copyBtn.innerHTML
          copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制'
          setTimeout(() => {
            copyBtn.innerHTML = originalText
          }, 2000)
        }
      })
    }
  }

  /**
   * Diff 编辑器 - 插入到后面
   */
  function handleDiffInsertAfter() {
    if (!diffEditor.value || !replacementRange.value || !quill.value) return

    const modifiedText = diffEditor.value.getModifiedEditor().getValue()
    const insertPosition = replacementRange.value.index + replacementRange.value.length

    renderMarkdownToQuill({
      markdownText: modifiedText,
      quill: quill.value,
      cursorPosition: insertPosition,
    })

    if (currentRange.value) {
      clearHighlight(quill.value, currentRange.value)
    }
    closeDiffEditor(diffEditor.value, true)

    replacementRange.value = null
    currentRange.value = null
  }

  /**
   * Diff 编辑器 - 确认替换
   */
  function handleConfirmReplace() {
    if (!diffEditor.value || !replacementRange.value || !quill.value) return

    const modifiedText = diffEditor.value.getModifiedEditor().getValue()

    quill.value.deleteText(replacementRange.value.index, replacementRange.value.length)
    renderMarkdownToQuill({
      markdownText: modifiedText,
      quill: quill.value,
      cursorPosition: replacementRange.value.index,
    })

    if (currentRange.value) {
      clearHighlight(quill.value, currentRange.value)
    }
    closeDiffEditor(diffEditor.value, true)

    replacementRange.value = null
    currentRange.value = null
  }

  /**
   * Diff 编辑器 - 取消
   */
  function handleCancelReplace() {
    closeDiffEditor(diffEditor.value)
  }

  /**
   * 发送 AI 请求
   */
  async function handleSendClick() {
    if (!quill.value) return

    // 检查是否是翻译提示
    if (!aiState.isTranslationPrompt.value) {
      const prompt = (aiState.hiddenPrompt.value || domRefs.promptInputRef.value?.value || '').toLowerCase()
      aiState.isTranslationPrompt.value
        = prompt.includes('翻译')
          || prompt.includes('translate')
          || prompt.includes('中文')
          || prompt.includes('english')
    }

    // 如果正在生成，则中止
    if (aiState.isGenerating.value && aiState.abortController.value) {
      aiState.abortController.value.abort()
      if (domRefs.sendBtnRef.value) {
        domRefs.sendBtnRef.value.classList.remove('loading')
        domRefs.sendBtnRef.value.innerHTML = '<i class="fas fa-paper-plane send-icon"></i>'
      }
      aiState.isGenerating.value = false
      aiState.abortController.value = null
      return
    }

    const prompt = aiState.hiddenPrompt.value || domRefs.promptInputRef.value?.value
    if (!prompt) return

    aiState.hiddenPrompt.value = ''
    if (domRefs.verticalMenuRef.value) domRefs.verticalMenuRef.value.style.display = 'none'
    if (domRefs.aiResponseRef.value) domRefs.aiResponseRef.value.style.display = 'block'
    if (domRefs.actionButtonsRef.value) domRefs.actionButtonsRef.value.style.display = 'none'

    const responseContent = domRefs.aiResponseRef.value?.querySelector('.response-content')
    if (responseContent) {
      responseContent.classList.add('loading')
      responseContent.textContent = '正在生成回答...'
    }

    await handleSend({
      promptInputRef: domRefs.promptInputRef.value!,
      promptValue: prompt,
      currentRange: currentRange.value,
      quill: quill.value,
      aiResponseRef: domRefs.aiResponseRef.value!,
      actionButtonsRef: domRefs.actionButtonsRef.value!,
      isGenerating: aiState.isGenerating,
      abortController: aiState.abortController,
      onResponse: (response) => {
        if (!responseContent) return

        if (response.error) {
          responseContent.classList.remove('loading')
          responseContent.textContent = `错误: ${response.error}`
          return
        }

        responseContent.classList.remove('loading')
        handleResponseUpdate(response.content, responseContent)

        if (!domRefs.actionButtonsRef.value?.style.display || domRefs.actionButtonsRef.value.style.display === 'none') {
          domRefs.actionButtonsRef.value!.style.display = 'flex'
        }
      },
    })
  }

  return {
    handleInsertAfter,
    handleReplace,
    handleCompare,
    handleRegenerateClick,
    handleCopy,
    handleDiffInsertAfter,
    handleConfirmReplace,
    handleCancelReplace,
    handleSendClick,
  }
}
