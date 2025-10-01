/**
 * Quill 编辑器类型定义
 */
import type Quill from 'quill'

export type QuillInstance = Quill

export interface QuillRange {
  index: number
  length: number
}

export interface QuillDelta {
  ops: Array<{
    insert?: string | object
    delete?: number
    retain?: number
    attributes?: Record<string, unknown>
  }>
}

export interface QuillBounds {
  top: number
  left: number
  right: number
  bottom: number
  height: number
  width: number
}

export interface QuillSelection {
  index: number
  length: number
}
