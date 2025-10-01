<script setup lang="ts">
import type { editor } from 'monaco-editor'
import { ErrorHandler } from '@/utils/errorHandler'
import { AppError, ErrorCode } from '@/utils/errors'
import { NCard, NModal, NSpace, NText, NUpload, NUploadDragger } from 'naive-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAIInteraction } from './composables/useAIInteraction'
import { useEditorEventListeners } from './composables/useEditorEventListeners'
import { useFileOperations } from './composables/useFileOperations'
import { useQuillEditor } from './composables/useQuillEditor'
import { createImporter } from './import'
import { renderMarkdown } from './markdown'
import { initMonaco } from './monacoConfig'
import {
  clearHighlight,
  closeDiffEditor,
  createTimeAndWordCountDisplay,
  handleRegenerate,
  handleSend,
  renderMarkdownToQuill,
  showAIMenu,
  showDiffEditor,
  updateCreationTimeDisplay,
  updateWordCountDisplay,
} from './util'
import 'github-markdown-css/github-markdown.css'
import 'katex/dist/katex.min.css'
import 'quill-table-ui/dist/index.css'
import 'quill/dist/quill.snow.css'

// ==================== Composables 初始化 ====================
const { quillInstance, initQuillEditor: initEditor, getToolbar } = useQuillEditor()
const quillInstanceRef = computed(() => quillInstance.value)

const { isGenerating, abortController, isTranslationPrompt, hiddenPrompt } = useAIInteraction(quillInstanceRef)
const { showUploadModal } = useFileOperations(quillInstanceRef)
const { onElementClick, onDocumentEvent } = useEditorEventListeners()

// ==================== 本地状态 ====================
const currentRange = ref<{ index: number, length: number } | null>(null)
const replacementRange = ref<{ index: number, length: number } | null>(null)
const diffEditor = ref<editor.IStandaloneDiffEditor | null>(null)
const showMobileWarning = ref(false)
const isMobile = ref(false)

// DOM 引用
let floatingInputRef: HTMLElement | null = null
let verticalMenuRef: HTMLElement | null = null
let promptInputRef: HTMLInputElement | null = null
let sendBtnRef: HTMLElement | null = null
let aiResponseRef: HTMLElement | null = null
let actionButtonsRef: HTMLElement | null = null
let exportMenuRef: HTMLElement | null = null
let creationTimeDisplay: HTMLElement | null = null
let wordCountDisplay: HTMLElement | null = null
let monacoLoaded = false

// 提示词数据
const currentLanguage = ref('zh-CN')
const promptsData = ref({
  system: [
    {
      id: '1',
      name: '继续写',
      name_en: 'Continue Writing',
      template: '请继续写下面的内容，保持风格和语气一致：',
      en_name: '✍️',
    },
    {
      id: '2',
      name: '翻译',
      name_en: 'Translate',
      template: '请将以下文本翻译成中文/英文（根据原文语言自动判断）：',
      en_name: '🌐',
    },
    {
      id: '3',
      name: '润色文本',
      name_en: 'Polish Text',
      template: '请对以下文本进行润色，提升语言表达质量，但保持原意不变：',
      en_name: '✨',
    },
    {
      id: '4',
      name: '扩写内容',
      name_en: 'Expand Content',
      template: '请扩展以下文本，添加更多细节、例子或解释，使其更加全面：',
      en_name: '📈',
    },
    {
      id: '5',
      name: '缩写内容',
      name_en: 'Condense Content',
      template: '请将以下文本精简，保留关键信息但使其更加简洁：',
      en_name: '📉',
    },
    {
      id: '6',
      name: '总结要点',
      name_en: 'Summarize',
      template: '请总结以下文本的主要观点和要点：',
      en_name: '📋',
    },
  ],
})

