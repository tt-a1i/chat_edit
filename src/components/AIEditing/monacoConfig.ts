import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

export function initMonaco(): void {
  // 定义全局 MonacoEnvironment
  (globalThis as any).MonacoEnvironment = {
    // eslint-disable-next-line unused-imports/no-unused-vars
    getWorker(_: string, label: string): Worker {
      // eslint-disable-next-line new-cap
      return new editorWorker()
    },
  }
}

// 配置 Monaco 编辑器的默认选项
export const defaultDiffEditorOptions = {
  renderSideBySide: true, // 修改为true以实现左右对比
  ignoreTrimWhitespace: true, // 忽略空白变化
  renderOverviewRuler: false, // 隐藏概览标尺
  renderIndicators: false, // 隐藏差异指示器（标点符号旁边的黄色竖线）
  originalEditable: false, // 原始文本不可编辑
  readOnly: false, // 修改后的文本可编辑
  minimap: { enabled: false }, // 不显示小地图
  lineNumbers: 'off', // 不显示行号
  folding: false, // 不允许折叠代码
  scrollBeyondLastLine: false, // 不允许滚动到最后一行之后
  wordWrap: 'on', // 自动换行
  diffWordWrap: 'on', // 差异内容自动换行
  theme: 'vs', // 使用浅色主题
  renderLineHighlight: 'none', // 修改为正确的选项名称，禁用行高亮
  // 添加以下配置以改善字符删除行为
  multiCursorModifier: 'alt',
  wordBasedSuggestions: false,
  wordSeparators: '', // 空字符串让编辑器将每个字符视为独立单位
  autoClosingBrackets: 'never', // 禁用自动闭合括号
  autoClosingQuotes: 'never', // 禁用自动闭合引号
  autoSurround: 'never', // 禁用自动环绕
  // 禁用所有自动格式化功能
  formatOnPaste: false,
  formatOnType: false,
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  acceptSuggestionOnEnter: 'off',
  // 自定义差异区域的样式
  diffDecorations: {
    gutter: false, // 不显示差异装饰
    overview: false, // 不显示概述装饰
  },
  // 添加更细粒度的文本编辑控制
  unicodeHighlight: {
    allowedCharacters: {
      'nonBasicASCII': false,
      'invisibleCharacters': false,
      'ambiguousCharacters': false,
      // 允许所有CJK字符
      '\u4E00-\u9FFF': true,
      '\u3400-\u4DBF': true,
      '\u20000-\u2A6Df': true,
      '\u2A700-\u2B73f': true,
      '\u2B740-\u2B81f': true,
      '\u2B820-\u2CEAf': true,
      // 明确允许所有中文字符
      '\uF900-\uFAFF': true, // 兼容汉字
      '\u3000-\u303F': true, // 中文标点
    },
    ambiguousCharacters: false,
    invisibleCharacters: false,
    nonBasicASCII: false,
  },
  // 添加更精确的文本编辑行为控制
  trimAutoWhitespace: false,
  autoIndent: 'none',
  renderWhitespace: 'none',
  mouseWheelScrollSensitivity: 1,
  // 添加更精确的字符删除控制
  useTabStops: false,
  // 禁用智能字符删除
  smartSelect: {
    enable: false,
  },
  // 完全禁用智能选择
  multiCursorMergeOverlapping: false,
  // 进一步禁用可能影响删除行为的功能
  autoClosingDelete: 'never', // 禁止自动删除
  autoClosingOvertype: 'never',
  // 禁用所有键绑定自定义
  find: {
    addExtraSpaceOnTop: false,
  },
  // 添加更多精确的中文处理配置
  detectIndentation: false,
  insertSpaces: true,
  tabSize: 2,
  // 关闭所有高级功能
  links: false,
  matchBrackets: 'never',
  // 完全禁用IME输入法的智能处理
  typeOperations: false,
  // 修复行尾为避免特殊处理
  normalizeIndentation: false,
  autoDetectHighContrast: false,
}
