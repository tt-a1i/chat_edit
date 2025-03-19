import MarkdownIt from 'markdown-it'
import type { editor } from 'monaco-editor'
import * as monaco from 'monaco-editor'
import type Quill from 'quill'
import type { Ref } from 'vue'
import { nextTick } from 'vue'
import { createExporter } from './export'
import { defaultDiffEditorOptions } from './monacoConfig'
import * as AIEditingAPI from './api.ts'

interface DiffEditorParams {
  currentRange: { index: number, length: number } | null
  originalText: string
  modifiedText: string
  diffEditor: editor.IStandaloneDiffEditor | null
  quill?: Quill // 添加 quill 参数
  onAccept?: () => void // 添加确认回调
}

export function showDiffEditor({
  currentRange,
  originalText,
  modifiedText,
  diffEditor,
  quill,
  onAccept,
}: DiffEditorParams) {
  if (!currentRange) {
    // eslint-disable-next-line no-console
    console.log('No selection range available')
    return null
  }

  const container = document.getElementById('diffContainer')
  const editorElement = document.getElementById('diffEditor')
  const acceptButton = document.getElementById('acceptDiffButton')

  if (!container || !editorElement) {
    console.error('Required DOM elements not found')
    return null
  }

  container.style.display = 'flex'

  if (diffEditor) {
    diffEditor.dispose()
    diffEditor = null
  }
  // 使用更精确的样式控制
  const styleElement = document.createElement('style')
  styleElement.id = 'diff-editor-style'
  styleElement.textContent = `
    /* 完全移除所有行级和区域背景色 */
    .monaco-editor .view-overlays .inline-deleted,
    .monaco-editor .view-overlays .inline-added,
    .monaco-diff-editor .line-insert,
    .monaco-diff-editor .line-delete,
    .monaco-editor .view-line,
    .monaco-diff-editor .view-line,
    .monaco-diff-editor .diagonal-fill,
    .monaco-editor .margin {
      background: none !important;
    }
    
    /* 移除光标所在行的背景色 - 增强版本 */
    .monaco-editor .current-line,
    .monaco-editor .view-overlays .current-line,
    .monaco-editor .margin-view-overlays .current-line-margin,
    .monaco-editor .line-highlight,
    .monaco-editor .focused-line,
    .monaco-editor .view-overlays .focused-line,
    .monaco-editor .view-overlays .current-line-both,
    .monaco-editor .view-lines .view-line.focused,
    .monaco-editor .view-overlays .view-line .current-line,
    .monaco-editor .view-overlays .view-line:has(.cursor),
    .monaco-editor .view-line[class*="current-line"],
    .monaco-editor .view-lines .view-line.current-line {
      background-color: transparent !important;
      border: none !important;
      outline: none !important;
    }
    
    /* 移除行号区域高亮 */
    .monaco-editor .margin-view-overlays .current-line-margin,
    .monaco-editor .margin-view-overlays .current-line {
      background-color: transparent !important;
      border: none !important;
    }
    
    /* 只为删除的字符添加更明显的背景色 */
    .monaco-editor .char-delete,
    .monaco-diff-editor .char-delete {
      background-color: rgba(255, 0, 0, 0.4) !important;
      border: none !important;
      outline: none !important;
      margin: 0 !important;
      padding: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }
    
    /* 只为新增的字符添加更明显的背景色 */
    .monaco-editor .char-insert,
    .monaco-diff-editor .char-insert {
      background-color: rgba(108, 175, 54, 0.5) !important;
      border: none !important;
      outline: none !important;
      margin: 0 !important;
      padding: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }

    /* 移除所有边框和装饰元素 */
    .monaco-editor .inline-deleted-margin-view-zone,
    .monaco-editor .inline-added-margin-view-zone,
    .monaco-diff-editor .margin-view-zones,
    .monaco-diff-editor .margin-view-overlay {
      display: none !important;
    }
    
    /* 确保标点符号周围没有任何装饰 */
    .monaco-editor .contentWidgets,
    .monaco-editor .overlayWidgets {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
    }
    
    /* 确保编辑器整体没有多余的边框和背景 */
    .monaco-editor,
    .monaco-diff-editor {
      border: none !important;
      background: transparent !important;
    }
  `
  document.head.appendChild(styleElement)
  const newDiffEditor = monaco.editor.createDiffEditor(
    editorElement,
    {
      ...defaultDiffEditorOptions,
      renderWhitespace: 'none', // 不显示空白字符
      unicodeHighlight: {
        nonBasicASCII: false,
        invisibleCharacters: false,
        ambiguousCharacters: false,
      },
      // 使用严格的文本处理模式
      useTabStops: false,
      trimAutoWhitespace: false,
      autoIndent: 'none',
    },
  )

  const safeOriginalText = originalText || ''

  try {
    const originalModel = monaco.editor.createModel(
      safeOriginalText,
      'plaintext', // 使用plaintext而不是text/plain
      monaco.Uri.parse('original.txt'), // 添加URI避免语言检测
    )
    const modifiedModel = monaco.editor.createModel(
      modifiedText,
      'plaintext', // 使用plaintext而不是text/plain
      monaco.Uri.parse('modified.txt'), // 添加URI避免语言检测
    )

    newDiffEditor.setModel({
      original: originalModel,
      modified: modifiedModel,
    })

    // 获取修改文本的编辑器实例
    const modifiedEditor = newDiffEditor.getModifiedEditor()
    setTimeout(() => {
      // 使用Monaco API清除选择
      modifiedEditor.setSelection(new monaco.Range(1, 1, 1, 1))

      // 强制更新视图
      modifiedEditor.render(true)
      modifiedEditor.focus()

      // 禁用编辑器的选择高亮功能
      modifiedEditor.updateOptions({
        renderValidationDecorations: 'off',
        selectionHighlight: false,
        occurrencesHighlight: false,
        renderLineHighlight: 'none',
        renderIndentGuides: false,
      })
    }, 0)

    // 完全替换默认的删除行为
    const domNode = modifiedEditor.getDomNode()
    if (domNode) {
      // 向DOM节点添加键盘事件监听器，在事件捕获阶段就拦截它
      domNode.addEventListener('keydown', (e) => {
        // 如果是删除键或退格键
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.stopPropagation() // 阻止事件冒泡
          e.preventDefault() // 阻止默认行为

          // 手动处理删除
          const selection = modifiedEditor.getSelection()
          const model = modifiedEditor.getModel()

          if (!selection || !model)
            return

          // 如果有文本选择，删除选择的内容
          if (!selection.isEmpty()) {
            model.pushEditOperations(
              [],
              [{
                range: selection,
                text: '',
              }],
              () => null,
            )
            return
          }

          // 获取光标位置
          const position = selection.getPosition()

          // 根据是删除键还是退格键，计算要删除的范围
          const range = e.key === 'Backspace'
            ? new monaco.Range(
              position.lineNumber,
              Math.max(1, position.column - 1),
              position.lineNumber,
              position.column,
            )
            : new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column + 1,
            )

          // 检查要删除的是否是换行符
          if (e.key === 'Backspace' && position.column === 1 && position.lineNumber > 1) {
            // 特殊处理跨行退格
            const prevLine = position.lineNumber - 1
            const prevColumn = model.getLineMaxColumn(prevLine)
            model.pushEditOperations(
              [],
              [{
                range: new monaco.Range(prevLine, prevColumn, position.lineNumber, 1),
                text: '',
              }],
              () => null,
            )
            return
          }

          // 执行删除一个字符的操作
          model.pushEditOperations(
            [],
            [{
              range,
              text: '',
            }],
            () => null,
          )
        }
      }, true) // 注意这里的true，表示在捕获阶段处理事件
    }

    // 添加确认按钮的点击事件处理
    if (acceptButton) {
      acceptButton.onclick = () => {
        if (quill && currentRange) {
          // 获取修改后的文本
          const modifiedText = newDiffEditor.getModifiedEditor().getValue()
          // 更新 quill 编辑器的内容
          quill.deleteText(currentRange.index, currentRange.length)
          quill.insertText(currentRange.index, modifiedText)
        }
        // 关闭对比编辑器
        closeDiffEditor(newDiffEditor)
        // 调用确认回调
        onAccept?.()
      }
    }

    nextTick(() => {
      modifiedEditor?.focus()
    })
    const originalDispose = newDiffEditor.dispose.bind(newDiffEditor)
    newDiffEditor.dispose = () => {
      document.getElementById('diff-editor-style')?.remove()
      originalDispose()
    }
    return newDiffEditor
  }
  catch (error) {
    console.error('Error creating diff editor:', error)
    return null
  }
}

