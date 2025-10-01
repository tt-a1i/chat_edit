/**
 * AI 编辑相关类型定义
 */

import type Quill from 'quill'
import type * as Monaco from 'monaco-editor'

/**
 * AI 对话响应类型
 */
export interface ChatResponse {
  /** 响应内容 */
  content: string
  /** 是否完成 */
  done: boolean
  /** 模型名称 */
  model?: string
  /** 错误信息 */
  error?: string
}

/**
 * AI 编辑对话响应 (用于 util.ts)
 */
export interface AIEditingChatResponse extends ChatResponse {
  // 保持向后兼容
}

/**
 * AI 编辑器上下文
 */
export interface EditorContext {
  /** Quill 编辑器实例 */
  quill: Quill | null
  /** Monaco 编辑器实例 */
  diffEditor: Monaco.editor.IStandaloneDiffEditor | null
  /** 当前选区 */
  currentRange: { index: number, length: number } | null
  /** 替换选区 */
  replacementRange: { index: number, length: number } | null
  /** 工具栏 DOM */
  toolbar: HTMLElement | null
}

/**
 * Prompt 模板类型
 */
export interface PromptTemplate {
  id: string
  name: string
  name_en: string
  template: string
  en_name: string
  category?: 'system' | 'custom'
}

/**
 * 导出选项
 */
export interface ExportOptions {
  format: 'pdf' | 'docx' | 'markdown' | 'html'
  filename?: string
  includeStyles?: boolean
}

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean
  content?: string
  error?: string
}
