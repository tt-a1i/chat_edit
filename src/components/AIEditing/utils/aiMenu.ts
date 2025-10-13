/**
 * aiMenu.ts
 *
 * AI 菜单和交互相关功能
 * 包含: AI 菜单显示/隐藏、导出菜单、外部点击处理
 */

import type Quill from 'quill'
import { logger } from '@/utils/logger'
import { ensureElementsVisible } from './dom'

export interface HideAIUIParams {
  floatingInputRef: HTMLElement
  verticalMenuRef: HTMLElement
  aiResponseRef: HTMLElement
  actionButtonsRef: HTMLElement
  promptInputRef: HTMLInputElement
}

export function checkEmptyLine(
  quill: Quill,
  uiElements: HideAIUIParams,
) {
  const selection = quill.getSelection()
  if (!selection) {
    return
  }

  const [line] = quill.getLine(selection.index)
  if (!line) {
    return
  }

  const text = line.domNode.textContent

  // 如果不是空行，隐藏AI相关UI
  if (!text || !text.trim()) {
    hideAIUI(uiElements)
  }
}

export interface AIMenuParams {
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
  if (!selection) {
    return
  }

  currentRange = { index: selection.index, length: selection.length }
  const bounds = quill.getBounds(selection.index)
  const editorContainer = document.querySelector('.editor-container')
  if (!editorContainer) {
    logger.error('Editor container not found')
    return currentRange
  }

  const editorContentRect = quill.root.getBoundingClientRect()

  // 获取编辑器容器的边界信息
  const containerRect = editorContainer.getBoundingClientRect()

  // 计算基础位置
  const leftPosition = editorContentRect.left - containerRect.left

  // 判断是否是空行按/唤起
  const [line] = quill.getLine(selection.index)
  const isEmptyLine = line && line.domNode.textContent ? !line.domNode.textContent.trim() : true

  // 如果是空行按/唤起，额外增加一个行高的偏移
  if (!bounds) {
    logger.error('Cannot get bounds for selection')
    return currentRange
  }

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
  if (aiResponseRef && aiResponseRef instanceof HTMLElement) {
    aiResponseRef.style.width = floatingInputRef.style.width
    // aiResponseRef.style.left = floatingInputRef.style.left;
  }

  // 确保元素在视口内可见，如果需要则滚动容器
  setTimeout(() => {
    const editorContainerEl = document.querySelector('.editor-container')
    if (editorContainerEl instanceof HTMLElement) {
      ensureElementsVisible([floatingInputRef, verticalMenuRef], editorContainerEl)
    }
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

export function hideAIUI({
  floatingInputRef,
  verticalMenuRef,
  aiResponseRef,
  actionButtonsRef,
  promptInputRef,
}: HideAIUIParams) {
  floatingInputRef.style.display = 'none'
  verticalMenuRef.style.display = 'none'
  aiResponseRef.style.display = 'none'
  actionButtonsRef.style.display = 'none'
  promptInputRef.value = ''
}

export interface HandleOutsideClickParams {
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

export interface ShowExportMenuParams {
  exportMenuRef: HTMLElement
}

export function showExportMenu({ exportMenuRef }: ShowExportMenuParams) {
  const toolbarButton = document.querySelector('.ql-export')
  const editorContainer = document.querySelector('.editor-container')

  if (!toolbarButton || !exportMenuRef || !editorContainer) {
    logger.error('Required elements not found for export menu')
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
    menuItems.forEach((item) => {
      if (item instanceof HTMLElement) {
        item.style.color = '#d4d4d4'
      }
    })
  } else {
    // 正常模式下重置样式，避免状态混乱
    exportMenuRef.style.background = 'white'
    exportMenuRef.style.border = '1px solid #ddd'
    exportMenuRef.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)'
  }
}
