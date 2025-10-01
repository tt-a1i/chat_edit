import type Quill from 'quill'
import type { Ref } from 'vue'
import { createExporter } from '@/lib/export'
import { createImporter } from '@/lib/export/import'
import { AppError, ErrorCode } from '@/utils/error-handler'
import { ErrorHandler } from '@/utils/errorHandler'
import { ref } from 'vue'

/**
 * 文件操作 Composable
 * 封装文件导入/导出功能
 */
export function useFileOperations(quill: Ref<Quill | null>) {
  const showUploadModal = ref(false)
  const isUploading = ref(false)

  /**
   * 导入 Word 文档
   */
  async function importWordDocument(file: File) {
    if (!quill.value) {
      ErrorHandler.handle(new AppError(
        ErrorCode.EDITOR_ERROR,
        '编辑器未初始化',
      ))
      return
    }

    try {
      isUploading.value = true
      const importer = createImporter()
      const html = await importer.importWordDocument(file)

      // 清空编辑器并插入导入的内容
      quill.value.setContents([])
      quill.value.clipboard.dangerouslyPasteHTML(0, html)

      showUploadModal.value = false
      window.$message?.success('文件导入成功')
    } catch {
      // 错误已在 import.ts 中处理
    } finally {
      isUploading.value = false
    }
  }

  /**
   * 导出文档
   */
  async function exportDocument(format: 'markdown' | 'docx' | 'pdf') {
    if (!quill.value) {
      ErrorHandler.handle(new AppError(
        ErrorCode.EDITOR_ERROR,
        '编辑器未初始化',
      ))
      return
    }

    try {
      const content = quill.value.root.innerHTML
      const exporter = createExporter(content, quill.value)
      await exporter.exportAs(format)
      window.$message?.success(`导出 ${format.toUpperCase()} 成功`)
    } catch {
      // 错误已在 export.ts 中处理
    }
  }

  /**
   * 处理文件上传
   */
  async function handleFileUpload(options: { file: File }) {
    const { file } = options
    await importWordDocument(file)
    return { file }
  }

  return {
    showUploadModal,
    isUploading,
    importWordDocument,
    exportDocument,
    handleFileUpload,
  }
}
