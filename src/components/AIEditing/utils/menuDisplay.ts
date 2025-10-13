/**
 * menuDisplay.ts
 *
 * AI编辑菜单显示和隐藏逻辑
 */

import type { MenuPosition } from './positioning'
import { applyMenuPosition, applyMenuWidth } from './positioning'

/**
 * 菜单元素引用
 */
export interface MenuElements {
  floatingInputRef: HTMLElement | null
  verticalMenuRef: HTMLElement | null
  aiResponseRef: HTMLElement | null
}

/**
 * 显示并定位所有菜单元素
 */
export function showAndPositionMenus(
  elements: MenuElements,
  position: MenuPosition,
): void {
  const { floatingInputRef, verticalMenuRef, aiResponseRef } = elements

  // 显示并定位 floatingInput
  if (floatingInputRef) {
    applyMenuPosition(floatingInputRef, position, {
      leftOffset: 30,
      topOffset: 5,
      bottomOffset: floatingInputRef.offsetHeight + 5,
    })

    // 设置宽度
    applyMenuWidth(floatingInputRef, position.editorWidth)
  }

  // 显示并定位 verticalMenu
  if (verticalMenuRef && floatingInputRef) {
    applyMenuPosition(verticalMenuRef, position, {
      leftOffset: 30,
      topOffset: floatingInputRef.offsetHeight + 10,
      bottomOffset: floatingInputRef.offsetHeight * 2 + 10,
    })
  }

  // 设置 aiResponse 宽度和基本定位
  if (aiResponseRef) {
    applyMenuWidth(aiResponseRef, position.editorWidth)

    // AI响应区域位置调整
    if (floatingInputRef) {
      aiResponseRef.style.display = 'none'
      aiResponseRef.style.position = 'absolute'

      if (position.reversed) {
        aiResponseRef.style.top = 'auto'
        aiResponseRef.style.bottom = `${floatingInputRef.offsetHeight + 5}px`
      } else {
        aiResponseRef.style.top = `${floatingInputRef.offsetHeight + 5}px`
        aiResponseRef.style.bottom = 'auto'
      }
    }
  }
}

/**
 * 隐藏所有AI菜单元素
 */
export function hideAllMenus(elements: MenuElements): void {
  const { floatingInputRef, verticalMenuRef, aiResponseRef } = elements

  if (floatingInputRef) floatingInputRef.style.display = 'none'
  if (verticalMenuRef) verticalMenuRef.style.display = 'none'
  if (aiResponseRef) aiResponseRef.style.display = 'none'
}

/**
 * 检查元素是否在菜单组件内
 */
export function isInMenuComponents(
  target: Node,
  elements: MenuElements,
): boolean {
  const { floatingInputRef, verticalMenuRef, aiResponseRef } = elements

  return (
    floatingInputRef?.contains(target)
    || verticalMenuRef?.contains(target)
    || aiResponseRef?.contains(target)
    || (document.activeElement as Element)?.id === 'promptInput'
  ) ?? false
}
