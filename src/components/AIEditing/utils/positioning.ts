/**
 * positioning.ts
 *
 * AI编辑菜单定位相关功能
 */

import type Quill from 'quill'

/**
 * 菜单定位配置
 */
export interface MenuPositionConfig {
  editorSelector: string // 编辑器容器选择器
  leftOffset: number // 左侧偏移量
  topOffset: number // 顶部偏移量
  menuHeightEstimate: number // 菜单预估高度
  minTopSpace: number // 最小顶部空间
}

/**
 * 菜单位置计算结果
 */
export interface MenuPosition {
  leftPosition: number // 左侧位置
  adjustTop: number // 调整后的顶部位置
  reversed: boolean // 是否反转（向上显示）
  editorWidth: number // 编辑器宽度
  containerHeight: number // 容器高度
}

/**
 * 计算菜单位置
 */
export function calculateMenuPosition(
  quill: Quill,
  range: { index: number, length: number },
  config: Partial<MenuPositionConfig> = {},
): MenuPosition | null {
  // 默认配置
  const {
    editorSelector = '#editor',
    leftOffset = 30,
    topOffset = 42,
    menuHeightEstimate = 320,
    minTopSpace = 47,
  } = config

  // 获取选区边界
  const bounds = quill.getBounds(range.index, range.length)
  const editorContainer = document.querySelector(editorSelector)
  const quillContainer = quill.container

  if (!editorContainer || !bounds) {
    return null
  }

  const containerRect = editorContainer.getBoundingClientRect()
  const quillRect = quillContainer.getBoundingClientRect()

  // 计算相对于编辑器容器的位置
  const leftPosition = quillRect.left - containerRect.left

  // 计算顶部位置，将菜单放在选区的下方
  const y = bounds.top + bounds.height + topOffset
  const maxTop = containerRect.height - menuHeightEstimate
  const minTop = minTopSpace + menuHeightEstimate
  const reversed = y > maxTop

  // 调整顶部位置
  const adjustTop = reversed
    ? Math.min(Math.max(minTop, y), containerRect.height - 5)
    : Math.max(Math.min(maxTop, y), minTopSpace)

  return {
    leftPosition,
    adjustTop,
    reversed,
    editorWidth: quillRect.width,
    containerHeight: containerRect.height,
  }
}

/**
 * 应用菜单位置样式
 */
export function applyMenuPosition(
  element: HTMLElement,
  position: MenuPosition,
  config: {
    leftOffset?: number
    topOffset?: number
    bottomOffset?: number
  } = {},
): void {
  const {
    leftOffset = 30,
    topOffset = 5,
    bottomOffset = 5,
  } = config

  element.style.display = 'block'
  element.style.position = 'absolute'
  element.style.left = `${position.leftPosition + leftOffset}px`

  if (position.reversed) {
    element.style.top = 'auto'
    element.style.bottom = `${position.containerHeight - position.adjustTop + bottomOffset}px`
  } else {
    element.style.top = `${position.adjustTop + topOffset}px`
    element.style.bottom = 'auto'
  }
}

/**
 * 设置元素宽度
 */
export function applyMenuWidth(
  element: HTMLElement,
  editorWidth: number,
  config: {
    widthOffset?: number
    maxWidth?: string
  } = {},
): void {
  const {
    widthOffset = 60,
    maxWidth = '920px',
  } = config

  element.style.width = `${editorWidth - widthOffset}px`
  element.style.maxWidth = maxWidth
}