export function closeDiffEditor(
  diffEditor: editor.IStandaloneDiffEditor | null,
  hideAIElements: boolean = false,
) {
  const container = document.getElementById('diffContainer')
  if (container) {
    container.style.display = 'none'
  }

  if (hideAIElements) {
    const floatingInputRef = document.getElementById('floatingInput')
    const aiResponseRef = document.getElementById('aiResponse')
    const actionButtonsRef = document.getElementById('actionButtons')

    if (floatingInputRef)
      floatingInputRef.style.display = 'none'
    if (aiResponseRef)
      aiResponseRef.style.display = 'none'
    if (actionButtonsRef)
      actionButtonsRef.style.display = 'none'
  }

  if (diffEditor) {
    try {
      const models = diffEditor.getModel()
      if (models) {
        models.original?.dispose()
        models.modified?.dispose()
      }
      diffEditor.dispose()
    }
    catch (error) {
      console.error('Error disposing editor:', error)
    }
  }
}
export function highlightSelection(
  quill: Quill,
  range: { index: number, length: number },
) {
  if (!range || range.length === 0)
    return

  // 添加自定义 CSS 类到编辑器根元素，用于标记高亮状态
  const editorRoot = quill.root

  // 记住当前选择
  const savedSelection = { ...range }

  // 创建自定义 CSS 选择器覆盖层
  const highlightOverlay = document.createElement('div')
  highlightOverlay.className = 'highlight-overlay'
  highlightOverlay.setAttribute('data-start', String(range.index))
  highlightOverlay.setAttribute('data-length', String(range.length))

  // 定位覆盖层与选中内容重叠
  const bounds = quill.getBounds(range.index, range.length)
  Object.assign(highlightOverlay.style, {
    position: 'absolute',
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
    backgroundColor: 'rgba(180, 213, 254, 0.5)',
    pointerEvents: 'none', // 保证不影响点击
    zIndex: '1',
  })

  // 移除之前的高亮
  document.querySelectorAll('.highlight-overlay').forEach(el => el.remove())

  // 添加新的高亮层
  editorRoot.parentNode.insertBefore(highlightOverlay, editorRoot.nextSibling)

  // 保存范围信息，用于后续清除
  editorRoot.dataset.highlightedRange = JSON.stringify(savedSelection)
}