// ==================== 生命周期 ====================
onMounted(async () => {
  detectMobileDevice()

  // 监听窗口大小变化
  onDocumentEvent('mouseup', handleMouseUp)

  // 获取 DOM 引用
  floatingInputRef = document.getElementById('floatingInput')
  verticalMenuRef = document.getElementById('verticalMenu')
  promptInputRef = document.getElementById('promptInput') as HTMLInputElement
  sendBtnRef = document.getElementById('sendBtn')
  aiResponseRef = document.getElementById('aiResponse')
  actionButtonsRef = document.getElementById('actionButtons')
  exportMenuRef = document.getElementById('exportMenu')

  // 初始化编辑器
  await initQuillEditor()

  // 初始化 Monaco
  initMonaco()
  monacoLoaded = true

  // 设置事件监听器
  setupEventListeners()
})

onBeforeUnmount(() => {
  if (abortController.value) {
    abortController.value.abort()
  }
})

// ==================== 核心函数 ====================

/**
 * 初始化 Quill 编辑器
 */
async function initQuillEditor() {
  const quill = await initEditor(exportMenuRef)
  if (!quill) return

  // 设置工具栏显示
  await nextTick()
  const toolbar = getToolbar()
  if (toolbar) {
    const elements = createTimeAndWordCountDisplay(toolbar)
    if (elements) {
      creationTimeDisplay = elements.creationTimeDisplay
      wordCountDisplay = elements.wordCountDisplay
      updateCreationTimeDisplay(creationTimeDisplay)
    }
  }

  // 设置编辑器事件
  quill.on('text-change', () => {
    if (wordCountDisplay) {
      updateWordCountDisplay(wordCountDisplay, quill)
    }
  })

  // 监听 / 快捷键
  quill.root.addEventListener('keydown', async (e) => {
    if (e.key === '/') {
      const selection = quill.getSelection()
      if (!selection) return

      const [line] = quill.getLine(selection.index)
      const text = line?.domNode?.textContent

      if (text !== null && text !== undefined && !text.trim()) {
        e.preventDefault()
        const range = showAIMenu({
          quill,
          currentRange: currentRange.value,
          floatingInputRef: floatingInputRef!,
          verticalMenuRef: verticalMenuRef!,
          handleOutsideClick: () => {},
        })
        if (range) {
          currentRange.value = range
        }
      }
    }
  })
}

/**
 * 检测移动设备
 */
function detectMobileDevice() {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    showMobileWarning.value = true
  }
}

/**
 * 处理鼠标抬起事件
 */
function handleMouseUp(event: MouseEvent) {
  const target = event.target as Node
  const quill = quillInstance.value
  if (!quill) return

  const isInComponents = [
    verticalMenuRef?.contains(target),
    floatingInputRef?.contains(target),
    aiResponseRef?.contains(target),
    document.getElementById('diffContainer')?.contains(target),
    document.querySelector('.n-modal-container')?.contains(target),
    document.querySelector('.n-dialog')?.contains(target),
  ].some(Boolean)

  if (!isInComponents) {
    setTimeout(() => {
      const selection = quill.getSelection()
      if (!selection || selection.length === 0) {
        if (currentRange.value) {
          clearHighlight(quill, currentRange.value)
        }
        if (floatingInputRef) floatingInputRef.style.display = 'none'
        if (aiResponseRef) aiResponseRef.style.display = 'none'
        if (actionButtonsRef) actionButtonsRef.style.display = 'none'
        if (verticalMenuRef) verticalMenuRef.style.display = 'none'
        currentRange.value = null
      }
    }, 0)
  }
}

/**
 * 设置所有事件监听器
 */
function setupEventListeners() {
  const quill = quillInstance.value
  if (!quill) return

  // AI 响应面板事件
  onElementClick('insertAfter', handleInsertAfter)
  onElementClick('replace', handleReplace)
  onElementClick('compare', handleCompare)
  onElementClick('aiResponseRegenerateBtn', handleRegenerateClick)
  onElementClick('aiResponseCopyBtn', handleCopy)

  // Diff 编辑器事件
  onElementClick('insertAfterDiff', handleDiffInsertAfter)
  onElementClick('confirmReplace', handleConfirmReplace)
  onElementClick('cancelReplace', handleCancelReplace)

  // 导出菜单事件
  onDocumentEvent('click', handleDocumentClick)

  // 发送按钮
  if (sendBtnRef) {
    sendBtnRef.addEventListener('click', handleSendClick)
  }
}

/**
 * 处理菜单项点击
 */
