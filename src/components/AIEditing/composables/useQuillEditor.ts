import type Quill from 'quill'
import { useEventListener } from '@vueuse/core'
import { nextTick, ref, shallowRef } from 'vue'
import { copyAsMarkdown, showExportMenu } from '../utils'

/**
 * Quill 编辑器 Composable
 * 封装 Quill 编辑器的初始化、配置和基础操作
 */
export function useQuillEditor() {
  const quillInstance = shallowRef<Quill | null>(null)
  const wordCount = ref(0)
  const isEditorReady = ref(false)

  /**
   * 初始化 Quill 编辑器
   */
  async function initQuillEditor(exportMenuRef: HTMLElement | null) {
    await nextTick()

    const editorElement = document.getElementById('editor')
    if (!editorElement) {
      throw new Error('Editor element not found')
    }

    const { default: QuillClass } = await import('quill')
    const QuillTableUI = await import('quill-table-ui')

    // 注册 QuillTableUI 模块
    QuillClass.register('modules/tableUI', QuillTableUI.default, true)

    const options = {
      modules: {
        table: true,
        tableUI: true,
        toolbar: {
          container: [
            ['undo', 'redo'],
            [{ header: [false, 1, 2, 3] }],
            ['bold', 'italic', 'underline'],
            [{ color: [] }],
            [{ align: [] }],
            ['link'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['table'],
            ['copy-content'],
            ['import'],
            ['export'],
          ],
          handlers: {
            'undo': function (this: any) {
              const quill = this.quill
              quill.history.undo()
              setTimeout(() => {
                document.querySelectorAll('.highlight-overlay').forEach(el => el.remove())
              }, 0)
            },
            'redo': function (this: any) {
              const quill = this.quill
              quill.history.redo()
              setTimeout(() => {
                document.querySelectorAll('.highlight-overlay').forEach(el => el.remove())
              }, 0)
            },
            'export': function () {
              if (exportMenuRef) {
                showExportMenu({ exportMenuRef })
              }
            },
            'table': function (this: any) {
              const quill = this.quill
              quill.getModule('table').insertTable(3, 3)
            },
            'copy-content': function (this: any) {
              const quill = this.quill
              copyAsMarkdown(quill)
            },
            'import': function () {
              // 由外部处理
              const event = new CustomEvent('quill:import')
              window.dispatchEvent(event)
            },
          },
        },
        history: {
          delay: 1000,
          maxStack: 5000,
          userOnly: false,
        },
      },
      placeholder: '在这里输入内容，或者使用 / 唤起AI',
      theme: 'snow',
    }

    quillInstance.value = new QuillClass(editorElement, options)
    quillInstance.value.root.innerHTML = ''

    // 修复输入法 placeholder 问题
    setupIMEPlaceholderFix(quillInstance.value)

    isEditorReady.value = true

    return quillInstance.value
  }

  /**
   * 修复输入法输入时的 placeholder 显示问题
   */
  function setupIMEPlaceholderFix(quill: Quill) {
    const editorElement = quill.root

    useEventListener(editorElement, 'compositionstart', () => {
      if (quill.getText().trim() === '') {
        quill.root.classList.add('hiding-placeholder')
      }
    })

    useEventListener(editorElement, 'compositionend', () => {
      setTimeout(() => {
        if (quill.getText().trim() === '') {
          quill.root.classList.remove('hiding-placeholder')
        }
      }, 0)
    })

    useEventListener(editorElement, 'blur', () => {
      if (quill.getText().trim() === '') {
        quill.root.classList.remove('hiding-placeholder')
      }
    })
  }

  /**
   * 更新字数统计
   */
  function updateWordCount() {
    if (!quillInstance.value) return
    const text = quillInstance.value.getText()
    wordCount.value = text.replace(/\s+/g, '').length
  }

  /**
   * 获取编辑器内容
   */
  function getContent(): string {
    return quillInstance.value?.root.innerHTML || ''
  }

  /**
   * 设置编辑器内容
   */
  function setContent(html: string) {
    if (quillInstance.value) {
      quillInstance.value.root.innerHTML = html
    }
  }

  /**
   * 获取工具栏元素
   */
  function getToolbar(): HTMLElement | null {
    if (!quillInstance.value) return null
    const toolbar = quillInstance.value.getModule('toolbar') as any
    return toolbar?.container || null
  }

  return {
    quillInstance,
    wordCount,
    isEditorReady,
    initQuillEditor,
    updateWordCount,
    getContent,
    setContent,
    getToolbar,
  }
}
