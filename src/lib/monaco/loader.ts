/**
 * Monaco Editor 懒加载封装
 * 仅在用户需要时才加载 Monaco（98MB）
 */

let monacoInstance: typeof import('monaco-editor') | null = null
let monacoPromise: Promise<typeof import('monaco-editor')> | null = null

/**
 * 懒加载 Monaco Editor
 * 使用单例模式，确保只加载一次
 */
export async function loadMonaco(): Promise<typeof import('monaco-editor')> {
  // 如果已加载，直接返回
  if (monacoInstance) {
    return monacoInstance
  }

  // 如果正在加载，等待加载完成
  if (monacoPromise) {
    return monacoPromise
  }

  // 开始懒加载
  monacoPromise = import('monaco-editor').then((module) => {
    monacoInstance = module
    return module
  })

  return monacoPromise
}

/**
 * 检查 Monaco 是否已加载
 */
export function isMonacoLoaded(): boolean {
  return monacoInstance !== null
}