function handleMenuItemClick(prompt: any) {
  const quill = quillInstance.value
  if (!quill || !currentRange.value) return

  hiddenPrompt.value = prompt.template
  if (verticalMenuRef) verticalMenuRef.style.display = 'none'
  if (floatingInputRef) floatingInputRef.style.display = 'block'
  if (promptInputRef) {
    promptInputRef.value = ''
    promptInputRef.focus()
  }
}

/**
 * 发送提示词
 */
async function handleSendClick() {
  const quill = quillInstance.value
  if (!quill) return

  // 检查是否是翻译提示
  if (!isTranslationPrompt.value) {
    const prompt = (hiddenPrompt.value || promptInputRef?.value || '').toLowerCase()
    isTranslationPrompt.value
      = prompt.includes('翻译')
        || prompt.includes('translate')
        || prompt.includes('中文')
        || prompt.includes('english')
  }

  // 如果正在生成，则中止
  if (isGenerating.value && abortController.value) {
    abortController.value.abort()
    if (sendBtnRef) {
      sendBtnRef.classList.remove('loading')
      sendBtnRef.innerHTML = '<i class="fas fa-paper-plane send-icon"></i>'
    }
    isGenerating.value = false
    abortController.value = null
    return
  }

  const prompt = hiddenPrompt.value || promptInputRef?.value
  if (!prompt) return

  hiddenPrompt.value = ''
  if (verticalMenuRef) verticalMenuRef.style.display = 'none'
  if (aiResponseRef) aiResponseRef.style.display = 'block'
  if (actionButtonsRef) actionButtonsRef.style.display = 'none'

  const responseContent = aiResponseRef?.querySelector('.response-content')
  if (responseContent) {
    responseContent.classList.add('loading')
    responseContent.textContent = '正在生成回答...'
  }

  await handleSend({
    promptInputRef: promptInputRef!,
    promptValue: prompt,
    currentRange: currentRange.value,
    quill,
    aiResponseRef: aiResponseRef!,
    actionButtonsRef: actionButtonsRef!,
    isGenerating,
    abortController,
    onResponse: (response) => {
      if (!responseContent) return

      if (response.error) {
        responseContent.classList.remove('loading')
        responseContent.textContent = `错误: ${response.error}`
        return
      }

      responseContent.classList.remove('loading')
      handleResponseUpdate(response.content, responseContent)

      if (!actionButtonsRef?.style.display || actionButtonsRef.style.display === 'none') {
        actionButtonsRef!.style.display = 'flex'
      }
    },
  })
}

/**
 * 更新响应内容
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
  const quill = quillInstance.value
  if (!currentRange.value || !quill) return

  const responseContent = aiResponseRef?.querySelector('.response-content')
  const aiResponseText = responseContent?.getAttribute('data-original-text')

  if (aiResponseText) {
    const insertIndex = currentRange.value.index + currentRange.value.length
    renderMarkdownToQuill({
      markdownText: aiResponseText,
      quill,
      cursorPosition: insertIndex,
    })

    if (aiResponseRef) aiResponseRef.style.display = 'none'
    if (floatingInputRef) floatingInputRef.style.display = 'none'
    if (actionButtonsRef) actionButtonsRef.style.display = 'none'
  }

  const length = quill.getLength()
  quill.formatText(0, length, 'background', false, 'api')
}

/**
 * 替换内容
 */
function handleReplace() {
  const quill = quillInstance.value
  if (!currentRange.value || !quill) return

  const responseContent = aiResponseRef?.querySelector('.response-content')
  const aiResponseText = responseContent?.getAttribute('data-original-text')

  if (!aiResponseText) return

  quill.deleteText(currentRange.value.index, currentRange.value.length)
  renderMarkdownToQuill({
    markdownText: aiResponseText,
    quill,
    cursorPosition: currentRange.value.index,
  })

  clearHighlight(quill, currentRange.value)
  if (floatingInputRef) floatingInputRef.style.display = 'none'
  if (aiResponseRef) aiResponseRef.style.display = 'none'
  if (actionButtonsRef) actionButtonsRef.style.display = 'none'
  currentRange.value = null
}

/**
 * 对比功能
 */
