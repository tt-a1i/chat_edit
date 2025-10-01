/**
 * AIEditing 组件类型声明
 */
import type { DefineComponent } from 'vue'

// AIEditing 组件不需要 props，使用空对象
// 组件实例没有暴露方法，使用空对象
declare const AIEditingComponent: DefineComponent<
  Record<string, never>, // props
  Record<string, never>, // emits
  Record<string, never>
>

export default AIEditingComponent
