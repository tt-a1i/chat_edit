/**
 * markdown-it 插件扩展类型
 */

declare module 'markdown-it' {
  import MarkdownItDefault from 'markdown-it'

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

declare module 'markdown-it-anchor' {
  import type MarkdownIt from 'markdown-it'

  interface AnchorOptions {
    permalink?: boolean
    permalinkBefore?: boolean
    permalinkSymbol?: string
    level?: number | number[]
  }

  function anchor(md: MarkdownIt, options?: AnchorOptions): void
  export = anchor
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

declare module 'markdown-it-highlightjs' {
  import type MarkdownIt from 'markdown-it'

  interface HighlightOptions {
    auto?: boolean
    code?: boolean
    inline?: boolean
  }

  function highlightjs(md: MarkdownIt, options?: HighlightOptions): void
  export = highlightjs
}

declare module 'markdown-it-katex' {
  import type MarkdownIt from 'markdown-it'

  function katex(md: MarkdownIt): void
  export = katex
}
