/**
 * docx 库类型定义
 */

declare module 'docx' {
  export class Document {
    constructor(options: DocumentOptions)
  }

  export interface DocumentOptions {
    styles?: any
    numbering?: any
    sections: SectionOptions[]
  }

  export interface SectionOptions {
    properties?: any
    children: (Paragraph | Table)[]
  }

  export class Paragraph {
    constructor(options: ParagraphOptions)
  }

  export interface ParagraphOptions {
    children?: TextRun[]
    heading?: HeadingLevel
    spacing?: { before?: number, after?: number }
    bullet?: { level: number }
    numbering?: { reference: string, level: number }
    indent?: { left?: number, hanging?: number }
    shading?: { type: string, color: string }
  }

  export class TextRun {
    constructor(options: TextRunOptions)
  }

  export interface TextRunOptions {
    text: string
    bold?: boolean
    italics?: boolean
    underline?: any
    size?: number
    font?: string
    color?: string
    [key: string]: any // 允许其他属性
  }

  export class Table {
    constructor(options: TableOptions)
  }

  export interface TableOptions {
    rows: TableRow[]
    width?: { size: number, type: string }
  }

  export class TableRow {
    constructor(options: TableRowOptions)
  }

  export interface TableRowOptions {
    children: TableCell[]
  }

  export class TableCell {
    constructor(options: TableCellOptions)
  }

  export interface TableCellOptions {
    children: Paragraph[]
    margins?: {
      top?: number
      bottom?: number
      left?: number
      right?: number
    }
    borders?: {
      top?: { style: string, size: number, color?: string }
      bottom?: { style: string, size: number, color?: string }
      left?: { style: string, size: number, color?: string }
      right?: { style: string, size: number, color?: string }
    }
    verticalAlign?: 'top' | 'center' | 'bottom'
    shading?: { fill?: string, type?: string, color?: string }
  }

  export enum HeadingLevel {
    HEADING_1 = 'Heading1',
    HEADING_2 = 'Heading2',
    HEADING_3 = 'Heading3',
    HEADING_4 = 'Heading4',
    HEADING_5 = 'Heading5',
    HEADING_6 = 'Heading6',
  }

  export class Packer {
    static toBlob(doc: Document): Promise<Blob>
    static toBuffer(doc: Document): Promise<Buffer>
  }
}