export function clearHighlight(
  quill: Quill,
  currentRange: { index: number, length: number },
) {
  if (!currentRange)
    return

  // 检查是否在相关组件中
  const isInRelevantComponent = document.activeElement?.id === 'promptInput'
    || document.activeElement?.closest('.floating-input')
    || document.activeElement?.closest('.vertical-menu')
    || document.activeElement?.closest('.ai-response')
    || document.activeElement?.closest('.ql-picker')
    || document.activeElement?.closest('.ql-color')
    || document.activeElement?.closest('.ql-background')

  if (!isInRelevantComponent) {
    // 移除所有高亮覆盖层
    document.querySelectorAll('.highlight-overlay').forEach(el => el.remove())

    // 清除存储的范围信息
    if (quill.root.dataset.highlightedRange) {
      delete quill.root.dataset.highlightedRange
    }
  }
  if (quill.root.dataset.highlightedRange) {
    delete quill.root.dataset.highlightedRange
  }
}
export function getCurrentTime() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0') // 月份从 0 开始
  const year = now.getFullYear()
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
export function createTimeAndWordCountDisplay(
  toolbar: HTMLElement,
) {
  if (!toolbar) {
    console.error('Toolbar not initialized')
    return
  }

  const creationTimeDisplay = document.createElement('span')
  creationTimeDisplay.id = 'creationTimeDisplay'
  creationTimeDisplay.classList.add('ql-creation-time') // 添加 CSS 类，方便样式控制
  // toolbar.prepend(creationTimeDisplay) // 将创建时间显示元素添加到工具栏的 *最前面*

  // 创建显示字数统计的 span 元素
  const wordCountDisplay = document.createElement('span')
  wordCountDisplay.id = 'wordCountDisplay'
  wordCountDisplay.classList.add('ql-word-count') // 添加 CSS 类，方便样式控制
  toolbar.append(wordCountDisplay)

  return { creationTimeDisplay, wordCountDisplay }
}
export function updateCreationTimeDisplay(
  creationTimeDisplay: HTMLElement | null,
) {
  // Add null check
  if (!creationTimeDisplay)
    return

  const currentTime = getCurrentTime()
  creationTimeDisplay.textContent = `最近修改: ${currentTime}`
}

