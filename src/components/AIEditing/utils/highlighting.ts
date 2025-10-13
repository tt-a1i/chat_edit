/**
 * highlighting.ts
 *
 * 选区高亮相关功能
 * 包含: highlightSelection, clearHighlight
 */

import type Quill from 'quill'
import { logger } from '@/utils/logger'

export function highlightSelection(
  quill: Quill,
  range: { index: number, length: number },
) {
  if (!range || range.length === 0) {
    return
  }

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
  if (!bounds) {
    logger.warn('无法获取选区边界')
    return
  }

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
  const parentNode = editorRoot.parentNode
  if (parentNode) {
    parentNode.insertBefore(highlightOverlay, editorRoot.nextSibling)
  }

  // 保存范围信息，用于后续清除
  editorRoot.dataset.highlightedRange = JSON.stringify(savedSelection)
}

export function clearHighlight(
  quill: Quill,
  currentRange: { index: number, length: number },
) {
  if (!currentRange) {
    return
  }

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
