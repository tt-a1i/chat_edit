/**
 * dom.ts
 *
 * DOM 操作相关功能
 * 包含: ensureElementsVisible
 */

/**
 * 确保元素在容器视口内完全可见，必要时滚动容器
 * @param elements 需要确保可见的元素数组
 * @param container 滚动容器
 */
export function ensureElementsVisible(elements: HTMLElement[], container: HTMLElement) {
  // 跳过无效元素
  if (!elements || !elements.length || !container) {
    return
  }

  const containerRect = container.getBoundingClientRect()
  const containerScrollBottom = container.scrollTop + containerRect.height

  // 计算所有元素中最低的底部边界
  let lowestBottom = 0
  elements.forEach((el: HTMLElement) => {
    if (!el || el.style.display === 'none') {
      return
    }

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
