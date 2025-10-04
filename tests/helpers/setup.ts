/**
 * 测试辅助工具
 * 提供通用的测试 setup 和 mock 功能
 */

/**
 * 创建 localStorage mock
 * 用于在测试环境中模拟 localStorage API
 */
export function createLocalStorageMock() {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
  }
}

/**
 * 设置 localStorage mock 到 window 对象
 * 在 beforeEach 中调用
 */
export function setupLocalStorageMock() {
  Object.defineProperty(window, 'localStorage', {
    value: createLocalStorageMock(),
    writable: true,
  })
}
