/**
 * utils/index.ts
 *
 * AI 编辑器工具函数统一导出
 * 保持向后兼容，所有原 util.ts 的导出都从这里重新导出
 */

// aiMenu 模块
export {
  checkEmptyLine,
  handleOutsideClick,
  hideAIUI,
  showAIMenu,
  showExportMenu,
} from './aiMenu'
export type {
  AIMenuParams,
  HandleOutsideClickParams,
  HideAIUIParams,
  ShowExportMenuParams,
} from './aiMenu'

// content 模块
export {
  copyAsMarkdown,
  insertContent,
  renderMarkdownToQuill,
} from './content'
export type {
  InsertContentParams,
  RenderMarkdownToQuillParams,
} from './content'

// diffEditor 模块
export {
  closeDiffEditor,
  showDiffEditor,
} from './diffEditor'
export type { DiffEditorParams } from './diffEditor'

// dom 模块
export {
  ensureElementsVisible,
} from './dom'

// highlighting 模块
export {
  clearHighlight,
  highlightSelection,
} from './highlighting'

// send 模块
export {
  handleRegenerate,
  handleSend,
} from './send'
export type { HandleSendParams } from './send'

// toolbar 模块
export {
  createTimeAndWordCountDisplay,
  getCurrentTime,
  setupToolbarSelectionHandling,
  updateCreationTimeDisplay,
  updateWordCountDisplay,
} from './toolbar'
