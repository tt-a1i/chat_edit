/**
 * toolbar.ts
 *
 * 工具栏相关功能
 * 包含: 时间显示、字数统计、选区处理
 */

import type Quill from 'quill'
import { logger } from '@/utils/logger'

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
    logger.error('Toolbar not initialized')
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
  if (!creationTimeDisplay) {
    return
  }

  const currentTime = getCurrentTime()
  creationTimeDisplay.textContent = `最近修改: ${currentTime}`
}

export function updateWordCountDisplay(wordCountDisplay: HTMLElement | null, quill: Quill) {
  // 添加空值检查
  if (!wordCountDisplay || !quill) {
    return
  }

  const text = quill.getText()
  // 移除所有空白字符后计算字数
  const wordCount = text
    .replace(
      /[\u3002\uFF01\uFF0C\uFF1A\uFF1B\uFF1F\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]/g,
      '',
    ) // 移除标点符号
    .replace(/\s+/g, '') // 移除所有空格
    .replace(/[^\u4E00-\u9FA5a-z0-9]/gi, '')
    .length // 移除特殊符号

  const title = `字数：${wordCount}`
  wordCountDisplay.textContent = title
}

/**
 * 保存并恢复工具栏操作时的选区
 * @param quill Quill实例
 * @param toolbar 工具栏元素
 */
export function setupToolbarSelectionHandling(quill: Quill, toolbar: HTMLElement) {
  let toolbarSelection: { index: number, length: number } | null = null

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
  const handleDocumentClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (toolbarSelection
      && !target.closest('.ql-picker')
      && !target.closest('.ql-color')
      && !target.closest('.ql-background')) {
      setTimeout(() => {
        if (toolbarSelection) {
          quill.setSelection(toolbarSelection)
          toolbarSelection = null
        }
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
            if (toolbarSelection) {
              quill.setSelection(toolbarSelection)
              toolbarSelection = null
            }
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
          && mutation.target instanceof Element
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
    if (colorButton) {
      colorButton.removeEventListener('click', handleToolbarButtonClick)
    }
    if (bgColorButton) {
      bgColorButton.removeEventListener('click', handleToolbarButtonClick)
    }
    document.removeEventListener('click', handleDocumentClick)
  }
}
