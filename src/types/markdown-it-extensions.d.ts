/**
 * markdown-it 插件扩展类型
 */

declare module 'markdown-it' {
  import MarkdownItDefault from 'markdown-it'

  // 扩展 markdown-it 的配置选项（预留）
  // eslint-disable-next-line unused-imports/no-unused-vars
  interface Options {
    /**
     * 列表缩进级别
     * 某些插件支持此选项
     */
    listIndent?: number
  }

  // 导出默认构造函数
  export = MarkdownItDefault
}

declare module 'markdown-it-link-attributes' {
  import type MarkdownIt from 'markdown-it'

  interface LinkAttributesOptions {
    attrs?: Record<string, string>
    pattern?: RegExp
  }

  function linkAttributes(md: MarkdownIt, options?: LinkAttributesOptions): void
  export = linkAttributes
}