export function updateWordCountDisplay(wordCountDisplay: HTMLElement | null, quill: any) {
  // 添加空值检查
  if (!wordCountDisplay || !quill)
    return

  const text = quill.getText()
  // 移除所有空白字符后计算字数
  const wordCount = text
    .replace(
      /[\u3002\uFF01\uFF0C\uFF1A\uFF1B\uFF1F\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]/g,
      '',
    ) // 移除标点符号
    .replace(/\s+/g, '') // 移除所有空格
    .replace(/[^\u4E00-\u9FA5a-z0-9]/gi, '').length // 移除特殊符号

  const title = `字数：${wordCount}`
  wordCountDisplay.textContent = title
}
export function checkEmptyLine(
  quill: Quill,
  uiElements: HideAIUIParams, // 修改参数类型
) {
  const selection = quill.getSelection()
  if (!selection)
    return

  const [line] = quill.getLine(selection.index)
  const text = line.domNode.textContent

  // 如果不是空行，隐藏AI相关UI
  if (!text.trim()) {
    hideAIUI(uiElements) // 传递UI元素参数
  }
}
interface AIMenuParams {
  quill: Quill
  currentRange: { index: number, length: number } | null
  floatingInputRef: HTMLElement
  verticalMenuRef: HTMLElement
  handleOutsideClick: (event: MouseEvent) => void
}
export function showAIMenu({
  quill,
  currentRange,
  floatingInputRef,
  verticalMenuRef,
  handleOutsideClick,
}: AIMenuParams) {
  const selection = quill.getSelection()
  if (!selection)
    return

  currentRange = { index: selection.index, length: selection.length }
  const bounds = quill.getBounds(selection.index)
  const editorContainer = document.querySelector('.editor-container')
  const editorContentRect = quill.root.getBoundingClientRect()

  // 获取编辑器容器的边界信息
  const containerRect = editorContainer.getBoundingClientRect()

  // 计算基础位置
  const leftPosition = editorContentRect.left - containerRect.left

  // 判断是否是空行按/唤起
  const [line] = quill.getLine(selection.index)
  const isEmptyLine = !line.domNode.textContent.trim()

  // 如果是空行按/唤起，额外增加一个行高的偏移
  const lineHeight = isEmptyLine ? bounds.height + 25 : 0
  const topPosition = bounds.top + bounds.height + lineHeight + 5;

  // 设置浮动输入框和垂直菜单的位置
  [floatingInputRef, verticalMenuRef].forEach((el) => {
    el.style.display = 'block'
    el.style.position = 'absolute'
    el.style.left = `${leftPosition + 20}px` // 保持原有的左侧padding
  })

  // 设置垂直位置
  floatingInputRef.style.top = `${topPosition}px`
  verticalMenuRef.style.top = `${
    topPosition + floatingInputRef.offsetHeight + 5
  }px`

  // AI响应区域也需要设置相同的宽度
  const aiResponseRef = document.querySelector('.ai-response')
  if (aiResponseRef) {
    aiResponseRef.style.width = floatingInputRef.style.width
    // aiResponseRef.style.left = floatingInputRef.style.left;
  }

  // 确保元素在视口内可见，如果需要则滚动容器
  setTimeout(() => {
    const editorContainer = document.querySelector('.editor-container')
    ensureElementsVisible([floatingInputRef, verticalMenuRef], editorContainer)
  }, 0)

  // 监听点击事件
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick)
  }, 0)

  // 在设置位置之后，找到输入框并聚焦
  const promptInput = floatingInputRef.querySelector('#promptInput') as HTMLElement
  if (promptInput) {
    setTimeout(() => {
      promptInput.focus()
    }, 0)
  }

  return currentRange
}
interface HideAIUIParams {
  floatingInputRef: HTMLElement
  verticalMenuRef: HTMLElement
  aiResponseRef: HTMLElement
  actionButtonsRef: HTMLElement
  promptInputRef: HTMLInputElement
}

