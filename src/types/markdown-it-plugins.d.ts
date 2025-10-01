/**
 * markdown-it 插件类型声明
 */
declare module 'markdown-it-link-attributes' {
  import type MarkdownIt from 'markdown-it'

  interface LinkAttributesOptions {
    attrs?: Record<string, string>
    pattern?: RegExp
    matcher?: (href: string) => boolean
  }

  function linkAttributes(md: MarkdownIt, options?: LinkAttributesOptions): void

  export = linkAttributes
}

declare module 'markdown-it-texmath' {
  import type MarkdownIt from 'markdown-it'

  interface TexmathOptions {
    engine?: any
    delimiters?: string
    katexOptions?: any
  }

  function texmath(md: MarkdownIt, options?: TexmathOptions): void

  export = texmath
}
