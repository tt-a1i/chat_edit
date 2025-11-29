/**
 * content.ts
 *
 * 内容插入和 Markdown 渲染
 * 包含: insertContent, renderMarkdownToQuill, copyAsMarkdown
 */

import type Quill from 'quill'
import MarkdownIt from 'markdown-it'
import { createExporter } from '@/lib/export'
import { AppError, ErrorCode, ErrorHandler } from '@/utils/error-handler'

export interface InsertContentParams {
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
  if (!text || !quill) {
    return
  }
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
  } else {
    quill.insertText(startIndex, text, 'api')
  }
}

export interface RenderMarkdownToQuillParams {
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
    }).use((md: MarkdownIt) => {
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

    // 获取插入位置
    const insertPosition = cursorPosition ?? quill.getLength()
    // 在指定位置插入 HTML
    quill.clipboard.dangerouslyPasteHTML(insertPosition, html)
    // 计算新光标位置
    const delta = quill.clipboard.convert(html)
    const insertedLength = delta.reduce(
      (acc, op) => {
        if (op.insert) {
          if (typeof op.insert === 'string') {
            return acc + op.insert.length
          }
          return acc + 1
        }
        return acc
      },
      0,
    )
    // 移动光标到插入内容末尾
    quill.setSelection(insertPosition + insertedLength, 0)
    // 在内容插入后添加
    return insertedLength
  } catch (error) {
    ErrorHandler.handle(new AppError(
      ErrorCode.EDITOR_ERROR,
      'Markdown 渲染失败',
      error as Error,
    ))
    return 0
  }
}

/**
 * 复制编辑器内容为 Markdown 格式
 * @param quill Quill 编辑器实例
 */
export async function copyAsMarkdown(quill: Quill) {
  if (!quill) {
    return
  }

  const content = quill.root.innerHTML
  const exporter = createExporter(content, quill)

  try {
    // 调用 exportAs 函数并获取 Markdown 内容
    const markdownContent = await exporter.exportAs('markdown', false)

    // 复制到剪贴板
    await navigator.clipboard.writeText(markdownContent as string)

    // 显示成功提示
    showCopySuccessMessage('Markdown 已复制到剪贴板')
  } catch (error) {
    ErrorHandler.handle(new AppError(
      ErrorCode.EXPORT_ERROR,
      '复制 Markdown 失败',
      error as Error,
    ))
  }
}

/**
 * 显示复制成功的提示消息
 * @param message 提示消息
 */
function showCopySuccessMessage(message: string) {
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
