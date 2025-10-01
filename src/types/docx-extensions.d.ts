/**
 * docx 和 mammoth 库的类型扩展
 */

declare module 'docx' {
  export interface Options {
    codeBlock?: boolean
  }
}

declare module 'mammoth' {
  export interface ConvertToHtmlOptions {
    preserveStyles?: boolean
    styleMap?: string[]
    preserveEmptyParagraphs?: boolean
    includeDefaultStyleMap?: boolean
    ignoreEmptyParagraphs?: boolean
    convertImage?: (element: any) => Promise<ImageAttributes> | ImageAttributes
  }

  export interface ImageAttributes {
    src?: string
    alt?: string
    title?: string
  }

  export interface ConversionResult {
    value: string
    messages: Array<{ type: string, message: string }>
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer } | { path: string },
    options?: ConvertToHtmlOptions
  ): Promise<ConversionResult>

  export namespace images {
    export function imgElement(
      callback: (element: any) => ImageAttributes | Promise<ImageAttributes>
    ): (element: any) => Promise<ImageAttributes> | ImageAttributes
  }
}

declare module 'turndown' {
  export interface Options {
    codeBlockStyle?: 'indented' | 'fenced'
    headingStyle?: 'atx' | 'setext'
    codeBlock?: string
    emDelimiter?: string
  }

  export interface Rule {
    filter: string | string[] | ((node: HTMLElement) => boolean)
    replacement: (content: string, node: any) => string
  }

  export default class TurndownService {
    constructor(options?: Options)
    turndown(html: string | HTMLElement): string
    addRule(key: string, rule: Rule): this
  }
}
