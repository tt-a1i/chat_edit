<script setup lang="ts">
import type { editor } from 'monaco-editor'
import type { PromptTemplate } from './constants/prompts'
import { createImporter } from '@/lib/export/import'
import { initMonaco } from '@/lib/monaco/config'
import { NCard, NModal, NSpace, NText, NUpload, NUploadDragger } from 'naive-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAIEditorActions } from './composables/useAIEditorActions'
import { useAIInteraction } from './composables/useAIInteraction'
import { useDOMRefs } from './composables/useDOMRefs'
import { useEditorEventListeners } from './composables/useEditorEventListeners'
import { useFileOperations } from './composables/useFileOperations'
import { useQuillEditor } from './composables/useQuillEditor'
import { SYSTEM_PROMPTS } from './constants/prompts'
import {
  calculateMenuPosition,
  clearHighlight,
  createTimeAndWordCountDisplay,
  highlightSelection,
  isInMenuComponents,
  showAIMenu,
  showAndPositionMenus,
  updateCreationTimeDisplay,
  updateWordCountDisplay,
} from './utils'
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

// DOM 引用管理
const {
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
} = useDOMRefs()

// 本地状态
const currentRange = ref<{ index: number, length: number } | null>(null)
const replacementRange = ref<{ index: number, length: number } | null>(null)
const diffEditor = ref<editor.IStandaloneDiffEditor | null>(null)
const showMobileWarning = ref(false)
const isMobile = ref(false)
const monacoLoaded = ref(false)
const currentLanguage = ref('zh-CN')
const promptsData = ref({ system: SYSTEM_PROMPTS })

// AI 编辑器操作
const {
  handleInsertAfter,
  handleReplace,
  handleCompare,
  handleRegenerateClick,
  handleCopy,
  handleDiffInsertAfter,
  handleConfirmReplace,
  handleCancelReplace,
  handleSendClick,
} = useAIEditorActions(
  quillInstanceRef,
  currentRange,
  replacementRange,
  diffEditor,
  {
    floatingInputRef,
    verticalMenuRef,
    aiResponseRef,
    actionButtonsRef,
    promptInputRef,
    sendBtnRef,
    exportMenuRef,
  },
  {
    isGenerating,
    abortController,
    isTranslationPrompt,
    hiddenPrompt,
  },
)

