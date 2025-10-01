/**
 * html2pdf.js 类型声明
 */
declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[]
    filename?: string
    image?: { type?: string, quality?: number }
    html2canvas?: any
    jsPDF?: any
    pagebreak?: { mode?: string | string[], before?: string | string[], after?: string | string[], avoid?: string | string[] }
  }

  interface Html2Pdf {
    set(options: Html2PdfOptions): Html2Pdf
    from(element: HTMLElement | string): Html2Pdf
    save(): Promise<void>
    output(type: string, options?: any): Promise<any>
    outputPdf(type?: string): Promise<any>
    outputImg(type?: string): Promise<any>
    then(onFulfilled: (value: any) => any, onRejected?: (reason: any) => any): Html2Pdf
    toPdf(): Html2Pdf
    toContainer(): Html2Pdf
    toCanvas(): Html2Pdf
    toImg(): Html2Pdf
    get(key: string): any
  }

  function html2pdf(): Html2Pdf
  function html2pdf(element: HTMLElement | string, options?: Html2PdfOptions): Html2Pdf

  export = html2pdf
}
