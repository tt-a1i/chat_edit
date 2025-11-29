/**
 * highlighting.ts
 *
 * 选区高亮相关功能
 * 包含: highlightSelection, clearHighlight
 */

import type Quill from 'quill'

export function highlightSelection(
  quill: Quill,
  range: { index: number, length: number },
) {
  if (!range || range.length === 0) {
    return
  }
  quill.formatText(range.index, range.length, { background: 'rgba(180, 213, 254, 0.5)' }, 'silent')
  quill.root.dataset.highlightedRange = JSON.stringify(range)
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
    const savedRange = quill.root.dataset.highlightedRange
    if (savedRange) {
      try {
        const { index, length } = JSON.parse(savedRange) as { index: number, length: number }
        quill.formatText(index, length, { background: false }, 'silent')
      } catch {
        quill.formatText(currentRange.index, currentRange.length, { background: false }, 'silent')
      }
    } else {
      quill.formatText(currentRange.index, currentRange.length, { background: false }, 'silent')
    }
  }
  if (quill.root.dataset.highlightedRange) {
    delete quill.root.dataset.highlightedRange
  }
}