export function hideAIUI({
  floatingInputRef,
  verticalMenuRef,
  aiResponseRef,
  actionButtonsRef,
  promptInputRef,
}: HideAIUIParams) {
  // console.log("HideAIUI执行了");
  floatingInputRef.style.display = 'none'
  verticalMenuRef.style.display = 'none'
  aiResponseRef.style.display = 'none'
  actionButtonsRef.style.display = 'none'
  promptInputRef.value = ''
}
interface HandleOutsideClickParams {
  event: MouseEvent
  floatingInputRef: HTMLElement
  verticalMenuRef: HTMLElement
  hideUI: () => void
}

export function handleOutsideClick({
  event,
  floatingInputRef,
  verticalMenuRef,
  hideUI,
}: HandleOutsideClickParams) {
  const isClickInside = floatingInputRef.contains(event.target as Node)
    || verticalMenuRef.contains(event.target as Node)
    || (event.target as Element).closest('.ql-editor')

  if (!isClickInside) {
    hideUI()
    document.removeEventListener('click', e =>
      handleOutsideClick({
        event: e,
        floatingInputRef,
        verticalMenuRef,
        hideUI,
      }))
  }
}
interface ShowExportMenuParams {
  exportMenuRef: HTMLElement
}

export function showExportMenu({ exportMenuRef }: ShowExportMenuParams) {
  const toolbarButton = document.querySelector('.ql-export')
  const editorContainer = document.querySelector('.editor-container')

  if (!toolbarButton || !exportMenuRef || !editorContainer) {
    console.error('Required elements not found')
    return
  }

  const buttonRect = toolbarButton.getBoundingClientRect()
  const containerRect = editorContainer.getBoundingClientRect()

  // 检查是否处于暗黑模式
  const isDarkMode = document.querySelector('.writing-editor.dark-mode') !== null
    || document.querySelector('.dark-mode') !== null

  exportMenuRef.style.display = 'block'
  exportMenuRef.style.position = 'absolute'

  // 计算相对于编辑器容器的位置
  const left = buttonRect.left - containerRect.left
  exportMenuRef.style.left = `${left}px`

  // 如果是暗黑模式，直接应用内联样式
  if (isDarkMode) {
    exportMenuRef.style.background = '#4b5563'
    exportMenuRef.style.border = '1px solid #404040'
    exportMenuRef.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)'

    // 设置菜单项样式
    const menuItems = exportMenuRef.querySelectorAll('.export-menu-item')
    menuItems.forEach((item: HTMLElement) => {
      item.style.color = '#d4d4d4'
    })
  }
  else {
    // 正常模式下重置样式，避免状态混乱
    exportMenuRef.style.background = 'white'
    exportMenuRef.style.border = '1px solid #ddd'
    exportMenuRef.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)'
  }
}

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
  promptInputRef.placeholder = "正在生成回答..."

  const selectedText = currentRange
    ? quill.getText(currentRange.index, currentRange.length)
    : ''

  const responseContent = aiResponseRef.querySelector('.response-content')
  const sendBtn = document.querySelector('.send-btn')

  if (!selectedText && !actualPrompt.trim()) {
    if (responseContent) {
      responseContent.textContent = "输入提示..."
      responseContent.classList.remove('loading')
    }
    promptInputRef.placeholder = originalPlaceholder
    return
  }

  try {
    isGenerating.value = true
    sendBtn.classList.add('loading')
    responseContent.classList.add('loading')
    responseContent.textContent = '正在生成回答...'
    actionButtonsRef.style.display = 'none'

    abortController.value = new AbortController()

    await AIEditingAPI.streamChat(
      actualPrompt,
      selectedText,
      (response) => {
        if (response.error) {
          responseContent.classList.remove('loading')

          responseContent.textContent = `错误: ${response.errorMessage}`
          promptInputRef.placeholder = originalPlaceholder
          return
        }
        responseContent.classList.remove('loading')
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
  }
  catch (error) {
    if (error.name === 'AbortError') {
      responseContent.textContent = "生成已中止"
    }
    else if (responseContent) {
      responseContent.classList.remove('loading')
      responseContent.textContent = "生成回答时出现错误，请重试。"
    }
  }
  finally {
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

interface InsertContentParams {
  quill: Quill
  text: string
  startIndex: number
  isMarkdown?: boolean
  isReplace?: boolean
  currentRange?: { index: number, length: number } | null
}

export function insertContent({
  quill,
  text,
  startIndex,
  isMarkdown = true,
  isReplace = false,
  currentRange = null,
}: InsertContentParams) {
  if (!text || !quill)
    return
  if (isReplace && currentRange) {
    quill.deleteText(currentRange.index, currentRange.length)
    startIndex = currentRange.index
  }

  if (isMarkdown) {
    // 使用新的 renderMarkdownToQuill 函数
    renderMarkdownToQuill({
      markdownText: text,
      quill,
      cursorPosition: startIndex,
    })
  }
  else {
    quill.insertText(startIndex, text, 'api')
  }
}
interface RenderMarkdownToQuillParams {
  markdownText: string
  quill: Quill
  cursorPosition?: number
}

export function renderMarkdownToQuill({
  markdownText,
  quill,
  cursorPosition,
}: RenderMarkdownToQuillParams) {
  try {
    const processedText = markdownText.replace(/^(\d+)\.\s/gm, '$1\\. ')
    const md = new MarkdownIt({
      html: true,
      breaks: true,
      linkify: true,
    }).use((md) => {
      // 自定义表格和代码块渲染
      // 完全覆盖表格渲染规则
      md.renderer.rules.table_open = () => '<table><tbody>'
      md.renderer.rules.table_close = () => '</tbody></table>'
      md.renderer.rules.tr_open = () => '<tr>'
      md.renderer.rules.th_open = () => '<td data-header="true">' // 用 td 但标记为 header
    })
    let html = md
      .render(processedText)
      .replace(/<th>/g, '<td data-header="true">') // 替换 th 为标记的 td
      .replace(/<\/th>/g, '</td>')
    html = html
      .replace(/<p>\s+/g, '<p>') // 移除<p>标签后的空白
      .replace(/\s+<\/p>/g, '</p>') // 移除</p>标签前的空白
      .replace(/<br>\n\s*/g, '<br>') // 移除<br>标签后的换行和空格
    // console.log("🚀 ~ renderMarkdown ~ html:", html);

    // 获取插入位置
    const insertPosition = cursorPosition ?? quill.getLength()
    // 在指定位置插入 HTML
    quill.clipboard.dangerouslyPasteHTML(insertPosition, html)
    // 计算新光标位置
    const delta = quill.clipboard.convert(html)
    const insertedLength = delta.reduce(
      (acc, op) => acc + (op.insert ? op.insert.length || 1 : 0),
      0,
    )
    // 移动光标到插入内容末尾
    quill.setSelection(insertPosition + insertedLength, 0)
    // 在内容插入后添加
    return insertedLength
  }
  catch (error) {
    console.error('Markdown rendering failed:', error)
    return 0
  }
}

/**
 * 复制编辑器内容为 Markdown 格式
 * @param quill Quill 编辑器实例
 */
export async function copyAsMarkdown(quill) {
  if (!quill)
    return

  const content = quill.root.innerHTML
  const exporter = createExporter(content, quill)

  try {
    // 调用 exportAs 函数并获取 Markdown 内容
    const markdownContent = await exporter.exportAs('markdown', false)

    // 复制到剪贴板
    await navigator.clipboard.writeText(markdownContent)

    // 显示成功提示
    showCopySuccessMessage('Markdown 已复制到剪贴板')
  }
  catch (error) {
    console.error('复制 Markdown 失败:', error)
  }
}

/**
 * 显示复制成功的提示消息
 * @param message 提示消息
 */
function showCopySuccessMessage(message) {
  // 创建一个临时提示元素
  const messageEl = document.createElement('div')
  messageEl.textContent = message
  messageEl.style.position = 'fixed'
  messageEl.style.bottom = '20px'
  messageEl.style.left = '50%'
  messageEl.style.transform = 'translateX(-50%)'
  messageEl.style.background = '#4caf50'
  messageEl.style.color = 'white'
  messageEl.style.padding = '10px 20px'
  messageEl.style.borderRadius = '4px'
  messageEl.style.zIndex = '1000'
  messageEl.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)'

  document.body.appendChild(messageEl)

  // 2秒后移除提示
  setTimeout(() => {
    document.body.removeChild(messageEl)
  }, 1000)
}

/**
 * 保存并恢复工具栏操作时的选区
 * @param {object} quill Quill实例
 * @param {object} toolbar 工具栏元素
 */
export function setupToolbarSelectionHandling(quill, toolbar) {
  let toolbarSelection = null

  // 处理颜色和背景色按钮
  const colorButton = toolbar.querySelector('.ql-color')
  const bgColorButton = toolbar.querySelector('.ql-background')

  const handleToolbarButtonClick = () => {
    toolbarSelection = quill.getSelection()
  }

  if (colorButton) {
    colorButton.addEventListener('click', handleToolbarButtonClick)
  }

  if (bgColorButton) {
    bgColorButton.addEventListener('click', handleToolbarButtonClick)
  }

  // 监听颜色选择操作完成
  const handleDocumentClick = (e) => {
    if (toolbarSelection
      && !e.target.closest('.ql-picker')
      && !e.target.closest('.ql-color')
      && !e.target.closest('.ql-background')) {
      setTimeout(() => {
        quill.setSelection(toolbarSelection)
        toolbarSelection = null
      }, 10)
    }
  }

  document.addEventListener('click', handleDocumentClick)

  // 监听颜色选择器中的颜色项点击
  const setupColorPickerItems = () => {
    const colorItems = document.querySelectorAll('.ql-picker-item')
    colorItems.forEach((item) => {
      item.addEventListener('click', () => {
        if (toolbarSelection) {
          setTimeout(() => {
            quill.setSelection(toolbarSelection)
            toolbarSelection = null
          }, 10)
        }
      })
    })
  }

  // 当颜色选择器首次打开时设置事件监听
  const setupPickerObserver = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes'
          && mutation.attributeName === 'class'
          && mutation.target.classList.contains('ql-expanded')) {
          setupColorPickerItems()
        }
      })
    })

    const pickers = document.querySelectorAll('.ql-picker')
    pickers.forEach((picker) => {
      observer.observe(picker, { attributes: true })
    })
  }

  // 设置观察者来检测颜色选择器的打开
  setTimeout(setupPickerObserver, 100)

  // 返回清理函数
  return () => {
    if (colorButton)
      colorButton.removeEventListener('click', handleToolbarButtonClick)
    if (bgColorButton)
      bgColorButton.removeEventListener('click', handleToolbarButtonClick)
    document.removeEventListener('click', handleDocumentClick)
  }
}

/**
 * 确保元素在容器视口内完全可见，必要时滚动容器
 * @param elements 需要确保可见的元素数组
 * @param container 滚动容器
 */
export function ensureElementsVisible(elements, container) {
  // 跳过无效元素
  if (!elements || !elements.length || !container)
    return

  const containerRect = container.getBoundingClientRect()
  const containerScrollBottom = container.scrollTop + containerRect.height

  // 计算所有元素中最低的底部边界
  let lowestBottom = 0
  elements.forEach((el) => {
    if (!el || el.style.display === 'none')
      return

    const elRect = el.getBoundingClientRect()
    // 将元素底部边界转换为相对于容器的位置
    const elBottomRelative = elRect.bottom - containerRect.top + container.scrollTop
    lowestBottom = Math.max(lowestBottom, elBottomRelative)
  })

  // 判断是否需要滚动
  if (lowestBottom > containerScrollBottom) {
    // 计算需要滚动的距离，添加20px额外空间
    const scrollDistance = lowestBottom - containerScrollBottom + 20

    // 平滑滚动
    container.scrollBy({
      top: scrollDistance,
      behavior: 'smooth',
    })

    return true // 返回true表示执行了滚动
  }

  return false // 返回false表示没有滚动
}