function handleCompare() {
  const quill = quillInstance.value
  if (!monacoLoaded || !currentRange.value || !quill) return

  const selectedText = quill.getText(currentRange.value.index, currentRange.value.length)
  const aiResponseText = aiResponseRef?.querySelector('.response-content')?.getAttribute('data-original-text') || ''

  if (!selectedText || !aiResponseText) return

  replacementRange.value = { ...currentRange.value }
  diffEditor.value = showDiffEditor({
    currentRange: currentRange.value,
    originalText: selectedText,
    modifiedText: aiResponseText,
    diffEditor: diffEditor.value,
    quill,
  })
}

/**
 * 重新生成
 */
function handleRegenerateClick() {
  const quill = quillInstance.value
  if (!quill) return

  const responseContent = aiResponseRef?.querySelector('.response-content')
  const prompt = hiddenPrompt.value || promptInputRef?.value

  handleRegenerate({
    promptInputRef: promptInputRef!,
    promptValue: prompt || '',
    currentRange: currentRange.value,
    quill,
    aiResponseRef: aiResponseRef!,
    actionButtonsRef: actionButtonsRef!,
    isGenerating,
    abortController,
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
  const responseContent = aiResponseRef?.querySelector('.response-content')?.textContent
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
  const quill = quillInstance.value
  if (!diffEditor.value || !replacementRange.value || !quill) return

  const modifiedText = diffEditor.value.getModifiedEditor().getValue()
  const insertPosition = replacementRange.value.index + replacementRange.value.length

  renderMarkdownToQuill({
    markdownText: modifiedText,
    quill,
    cursorPosition: insertPosition,
  })

  if (currentRange.value) {
    clearHighlight(quill, currentRange.value)
  }
  closeDiffEditor(diffEditor.value, true)

  replacementRange.value = null
  currentRange.value = null
}

/**
 * Diff 编辑器 - 确认替换
 */
function handleConfirmReplace() {
  const quill = quillInstance.value
  if (!diffEditor.value || !replacementRange.value || !quill) return

  const modifiedText = diffEditor.value.getModifiedEditor().getValue()

  quill.deleteText(replacementRange.value.index, replacementRange.value.length)
  renderMarkdownToQuill({
    markdownText: modifiedText,
    quill,
    cursorPosition: replacementRange.value.index,
  })

  if (currentRange.value) {
    clearHighlight(quill, currentRange.value)
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
 * 处理文档点击（关闭导出菜单）
 */
function handleDocumentClick(e: MouseEvent) {
  const exportButton = document.querySelector('.ql-export')
  const target = e.target as Node

  if (exportMenuRef && !exportMenuRef.contains(target) && !exportButton?.contains(target)) {
    exportMenuRef.style.display = 'none'
  }
}

/**
 * 处理导出
 */
async function handleExport(format: 'markdown' | 'docx' | 'pdf') {
  const quill = quillInstance.value
  if (!quill) return

  try {
    const { createExporter } = await import('./export')
    const content = quill.root.innerHTML
    const exporter = createExporter(content, quill)
    await exporter.exportAs(format)

    if (exportMenuRef) {
      exportMenuRef.style.display = 'none'
    }
  } catch (error) {
    ErrorHandler.handle(new AppError(
      ErrorCode.EXPORT_ERROR,
      `导出为 ${format} 格式失败`,
      error as Error,
    ))
  }
}

/**
 * 自动调整文本框高度
 */
function autoResize(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  if (textarea.value.includes('\n')) {
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  } else {
    textarea.style.height = '2.5rem'
  }
}

/**
 * 处理提示框键盘事件
 */
function handlePromptKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    sendBtnRef?.click()
  }
}

/**
 * 处理文件上传
 */
async function handleFileUpload(options: any) {
  const { file } = options
  const actualFile = file.file || file

  const quill = quillInstance.value
  if (!quill) {
    return
  }

  try {
    const importer = createImporter()
    const html = await importer.importWordDocument(actualFile)

    quill.setContents([])
    quill.clipboard.dangerouslyPasteHTML(0, html)

    showUploadModal.value = false
    window.$message?.success('文件导入成功')
  } catch {
    // 错误已在 import.ts 中处理
  }
}
</script>

<template>
  <!-- 移动端警告 -->
  <NModal
    v-model:show="showMobileWarning"
    :mask-closable="false"
    :close-on-esc="true"
    preset="dialog"
  >
    <NCard
      style="width: 300px"
      :bordered="false"
      size="medium"
      role="alertdialog"
      aria-modal="true"
    >
      <div class="mobile-warning">
        <p style="font-size: 0.9em; color: #666;">
          <i class="fas fa-mobile-alt" aria-hidden="true" />&nbsp;当前设备不支持AI编辑功能，请使用桌面浏览器访问
        </p>
      </div>
    </NCard>
  </NModal>

  <!-- 主编辑器容器 -->
  <div class="writing-editor flex-1 overflow-hidden flex flex-col notranslate">
    <div class="editor-container flex-1 overflow-auto">
      <!-- Quill 编辑器 -->
      <div id="editor" />

      <!-- 浮动输入框 -->
      <div id="floatingInput" class="floating-input" tabindex="0">
        <div class="input-container">
          <textarea
            id="promptInput"
            placeholder="请输入内容"
            rows="1"
            @input="autoResize"
            @keydown="handlePromptKeydown"
          />
          <button id="sendBtn" class="send-btn">
            <i class="fas fa-paper-plane send-icon" />
          </button>
        </div>

        <!-- AI 响应面板 -->
        <div id="aiResponse" class="ai-response">
          <div class="response-content" />
          <div id="actionButtons" class="action-buttons">
            <div class="left-buttons">
              <button id="insertAfter">
                <i class="fas fa-plus" />
                插入到后面
              </button>
              <button id="replace">
                <i class="fas fa-exchange-alt" />
                替换内容
              </button>
              <button v-show="!isTranslationPrompt" id="compare">
                <i class="fas fa-code-compare" />
                原文对比
              </button>
            </div>
            <div class="right-buttons">
              <button id="aiResponseRegenerateBtn">
                <i class="fas fa-sync-alt" />
                重新生成
              </button>
              <button id="aiResponseCopyBtn">
                <i class="fas fa-copy" />
                复制
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 提示词菜单 -->
      <div id="verticalMenu" class="vertical-menu" tabindex="0">
        <div class="menu-content system-prompts">
          <div
            v-for="prompt in promptsData?.system"
            :key="prompt.id"
            class="menu-item"
            :data-prompt-id="prompt.id"
            @click="handleMenuItemClick(prompt)"
          >
            {{ prompt.en_name }}
            {{ currentLanguage === 'en-US' ? prompt.name_en : prompt.name }}
          </div>
        </div>
      </div>

      <!-- 导出菜单 -->
      <div id="exportMenu" class="export-menu">
        <div class="export-menu-item" data-format="markdown" @click="handleExport('markdown')">
          导出为markdown
        </div>
        <div class="export-menu-item" data-format="docx" @click="handleExport('docx')">
          导出为docx
        </div>
      </div>

      <!-- Diff 编辑器容器 -->
      <div id="diffContainer" style="display: none">
        <div id="diffWrapper">
          <div id="diffEditor" />
          <div class="diff-actions">
            <button id="insertAfterDiff" class="diff-btn insert">
              插入到后面
            </button>
            <button id="confirmReplace" class="diff-btn confirm">
              确认替换
            </button>
            <button id="cancelReplace" class="diff-btn cancel">
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 文件上传对话框 -->
  <NModal v-model:show="showUploadModal">
    <NCard
      style="width: 500px"
      title="导入文件"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <NSpace vertical>
        <NUpload
          :custom-request="handleFileUpload"
          :show-file-list="false"
          accept=".docx"
        >
          <NUploadDragger>
            <div style="margin-bottom: 12px">
              <i class="fas fa-file-upload" style="font-size: 48px; color: #409eff" />
            </div>
            <NText style="font-size: 16px">
              点击或拖拽文件到此区域上传
            </NText>
            <NText depth="3" style="margin-top: 8px; font-size: 14px">
              支持 .docx 格式的 Word 文档
            </NText>
          </NUploadDragger>
        </NUpload>
      </NSpace>
    </NCard>
  </NModal>
</template>

<style src="./style.less" lang="less"></style>
