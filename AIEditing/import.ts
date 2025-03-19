import mammoth from 'mammoth'

interface ImportOptions {
  preserveStyles?: boolean
}

class DocumentImporter {
  private defaultOptions: ImportOptions = {
    preserveStyles: true,
  }

  async importWordDocument(
    file: File,
    options: ImportOptions = {},
  ): Promise<string> {
    const mergedOptions = { ...this.defaultOptions, ...options }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          preserveStyles: mergedOptions.preserveStyles,
          styleMap: [
            'p[style-name=\'Section Title\'] => h1:fresh',
            'p[style-name=\'Subsection Title\'] => h2:fresh',
            'p[style-name=\'center\'] => p.ql-align-center:fresh',
            'p[style-name=\'right\'] => p.ql-align-right:fresh',
            'p[style-name=\'justify\'] => p.ql-align-justify:fresh',
          ],
          // 使用Mammoth原生配置保留空白
          preserveEmptyParagraphs: true,
          includeDefaultStyleMap: true,
          ignoreEmptyParagraphs: false,
          convertImage: mammoth.images.imgElement(() => ({})),
        },
      )

      if (result.messages.length > 0) {
        console.warn('Word import warnings:', result.messages)
      }

      // 后处理阶段修正空格和换行
      let html = result.value

      // 处理连续空格（非破坏性替换）
      html = html.replace(/(?<=\s|^) {2,}/g, match =>
        '&nbsp;'.repeat(match.length))

      // 处理换行符（保留段落结构）
      html = html.replace(/<p[^>]*>(.*?)<\/p>/gs, (match, pContent) => {
        const processed = pContent
          .replace(/\n/g, '<br/>')
          .replace(/ {2}/g, ' &nbsp;')
        return `<p class="ql-align-left">${processed}</p>`
      })

      // 确保默认对齐方式
      html = html.replace(/<p(?! class)/g, '<p class="ql-align-left"')

      return html
    }
    catch (error) {
      console.error('Error importing Word document:', error)
      throw new Error('Failed to import Word document')
    }
  }
}

export const createImporter = () => new DocumentImporter()
