<script setup>
import { ErrorHandler } from '@/utils/errorHandler'
import { AppError, ErrorCode } from '@/utils/errors'
import { logger } from '@/utils/logger'
import { NButton, NCard, NModal, NSpace, NText, NUpload, NUploadDragger } from 'naive-ui'
import Quill from 'quill'
import * as QuillTableUI from 'quill-table-ui'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { createExporter } from './export'
import { createImporter } from './import'
import { renderMarkdown } from './markdown'
import {
  initMonaco,
} from './monacoConfig'
import {
  checkEmptyLine,
  clearHighlight,
  closeDiffEditor,
  copyAsMarkdown,
  createTimeAndWordCountDisplay,
  handleOutsideClick,
  handleRegenerate,
  handleSend,
  hideAIUI,
  highlightSelection,
  insertContent,
  renderMarkdownToQuill,
  showAIMenu,
  showDiffEditor,
  showExportMenu,
  updateCreationTimeDisplay,
  updateWordCountDisplay,
} from './util.ts'
import 'quill/dist/quill.snow.css'
import 'quill-table-ui/dist/index.css'
import 'katex/dist/katex.min.css'
import 'github-markdown-css/github-markdown.css'
// 组件状态
let quill = null
// eslint-disable-next-line unused-imports/no-unused-vars
const table = null
let toolbar = null
let diffEditor = null
let currentRange = null
let replacementRange = null
// eslint-disable-next-line unused-imports/no-unused-vars
let posCloseToBottom = false
let creationTimeDisplay = null
let wordCountDisplay = null

let monacoLoaded = false

let floatingInputRef = null
let verticalMenuRef = null
let promptInputRef = null
let sendBtnRef = null
let aiResponseRef = null
let actionButtonsRef = null
function hideUI() {
  hideAIUI({
    floatingInputRef,
    verticalMenuRef,
    aiResponseRef,
    actionButtonsRef,
    promptInputRef,
  })
}
let exportMenuRef = null