// ==================== 生命周期 ====================
onMounted(async () => {
  detectMobileDevice()
  initDOMRefs()

  // 初始化编辑器
  await initQuillEditor()

  // 初始化 Monaco
  initMonaco()
  monacoLoaded.value = true

  // 设置事件监听器
  setupEventListeners()

  // 监听鼠标抬起
  onDocumentEvent('mouseup', handleMouseUp)
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
  const quill = await initEditor(exportMenuRef.value)
  if (!quill) return

  await nextTick()
  const toolbar = getToolbar()
  if (toolbar) {
    const elements = createTimeAndWordCountDisplay(toolbar)
    if (elements) {
      creationTimeDisplay.value = elements.creationTimeDisplay
      wordCountDisplay.value = elements.wordCountDisplay
      updateCreationTimeDisplay(creationTimeDisplay.value)
    }
  }

  quill.on('text-change', () => {
    if (wordCountDisplay.value) {
      updateWordCountDisplay(wordCountDisplay.value, quill)
    }
  })

  // 监听选区变化
  quill.on('selection-change', (range, _oldRange, _source) => {
    if (range && range.length > 0) {
      // 清除旧的高亮（如果选区变化了）
      if (currentRange.value) {
        if (
          currentRange.value.index !== range.index
          || currentRange.value.length !== range.length
        ) {
          clearHighlight(quill, currentRange.value)
        }
      }

      // 保存新的选区并高亮
      currentRange.value = range
      highlightSelection(quill, range)

      // 计算菜单位置
      const position = calculateMenuPosition(quill, range)
      if (!position) return

      // 显示并定位所有菜单元素
      showAndPositionMenus({
        floatingInputRef: floatingInputRef.value,
        verticalMenuRef: verticalMenuRef.value,
        aiResponseRef: aiResponseRef.value,
      }, position)
    } else if (!range) {
      // 检查点击是否在相关组件内
      const isInComponents = isInMenuComponents(document.activeElement as Node, {
        floatingInputRef: floatingInputRef.value,
        verticalMenuRef: verticalMenuRef.value,
        aiResponseRef: aiResponseRef.value,
      })

      if (!isInComponents && currentRange.value) {
        clearHighlight(quill, currentRange.value)
        currentRange.value = null
        hideAllAIUI()
      }
    }
  })

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
          floatingInputRef: floatingInputRef.value!,
          verticalMenuRef: verticalMenuRef.value!,
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
 * 处理鼠标抬起
 */
function handleMouseUp(event: MouseEvent) {
  const target = event.target as Node
  const quill = quillInstance.value
  if (!quill) return

  const isInComponents = [
    verticalMenuRef.value?.contains(target),
    floatingInputRef.value?.contains(target),
    aiResponseRef.value?.contains(target),
    document.getElementById('diffContainer')?.contains(target),
    document.querySelector('.n-modal-container')?.contains(target),
  ].some(Boolean)

  if (!isInComponents) {
    setTimeout(() => {
      const selection = quill.getSelection()
      if (!selection || selection.length === 0) {
        if (currentRange.value) {
          clearHighlight(quill, currentRange.value)
        }
        hideAllAIUI()
        currentRange.value = null
      }
    }, 0)
  }
}

/**
 * 设置所有事件监听器
 */
function setupEventListeners() {
  onElementClick('insertAfter', handleInsertAfter)
  onElementClick('replace', handleReplace)
  onElementClick('compare', () => handleCompare(monacoLoaded.value))
  onElementClick('aiResponseRegenerateBtn', handleRegenerateClick)
  onElementClick('aiResponseCopyBtn', handleCopy)
  onElementClick('insertAfterDiff', handleDiffInsertAfter)
  onElementClick('confirmReplace', handleConfirmReplace)
  onElementClick('cancelReplace', handleCancelReplace)
  onDocumentEvent('click', handleDocumentClick)

  if (sendBtnRef.value) {
    sendBtnRef.value.addEventListener('click', handleSendClick)
  }
}

/**
 * 处理菜单项点击
 */
function handleMenuItemClick(prompt: PromptTemplate) {
  const quill = quillInstance.value
  if (!quill || !currentRange.value || !sendBtnRef.value) return

  hiddenPrompt.value = prompt.template
  if (promptInputRef.value) {
    promptInputRef.value.value = ''
  }

  // 检测是否是翻译提示
  isTranslationPrompt.value
    = prompt.name.includes('翻译')
      || (!!prompt.name_en && prompt.name_en.toLowerCase().includes('translate'))
      || prompt.name.includes('中文')
      || (!!prompt.name_en && prompt.name_en.toLowerCase().includes('english'))

  // 自动触发发送
  sendBtnRef.value.click()
}

/**
 * 处理文档点击
 */
function handleDocumentClick(e: MouseEvent) {
  const exportButton = document.querySelector('.ql-export')
  const target = e.target as Node

  if (exportMenuRef.value && !exportMenuRef.value.contains(target) && !exportButton?.contains(target)) {
    exportMenuRef.value.style.display = 'none'
  }
}

/**
 * 处理导出
 */
async function handleExport(format: 'markdown' | 'docx' | 'pdf') {
  const quill = quillInstance.value
  if (!quill) return

  try {
    const { createExporter } = await import('@/lib/export')
    const content = quill.root.innerHTML
    const exporter = createExporter(content, quill)
    await exporter.exportAs(format)

    if (exportMenuRef.value) {
      exportMenuRef.value.style.display = 'none'
    }
  } catch (error) {
    const { AppError, ErrorCode } = await import('@/utils/error-handler')
    const { ErrorHandler } = await import('@/utils/errorHandler')
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
    sendBtnRef.value?.click()
  }
}

/**
 * 处理文件上传
 */
async function handleFileUpload(options: { file: any }) {
  const { file } = options
  const actualFile = (file as any).file || file

  const quill = quillInstance.value
  if (!quill) return

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
            v-for="prompt in promptsData.system"
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
