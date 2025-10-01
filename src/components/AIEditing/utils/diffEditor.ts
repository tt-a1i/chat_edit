/**
 * diffEditor.ts
 *
 * Monaco 差异编辑器相关功能
 * 包含: showDiffEditor, closeDiffEditor
 */

import type { editor } from 'monaco-editor'
import type Quill from 'quill'
import { ErrorHandler } from '@/utils/errorHandler'
import { AppError, ErrorCode } from '@/utils/errors'
import { logger } from '@/utils/logger'
import * as monaco from 'monaco-editor'
import { nextTick } from 'vue'
import { defaultDiffEditorOptions } from '../monacoConfig'

export interface DiffEditorParams {
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
    logger.debug('No selection range available')
    return null
  }

  const container = document.getElementById('diffContainer')
  const editorElement = document.getElementById('diffEditor')
  const acceptButton = document.getElementById('acceptDiffButton')

  if (!container || !editorElement) {
    ErrorHandler.handle(new AppError(
      ErrorCode.EDITOR_ERROR,
      '编辑器初始化失败，请刷新页面重试',
      undefined,
      { message: 'Required DOM elements not found' },
    ))
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
      // 使用严格的文本处理模式
      useTabStops: false,
      autoIndent: 'none',
    } as monaco.editor.IStandaloneDiffEditorConstructionOptions,
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
        renderLineHighlight: 'none',
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

          if (!selection || !model) {
            return
          }

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
  } catch (error) {
    ErrorHandler.handle(new AppError(
      ErrorCode.EDITOR_ERROR,
      '创建对比编辑器失败',
      error as Error,
    ))
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

    if (floatingInputRef) {
      floatingInputRef.style.display = 'none'
    }
    if (aiResponseRef) {
      aiResponseRef.style.display = 'none'
    }
    if (actionButtonsRef) {
      actionButtonsRef.style.display = 'none'
    }
  }

  if (diffEditor) {
    try {
      const models = diffEditor.getModel()
      if (models) {
        models.original?.dispose()
        models.modified?.dispose()
      }
      diffEditor.dispose()
    } catch (error) {
      logger.error('Error disposing editor', error)
    }
  }
}