// const currentSession = ref(null)
const promptsData = ref({
  system: [
    {
      id: '1',
      name: '翻译为中文',
      name_en: 'Translate to Chinese',
      template: '将以下文本翻译为中文，保持原文的意思、格式和语气：',
      en_name: '🇨🇳',
    },
    {
      id: '2',
      name: '翻译为英文',
      name_en: 'Translate to English',
      template: '将以下文本翻译为英文，保持原文的意思、格式和语气：',
      en_name: '🇬🇧',
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

const isGenerating = ref(false)
const abortController = ref(null)

const isTranslationPrompt = ref(false)

const hiddenPrompt = ref('')

// 添加上传对话框的状态控制
const showUploadModal = ref(false)
const uploading = ref(false)

// 修改处理文件导入的函数
async function handleFileUpload(options) {
  const { file } = options
  uploading.value = true

  try {
    // 如果编辑器有内容，显示确认对话框
    if (quill.getText().trim()) {
      // 存储文件引用，稍后使用
      const fileToProcess = file.file

      // 设置为未上传状态，避免进度条显示
      uploading.value = false

      // 显示确认对话框，明确等待用户响应
      window.$dialog.warning({
        title: '警告',
        content: '导入将覆盖编辑器中的现有内容，确定要继续吗？',
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
          // 用户点击确定后再处理文件
          uploading.value = true
          await processImport(fileToProcess)
        },
        onNegativeClick: () => {
          // 用户取消，不做任何处理
          uploading.value = false
        },
        onClose: () => {
          // 对话框关闭，不做任何处理
          uploading.value = false
        },
      })
      return // 在这里返回，不继续处理
    }

    // 如果编辑器为空，直接处理导入
    await processImport(file.file)
  } catch (error) {
    logger.error('导入过程中发生错误:', error)
    window.$message.error('导入失败')
    uploading.value = false
  }
}

// 添加一个专门处理导入的函数
async function processImport(fileObj) {
  try {
    uploading.value = true
    const importer = createImporter()
    const html = await importer.importWordDocument(fileObj)

    quill.setContents([])
    quill.clipboard.dangerouslyPasteHTML(0, html)

    window.$message.success('导入成功')
    showUploadModal.value = false
  } catch (error) {
    logger.error('导入失败:', error)
    window.$message.error('导入失败')
  } finally {
    uploading.value = false
  }
}
const isMobile = ref(false)
const showMobileWarning = ref(false)
function detectMobileDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera
  // 常规移动设备检测
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  // 特别添加iOS检测
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  isMobile.value = mobileRegex.test(userAgent) || isIOS || (isTouchDevice && window.innerWidth < 768)

  if (isMobile.value) {
    showMobileWarning.value = true
  }
}
onMounted(() => {
  detectMobileDevice()
  window.addEventListener('resize', () => {
    const wasMobile = isMobile.value
    detectMobileDevice()
    if (!wasMobile && isMobile.value) {
      showMobileWarning.value = true
    }
  })

  floatingInputRef = document.getElementById('floatingInput')
  verticalMenuRef = document.getElementById('verticalMenu')
  promptInputRef = document.getElementById('promptInput')
  sendBtnRef = document.getElementById('sendBtn')
  aiResponseRef = document.getElementById('aiResponse')
  actionButtonsRef = document.getElementById('actionButtons')

  exportMenuRef = document.getElementById('exportMenu')

  initQuillEditor()

  initMonaco()
  monacoLoaded = true

  // 在 onMounted 中添加新按钮的事件监听
  document.getElementById('insertAfterDiff')?.addEventListener('click', () => {
    if (!diffEditor || !replacementRange) {
      logger.error('No diff editor or replacement range available')
      return
    }

    // 获取修改后的文本
    const modifiedText = diffEditor.getModifiedEditor().getValue()

    // 计算插入位置（在原文内容之后）
    const insertPosition = replacementRange.index + replacementRange.length

    // 使用 renderMarkdownToQuill 插入内容
    renderMarkdownToQuill({
      markdownText: modifiedText,
      quill,
      cursorPosition: insertPosition,
    })

    // 清理高亮和UI状态
    clearHighlight(quill, currentRange)
    closeDiffEditor(diffEditor, true)

    // 重置状态
    replacementRange = null
    currentRange = null
  })
  sendBtnRef.addEventListener('click', async () => {
    if (!isTranslationPrompt.value) {
      const prompt = (hiddenPrompt.value || promptInputRef.value)?.toLowerCase() || ''
      isTranslationPrompt.value
        = prompt.includes('翻译')
          || prompt.includes('translate')
          || prompt.includes('中文')
          || prompt.includes('english')
    }

    if (isGenerating.value && abortController.value) {
      abortController.value.abort()
      sendBtnRef.classList.remove('loading')
      sendBtnRef.innerHTML = '<i class="fas fa-paper-plane send-icon"></i>'
      isGenerating.value = false
      abortController.value = null
      return
    }

    const prompt = hiddenPrompt.value || promptInputRef.value
    if (!prompt) {
      return
    }

    hiddenPrompt.value = ''

    verticalMenuRef.style.display = 'none'
    aiResponseRef.style.display = 'block'
    const responseContent = aiResponseRef.querySelector('.response-content')
    actionButtonsRef.style.display = 'none'

    // aiResponseRef.style.bottom = 'auto'
    aiResponseRef.style.transform = 'none'

    if (responseContent) {
      responseContent.classList.add('loading')
      responseContent.textContent = '正在生成回答...'
    }

    await handleSend({
      promptInputRef,
      promptValue: prompt,
      currentRange,
      quill,
      aiResponseRef,
      actionButtonsRef,
      isGenerating,
      abortController,
      onResponse: (response) => {
        if (!responseContent) {
          return
        }

        if (response.error) {
          responseContent.classList.remove('loading')
          responseContent.textContent = `错误: ${response.errorMessage}`
          return
        }

        responseContent.classList.remove('loading')
        handleResponseUpdate(response.text, responseContent)

        if (
          !actionButtonsRef.style.display
          || actionButtonsRef.style.display === 'none'
        ) {
          actionButtonsRef.style.display = 'flex'
        }
      },
    })
  })

  document.getElementById('insertAfter')?.addEventListener('click', () => {
    if (currentRange) {
      const responseContent = aiResponseRef.querySelector('.response-content')
      if (responseContent) {
        const aiResponseText = responseContent.getAttribute('data-original-text')

        if (aiResponseText) {
          const insertIndex = currentRange.index + currentRange.length
          renderMarkdownToQuill({
            markdownText: aiResponseText,
            quill,
            cursorPosition: insertIndex,
          })

          aiResponseRef.style.display = 'none'
          floatingInputRef.style.display = 'none'
          actionButtonsRef.style.display = 'none'
        }
      }
    }
    const length = quill.getLength()
    quill.formatText(0, length, 'background', false, 'api')
  })

  document.getElementById('replace')?.addEventListener('click', () => {
    const responseContent = aiResponseRef.querySelector('.response-content')
    const aiResponseText = responseContent?.getAttribute('data-original-text')

    if (!currentRange || !aiResponseText) {
      // logger.debug('No selection range or AI response')
      return
    }

    // 先删除选中的内容
    quill.deleteText(currentRange.index, currentRange.length)

    // 然后在原位置插入新内容
    renderMarkdownToQuill({
      markdownText: aiResponseText,
      quill,
      cursorPosition: currentRange.index,
    })

    // 清理UI状态
    clearHighlight(quill, currentRange)
    floatingInputRef.style.display = 'none'
    aiResponseRef.style.display = 'none'
    actionButtonsRef.style.display = 'none'
    currentRange = null
  })

  // 修改后
  document.addEventListener('mouseup', (event) => {
    const target = event.target
    const isInComponents = [
      verticalMenuRef.contains(target),
      floatingInputRef.contains(target),
      aiResponseRef.contains(target),
      document.getElementById('diffContainer')?.contains(target),
      document.querySelector('.n-modal-container')?.contains(target),
      document.querySelector('.n-dialog')?.contains(target),
      document.querySelector('.custom-prompt-item')?.contains(target),
      document.querySelector('.sort-prompt-btn')?.contains(target),
      document.querySelector('.add-prompt-btn')?.contains(target),
    ].some(Boolean)

    if (!isInComponents) {
      setTimeout(() => {
        const selection = quill.getSelection()
        if (!selection || selection.length === 0) {
          clearHighlight(quill, currentRange)
          floatingInputRef.style.display = 'none'
          aiResponseRef.style.display = 'none'
          actionButtonsRef.style.display = 'none'
          verticalMenuRef.style.display = 'none'
          currentRange = null
        }
      }, 0)
    }
  })
  document.getElementById('compare')?.addEventListener('click', () => {
    if (!monacoLoaded) {
      // logger.debug('Monaco Editor is still loading...')
      return
    }

    const selectedText = currentRange
      ? quill.getText(currentRange.index, currentRange.length)
      : ''
    const aiResponseText = aiResponseRef
      .querySelector('.response-content')
      ?.getAttribute('data-original-text') || ''
    if (!selectedText || !aiResponseText) {
      // logger.debug('No selected text or AI response')
      return
    }

    replacementRange = { ...currentRange }
    diffEditor = showDiffEditor({
      currentRange,
      originalText: selectedText,
      modifiedText: aiResponseText,
      diffEditor,
    })
  })

  document.getElementById('confirmReplace')?.addEventListener('click', () => {
    if (!diffEditor || !replacementRange) {
      logger.error('No diff editor or replacement range available')
      return
    }

    const modifiedText = diffEditor.getModifiedEditor().getValue()
    insertContent({
      quill,
      text: modifiedText,
      startIndex: replacementRange.index,
      isMarkdown: true,
      isReplace: true,
      currentRange: replacementRange,
    })

    clearHighlight(quill, currentRange)
    closeDiffEditor(diffEditor, true)

    // 重置状态
    replacementRange = null
    currentRange = null
  })

  document.getElementById('cancelReplace')?.addEventListener('click', () => {
    closeDiffEditor(diffEditor)
    posCloseToBottom = false
  })

  document
    .getElementById('aiResponseCopyBtn')
    ?.addEventListener('click', () => {
      const responseContent = aiResponseRef.querySelector('.response-content')?.textContent

      if (responseContent) {
        navigator.clipboard.writeText(responseContent).then(() => {
          const copyBtn = document.getElementById('aiResponseCopyBtn')
          const originalText = copyBtn.innerHTML

          copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制'

          setTimeout(() => {
            copyBtn.innerHTML = originalText
          }, 2000)
        })
      }
    })

  document
    .getElementById('aiResponseRegenerateBtn')
    ?.addEventListener('click', () => {
      const responseContent = aiResponseRef.querySelector('.response-content')
      const prompt = hiddenPrompt.value || promptInputRef.value

      handleRegenerate({
        currentSession: currentSession.value,
        promptInputRef,
        promptValue: prompt,
        currentRange,
        quill,
        aiResponseRef,
        actionButtonsRef,
        isGenerating,
        abortController,
        onResponse: (response) => {
          if (!responseContent) {
            return
          }
          handleResponseUpdate(response.text, responseContent)
        },
      })
    })
  document.addEventListener('click', (e) => {
    const exportButton = document.querySelector('.ql-export')
    if (
      !exportMenuRef?.contains(e.target)
      && !exportButton?.contains(e.target)
    ) {
      exportMenuRef.style.display = 'none'
    }
  })
  document.querySelectorAll('.export-menu-item')?.forEach((item) => {
    item.addEventListener('click', async () => {
      try {
        const format = item.dataset.format
        if (!format) {
          logger.error('No format specified for export')
          return
        }

        const content = quill?.root?.innerHTML || ''

        const quillInstance = quill
        const exporter = createExporter(content, quillInstance)
        await exporter.exportAs(format)
        exportMenuRef.style.display = 'none'
      } catch (error) {
        const format = item.dataset.format

        ErrorHandler.handle(new AppError(
          ErrorCode.EXPORT_ERROR,
          `导出为 ${format} 格式失败`,
          error,
        ))
      }
    })
  })

  document.getElementById('aiResponse').addEventListener('click', (e) => {
    if (e.target.closest('#compare') && isTranslationPrompt.value) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  })
})

Quill.register(
  {
    'modules/tableUI': QuillTableUI.default,
  },
  true,
)

function initQuillEditor() {
  try {
    nextTick(async () => {
      const editorElement = document.getElementById('editor')
      if (!editorElement) {
        logger.error('Editor element not found')
        return
      }
      const options = {
        modules: {
          table: true,
          tableUI: true,
          toolbar: {
            container: [
              ['undo', 'redo'],
              [{
                header: [false, 1, 2, 3],
              }],
              ['bold', 'italic', 'underline'],
              [{ color: [] }],
              [{ align: [] }],
              ['link'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['table'],
              ['copy-content'],
              ['import'],
              ['export'],
            ],
            handlers: {
              'undo': function () {
                quill.history.undo()
                setTimeout(() => {
                  document.querySelectorAll('.highlight-overlay').forEach(el => el.remove())
                }, 0)
              },
              'redo': function () {
                quill.history.redo()
                setTimeout(() => {
                  document.querySelectorAll('.highlight-overlay').forEach(el => el.remove())
                }, 0)
              },
              'export': function () {
                showExportMenu({ exportMenuRef })
              },
              'table': function () {
                quill.getModule('table').insertTable(3, 3)
              },
              'copy-content': function () {
                copyAsMarkdown(quill)
              },
              'import': function () {
                showUploadModal.value = true
              },
            },
          },
          history: {
            delay: 1000,
            maxStack: 5000,
            userOnly: false,
          },
        },
        placeholder: '在这里输入内容，或者使用 / 唤起AI',
        theme: 'snow',
      }

      quill = new Quill(editorElement, options)
      quill.root.innerHTML = ''

      // 只有在会话已初始化且有ID时才尝试加载内容
      /*  if (currentSession.value?.id) {
        const savedContent = await loadEditorContent(currentSession.value.id)

        if (savedContent !== null && savedContent !== undefined) {
          quill.root.innerHTML = savedContent
        }
      } */

      // 初始化时设置暗黑模式
      /*       if (appStore.isDark) {
        editorElement.closest('.editor-container')?.classList.add('dark-mode')
      } */
      const fixPlaceholderWithIME = () => {
        const editorElement = quill.root

        // 监听 compositionstart 事件（输入法输入开始）
        editorElement.addEventListener('compositionstart', () => {
          // 添加一个临时的空格以触发 placeholder 隐藏
          if (quill.getText().trim() === '') {
            quill.root.classList.add('hiding-placeholder')
          }
        })

        // 监听 compositionend 事件（输入法输入结束）
        editorElement.addEventListener('compositionend', () => {
          // 如果输入被取消且内容为空，恢复 placeholder
          setTimeout(() => {
            if (quill.getText().trim() === '') {
              quill.root.classList.remove('hiding-placeholder')
            }
          }, 0)
        })

        // 监听 blur 事件（失去焦点）确保状态正确
        editorElement.addEventListener('blur', () => {
          if (quill.getText().trim() === '') {
            quill.root.classList.remove('hiding-placeholder')
          }
        })
      }

      fixPlaceholderWithIME()

      // 使用 nextTick 确保 DOM 已更新
      nextTick(() => {
        toolbar = quill.getModule('toolbar').container
        if (toolbar) {
          const elements = createTimeAndWordCountDisplay(toolbar, quill)
          creationTimeDisplay = elements.creationTimeDisplay
          wordCountDisplay = elements.wordCountDisplay

          // 确保两个显示元素都存在后再调用更新函数
          if (creationTimeDisplay && wordCountDisplay) {
            updateCreationTimeDisplay(creationTimeDisplay)
            updateWordCountDisplay(wordCountDisplay, quill)
          }
        }
      })
      updateToolbarTooltips()
      quill.on('selection-change', (range, _oldRange, _source) => {
        if (range && range.length > 0) {
          if (currentRange) {
            // 只有当新选区不同于当前选区时才清除高亮
            if (
              currentRange.index !== range.index
              || currentRange.length !== range.length
            ) {
              clearHighlight(quill, currentRange)
            }
          }

          // 保存新的选区
          currentRange = range
          highlightSelection(quill, range)

          const bounds = quill.getBounds(range.index, range.length)
          const editorContainer = document.querySelector('#editor')
          const quillContainer = quill.container

          const containerRect = editorContainer.getBoundingClientRect()
          const quillRect = quillContainer.getBoundingClientRect()

          // 计算相对于编辑器容器的位置
          const leftPosition = quillRect.left - containerRect.left

          // 修改：计算顶部位置，将输入框放在选区的下方
          const y = bounds.top + bounds.height + 42
          const maxTop = containerRect.height - 320
          const minTop = 47 + 320
          const resversed = y > maxTop
          const adjustTop = resversed
            ? Math.min(Math.max(minTop, y), containerRect.height - 5)
            : Math.max(Math.min(maxTop, y), 47)

          floatingInputRef.style.display = 'block'
          floatingInputRef.style.position = 'absolute'
          floatingInputRef.style.left = `${leftPosition + 30}px`
          verticalMenuRef.style.display = 'block'
          verticalMenuRef.style.position = 'absolute'
          verticalMenuRef.style.left = `${leftPosition + 30}px`

          if (resversed) {
            floatingInputRef.style.top = 'auto'
            floatingInputRef.style.bottom = `${containerRect.height - adjustTop + floatingInputRef.offsetHeight + 5}px`
          } else {
            floatingInputRef.style.top = `${adjustTop + 5}px`
            floatingInputRef.style.bottom = 'auto'
          }

          if (resversed) {
            verticalMenuRef.style.top = `auto`
            verticalMenuRef.style.bottom = `${containerRect.height - adjustTop + floatingInputRef.offsetHeight * 2 + 10}px`
          } else {
            verticalMenuRef.style.top = `${adjustTop + floatingInputRef.offsetHeight + 10}px`
            verticalMenuRef.style.bottom = 'auto'
          }

          // 设置输入框宽度
          const editorWidth = quillRect.width;
          [floatingInputRef, aiResponseRef].forEach((element) => {
            if (element) {
              element.style.width = `${editorWidth - 60}px`
              element.style.maxWidth = '920px'
            }
          })

          // AI响应区域位置调整
          aiResponseRef.style.display = 'none'
          aiResponseRef.style.position = 'absolute'
          if (resversed) {
            aiResponseRef.style.top = `auto`
            aiResponseRef.style.bottom = `${floatingInputRef.offsetHeight + 5}px`
          } else {
            aiResponseRef.style.top = `${floatingInputRef.offsetHeight + 5}px`
            aiResponseRef.style.bottom = 'auto'
          }

          // // 确保元素在视口内可见
          // nextTick(() => {
          //   ensureElementsVisible([floatingInputRef, verticalMenuRef], editorContainer)
          // })
        } else if (!range) {
          // 检查点击是否在相关组件内
          const isInRelevantComponent = floatingInputRef.contains(document.activeElement)
            || verticalMenuRef.contains(document.activeElement)
            || aiResponseRef.contains(document.activeElement)
            || document.activeElement?.id === 'promptInput'

          if (!isInRelevantComponent) {
            clearHighlight(quill, currentRange)
            currentRange = null
            floatingInputRef.style.display = 'none'
            aiResponseRef.style.display = 'none'
            verticalMenuRef.style.display = 'none'
          }
        }
      })
      quill.on('text-change', async (delta, oldDelta, source) => {
        // 保存内容到服务器
        /* if (currentSession.value?.id) {
          saveEditorContent(quill.root.innerHTML, currentSession.value.id)
          clearTimeout(window.titleUpdateTimer)

          window.titleUpdateTimer = setTimeout(async () => {
            await updateSessionTitle()
          }, 2000) // 2秒后执行，减少API调用频率
        } */
        if (source === 'user') {
          // 使用 setTimeout 确保在渲染完成后再清除高亮
          setTimeout(() => {
            // // logger.debug("text-change的样式重置执行了");
            // 清除所有背景色样式
            const length = quill.getLength()
            quill.formatText(0, length, 'background', false, 'api')

            // 重置状态和隐藏界面元素
            document.querySelectorAll('.highlight-overlay').forEach(el => el.remove())
            currentRange = null
            floatingInputRef.style.display = 'none'
            aiResponseRef.style.display = 'none'
            verticalMenuRef.style.display = 'none'
            actionButtonsRef.style.display = 'none'
            promptInputRef.value = ''
            posCloseToBottom = false
          }, 0)
        }
        updateWordCountDisplay(wordCountDisplay, quill)
        if (delta.ops.some(op => op.insert || op.delete)) {
          // 添加空值检查
          if (creationTimeDisplay) {
            updateCreationTimeDisplay(creationTimeDisplay)
          }
        }

        checkEmptyLine(quill, {
          floatingInputRef,
          verticalMenuRef,
          aiResponseRef,
          actionButtonsRef,
          promptInputRef,
        })
      })
      quill.root.addEventListener('keydown', async (e) => {
        if (e.key === '/') {
          const selection = quill.getSelection()
          if (!selection) {
            return
          }

          const [line, _offset] = quill.getLine(selection.index)
          const text = line.domNode.textContent

          // 检查是否在空行
          if (!text.trim()) {
            e.preventDefault() // 阻止/字符的输入

            // 如果还没有session，先初始化
            // if (!currentSession.value?.id) {
            //   initSession()
            // }

            currentRange = showAIMenu({
              quill,
              currentRange,
              floatingInputRef,
              verticalMenuRef,
              handleOutsideClick: event =>
                handleOutsideClick({
                  event,
                  floatingInputRef,
                  verticalMenuRef,
                  hideUI,
                }),
            })
            // 在设置完位置后，自动聚焦到输入框
            nextTick(() => {
              promptInputRef?.focus()
            })
          }
        }
      })
    })
  } catch (error) {
    logger.error('Error initializing Quill editor:', error)
  }
}

onBeforeUnmount(() => {
  // 移除事件监听器

  if (abortController.value) {
    abortController.value.abort()
  }
})

// 添加自动调整高度的函数
function autoResize(event) {
  const textarea = event.target
  // 只有当内容包含换行符时才调整高度
  if (textarea.value.includes('\n')) {
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  } else {
    textarea.style.height = '2.5rem' // 单行时保持固定高度
  }
}

// 添加按键处理函数
function handlePromptKeydown(e) {
  if (e.key === 'Enter') {
    if (e.shiftKey) {
      // Shift + Enter: 换行
      e.preventDefault()
      const input = e.target
      const start = input.selectionStart
      const end = input.selectionEnd
      input.value = `${input.value.substring(0, start)}\n${input.value.substring(end)}`
      input.selectionStart = input.selectionEnd = start + 1
    } else {
      // Enter: 触发发送
      e.preventDefault()
      sendBtnRef?.click()
    }
  }
}

function handleResponseUpdate(text, responseContent) {
  if (!responseContent) {
    return
  }
  responseContent.classList.add('markdown-body')
  responseContent.style.display = 'block'
  responseContent.style.alignItems = 'flex-start'

  // 规范化文本中的空白字符 - 添加这一行
  text = text.replace(/(\w+)\s+(\d+)/g, '$1 $2') // 修复"Source 1"类型的断开
  // 保存原始的 markdown 文本（确保在渲染之前保存）
  responseContent.setAttribute('data-original-text', text)
  // // logger.debug('responseContent', responseContent)
  // 处理 LaTeX 数学公式的特殊字符
  const processedText = text
    .replace(/^(\d+)\.\s/gm, '$1\\. ') // 保护有序列表的数字
    .replace(/\\\(/g, '$') // 将 \( 转换为 $
    .replace(/\\\)/g, '$') // 将 \) 转换为 $
    .replace(/\\\[/g, '$$') // 将 \[ 转换为 $$
    .replace(/\\\]/g, '$$') // 将 \] 转换为 $$
    .trim()

  // 渲染处理后的文本
  responseContent.innerHTML = renderMarkdown(processedText)
}

function handleMenuItemClick(prompt) {
  if (sendBtnRef) {
    hiddenPrompt.value = prompt.template
    promptInputRef.value = ''

    isTranslationPrompt.value
      = prompt.name.includes('翻译')
        || (prompt.name_en && prompt.name_en.toLowerCase().includes('translate'))
        || prompt.name.includes('中文')
        || (prompt.name_en && prompt.name_en.toLowerCase().includes('english'))

    sendBtnRef.click()
  }
}
function updateEditorPlaceholder() {
  setTimeout(() => {
    if (!quill) {
      return
    }

    const container = quill.container
    if (!container) {
      return
    }

    const placeholderElement = container.querySelector('.ql-editor[data-placeholder]')
    if (placeholderElement) {
      const newPlaceholder = '在这里输入内容，或者使用 / 唤起AI'
      placeholderElement.setAttribute('data-placeholder', newPlaceholder)
    }

    // AI提示输入框的placeholder
    const promptInput = document.getElementById('promptInput')
    if (promptInput) {
      promptInput.setAttribute('placeholder', '请输入内容')
    }

    // 更新字数统计显示
    if (wordCountDisplay) {
      updateWordCountDisplay(wordCountDisplay, quill)
    }

    // 更新创建时间显示
    if (creationTimeDisplay) {
      updateCreationTimeDisplay(creationTimeDisplay)
    }
  }, 100) // 增加延迟时间
}
function updateToolbarTooltips() {
  setTimeout(() => {
    const toolbarElement = toolbar || document.querySelector('.ql-toolbar')
    if (!toolbarElement) {
      return
    }

    const toolbarButtons = {
      '.ql-header': '标题',
      '.ql-bold': '加粗',
      '.ql-italic': '斜体',
      '.ql-underline': '下划线',
      '.ql-align': '对齐',
      '.ql-link': '插入链接',
      '.ql-list[value="ordered"]': '有序列表',
      '.ql-list[value="bullet"]': '无序列表',
      '.ql-table': '插入表格',
      '.ql-export': '导出',
      '.ql-import': '导入',
      '.ql-copy-content': '复制内容',
      '.ql-undo': '撤销',
      '.ql-redo': '重做',
      '.ql-color': '文字颜色',
    }

    Object.entries(toolbarButtons).forEach(([selector, tooltip]) => {
      const button = toolbar.querySelector(selector)
      if (button) {
        button.classList.add('tooltip')
        button.setAttribute('data-tooltip', tooltip)
      }
    })
  }, 100)
}
onBeforeUnmount(() => {
  if (abortController.value) {
    abortController.value.abort()
  }
})
</script>

<template>
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
        <NIcon size="48" color="#faad14">
          <p style="font-size: 0.9em; color: #666;">
            <i class="fas fa-mobile-alt" aria-hidden="true" />&nbsp;{{ t('ai_editing.mobile_warning') }}
          </p>
        </NIcon>
      </div>
    </NCard>
  </NModal>
  <div class="writing-editor flex-1 overflow-hidden flex flex-col notranslate">
    <div class="editor-container flex-1 overflow-auto">
      <div id="editor" />
      <div id="floatingInput" class="floating-input" tabindex="0">
        <div class="input-container">
          <textarea
            id="promptInput"
            :placeholder="请输入内容"
            rows="1"
            @input="autoResize"
            @keydown="handlePromptKeydown"
          />
          <button id="sendBtn" class="send-btn">
            <i class="fas fa-paper-plane send-icon" />
          </button>
        </div>
        <div id="aiResponse" class="ai-response">
          <div class="response-content" />
          <div id="actionButtons" class="action-buttons">
            <div class="left-buttons">
              <button id="insertAfter">
                <i class="fas fa-plus" />
                {{ "插入到后面" }}
              </button>
              <button id="replace">
                <i class="fas fa-exchange-alt" />
                {{ "替换内容" }}
              </button>
              <button v-show="!isTranslationPrompt" id="compare">
                <i class="fas fa-code-compare" />
                {{ "原文对比" }}
              </button>
            </div>
            <div class="right-buttons">
              <button id="aiResponseRegenerateBtn">
                <i class="fas fa-sync-alt" />
                {{ "重新生成" }}
              </button>
              <button id="aiResponseCopyBtn">
                <i class="fas fa-copy" />
                {{ "复制" }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div id="verticalMenu" class="vertical-menu" tabindex="0">
        <!-- 系统提示词面板 -->
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
    </div>
    <div id="exportMenu" class="export-menu">
      <div class="export-menu-item" data-format="markdown">
        {{ "导出为markdown" }}
      </div>
      <div class="export-menu-item" data-format="docx">
        {{ "导出为docx" }}
      </div>
      <!--
      <div class="export-menu-item" data-format="pdf">
        {{ "导出为PDF" }}
      </div>
      -->
    </div>
    <div id="diffContainer" style="display: none">
      <div id="diffWrapper">
        <div id="diffEditor" />
        <div class="diff-actions">
          <button id="insertAfterDiff" class="diff-btn insert">
            {{ "插入到后面" }}
          </button>
          <button id="confirmReplace" class="diff-btn confirm">
            {{ "确认替换" }}
          </button>
          <button id="cancelReplace" class="diff-btn cancel">
            {{ "取消" }}
          </button>
        </div>
      </div>
    </div>
    <!-- 添加上传对话框 -->
    <NModal v-model:show="showUploadModal">
      <NCard
        style="width: 500px"
        :title="导入文件"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <NUpload
          :custom-request="handleFileUpload"
          accept=".docx,.doc"
          :max="1"
          :disabled="uploading"
        >
          <NUploadDragger>
            <div style="margin-bottom: 12px">
              <n-icon size="48" depth="3">
                <i class="fas fa-file-upload" />
              </n-icon>
            </div>
            <NText style="font-size: 16px">
              点击或拖拽文件到此区域进行上传
            </NText>
            <n-p depth="3" style="margin: 8px 0 0">
              支持 .doc 和 .docx 格式的文件
            </n-p>
          </NUploadDragger>
        </NUpload>

        <template #footer>
          <NSpace justify="end">
            <NButton
              :disabled="uploading"
              @click="showUploadModal = false"
            >
              取消
            </NButton>
          </NSpace>
        </template>
      </NCard>
    </NModal>
  </div>
</template>

<style src="./style.less" lang="less"></style>
