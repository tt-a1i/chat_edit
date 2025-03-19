import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from 'docx'
import html2pdf from 'html2pdf.js'
import TurndownService from 'turndown'

class DocumentExporter {
  private content: string
  private parser: DOMParser
  private quill?: any

  constructor(content: string, quill?: any) {
    this.content = content
    this.parser = new DOMParser()
    this.quill = quill
  }

  private convertHtmlToDocxElements(html: string) {
    // console.log("Input HTML:", html); // 打印输入的HTML
    const doc = this.parser.parseFromString(html, 'text/html')
    const elements: any[] = []

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return new TextRun({
          text: node.textContent || '',
          size: 24,
        })
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        // console.log("Processing element:", element.tagName, element.outerHTML); // 打印当前处理的元素

        // 处理Quill代码块
        if (element.classList.contains('ql-code-block-container')) {
          // 获取所有代码行
          const codeLines = Array.from(
            element.querySelectorAll('.ql-code-block'),
          )
            .map(block => block.textContent || '')
            .filter(line => line !== '\n' && line !== '\r\n')

          // 为每一行创建一个单独的段落
          return codeLines.map(
            line =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line || '', // 保留空行
                    size: 24,
                  }),
                ],
                spacing: { before: 120, after: 120 }, // 减小段落间距
              }),
          )
        }

        // 处理单独的代码块行
        if (element.classList.contains('ql-code-block')) {
          return null // 跳过单独的代码块行
        }

        // 获取子节点处理结果
        const children = Array.from(element.childNodes)
          .map(processNode)
          .filter(Boolean)

        // 处理代码块
        if (element.tagName.toLowerCase() === 'pre') {
          // console.log("Found pre element:", element.outerHTML); // 打印找到的pre元素
          const codeContent = element.textContent || ''
          // console.log("Code content:", codeContent); // 打印代码内容

          // 尝试处理可能嵌套的code标签
          const codeElement = element.querySelector('code')
          const finalContent = codeElement
            ? codeElement.textContent || ''
            : codeContent
          // console.log("Final code content:", finalContent); // 打印最终的代码内容

          return new Paragraph({
            children: [
              new TextRun({
                text: finalContent,
                font: 'Consolas',
                size: 20,
                color: '666666',
              }),
            ],
            spacing: { before: 240, after: 240 },
            shading: {
              type: 'solid',
              color: 'F5F5F5',
            },
            indent: { left: 720 },
          })
        }

        if (element.tagName.toLowerCase() === 'li') {
          const listType = element.getAttribute('data-list')
          // 检查 data-list 属性来决定列表类型
          if (listType === 'bullet') {
            return new Paragraph({
              bullet: {
                level: 0,
              },
              children: [
                new TextRun({
                  text: element.textContent || '',
                  size: 24,
                }),
              ],
              indent: { left: 720, hanging: 360 },
            })
          }
          else if (listType === 'ordered') {
            return new Paragraph({
              numbering: {
                reference: 'number-list',
                level: 0,
              },
              children: [
                new TextRun({
                  text: element.textContent || '',
                  size: 24,
                }),
              ],
            })
          }
        }

        switch (element.tagName.toLowerCase()) {
          case 'table':{
            const rows = Array.from(element.querySelectorAll('tr'))
            const tableRows = rows.map((row) => {
              const cells = Array.from(row.querySelectorAll('td, th'))
              return new TableRow({
                children: cells.map(
                  cell =>
                    new TableCell({
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: cell.textContent || '',
                              size: 24,
                              bold: cell.tagName.toLowerCase() === 'th',
                            }),
                          ],
                          spacing: {
                            before: 80, // 减小段落上间距
                            after: 80, // 减小段落下间距
                          },
                        }),
                      ],
                      margins: {
                        top: 80, // 减小单元格上边距
                        bottom: 80, // 减小单元格下边距
                        left: 100, // 保持左右边距不变
                        right: 100,
                      },
                      borders: {
                        top: { style: 'single', size: 1 },
                        bottom: { style: 'single', size: 1 },
                        left: { style: 'single', size: 1 },
                        right: { style: 'single', size: 1 },
                      },
                      verticalAlign: 'center',
                    }),
                ),
              })
            })

            return new Table({
              rows: tableRows,
              width: {
                size: 8500, // 使用固定宽度而不是百分比
                type: 'dxa', // 使用绝对单位
              },
            })
          }
          case 'h1':
            return new Paragraph({
              children: children.map(child => ({ ...child, size: 36 })),
              heading: HeadingLevel.HEADING_1,
            })
          case 'h2':
            return new Paragraph({
              children: children.map(child => ({ ...child, size: 32 })),
              heading: HeadingLevel.HEADING_2,
            })
          case 'h3':
            return new Paragraph({
              children: children.map(child => ({ ...child, size: 28 })),
              heading: HeadingLevel.HEADING_3,
            })
          case 'p':
            return new Paragraph({
              children,
              spacing: { before: 200, after: 200 },
            })
          case 'strong':
          case 'b':
            return new TextRun({
              text: element.textContent || '',
              size: 24,
              bold: true,
            })
          case 'em':
          case 'i':
            return new TextRun({
              text: element.textContent || '',
              size: 24,
              italics: true,
            })
          case 'u':
            return new TextRun({
              text: element.textContent || '',
              size: 24,
              underline: {},
            })
          case 'code':
            return new TextRun({
              text: element.textContent || '',
              font: 'Consolas',
              size: 20,
              color: '666666',
            })
          case 'ol':
          case 'ul':
            return Array.from(element.children).map(processNode)
        }
      }
      return null
    }

    Array.from(doc.body.childNodes).forEach((node) => {
      const processed = processNode(node)
      if (Array.isArray(processed)) {
        elements.push(...processed)
      }
      else if (processed) {
        elements.push(processed)
      }
    })

    // console.log("Generated elements:", elements); // 打印生成的元素
    return elements
  }

  async exportAs(format: string, download: boolean = true) {
    switch (format) {
      case 'docx':{
        const elements = this.convertHtmlToDocxElements(this.content)

        const doc = new Document({
          styles: {
            default: {
              document: {
                run: {
                  size: 24,
                },
              },
            },
          },
          numbering: {
            config: [
              {
                reference: 'number-list',
                levels: [
                  {
                    level: 0,
                    format: 'decimal',
                    text: '%1.',
                    alignment: 'left',
                    style: {
                      paragraph: {
                        indent: { left: 720, hanging: 360 },
                      },
                    },
                  },
                ],
              },
            ],
          },
          sections: [
            {
              properties: {
                page: {
                  margin: {
                    top: 1440, // 1 inch
                    right: 1440, // 1 inch
                    bottom: 1440, // 1 inch
                    left: 1440, // 1 inch
                  },
                },
              },
              children: elements,
            },
          ],
        })

        try {
          const buffer = await Packer.toBlob(doc)
          const url = window.URL.createObjectURL(buffer)
          const link = document.createElement('a')
          link.href = url
          link.download = `document-${new Date().getTime()}.docx`
          link.click()
          window.URL.revokeObjectURL(url)
        }
        catch (error) {
          console.error('Error generating document:', error)
          throw error
        }
        break
      }

      case 'pdf':
      {
        if (!this.quill) {
          throw new Error('Quill instance is required for PDF export')
        }
        const element = this.quill.root.cloneNode(true) as HTMLElement

        // 添加表格样式优化
        const tables = element.querySelectorAll('table')
        tables.forEach((table) => {
          table.style.borderCollapse = 'collapse'
          table.style.width = '100%'

          const cells = table.querySelectorAll('td, th')
          cells.forEach((cell) => {
            // 增加单元格内边距，防止内容压住边框
            cell.style.padding = '8px'
            cell.style.borderSpacing = '0'
            cell.style.verticalAlign = 'top'
            // 确保单元格有足够的下边距
            cell.style.paddingBottom = '12px'
          })
        })

        const opt = {
          margin: 1,
          filename: `document-${new Date().getTime()}.pdf`,
          html2canvas: {
            scale: 2,
            // 改进表格渲染
            letterRendering: true,
            useCORS: true,
          },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
        }
        await html2pdf().set(opt).from(element).save()
        break
      }
      case 'markdown':{
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlock: '```',
          emDelimiter: '_',
        })

        turndownService.addRule('table', {
          filter: 'table',
          replacement(content, node) {
            const rows = node.querySelectorAll('tr')
            let markdownTable = ''

            const headerRow = rows[0]
            const headers = headerRow.querySelectorAll('th, td')
            markdownTable += `| ${
              Array.from(headers)
                .map(header =>
                  turndownService.turndown(header.innerHTML.trim()),
                )
                .join(' | ')
            } |\n`

            markdownTable += `| ${
              Array.from(headers)
                .map(() => '---')
                .join(' | ')
            } |\n`

            for (let i = 1; i < rows.length; i++) {
              const cells = rows[i].querySelectorAll('td')
              markdownTable += `| ${
                Array.from(cells)
                  .map(cell =>
                    turndownService.turndown(cell.innerHTML.trim()),
                  )
                  .join(' | ')
              } |\n`
            }

            return markdownTable
          },
        })

        const markdownContent = turndownService.turndown(this.content)
        if (download) {
          const blob = new Blob([markdownContent], { type: 'text/markdown' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `document-${new Date().getTime()}.md`
          link.click()
          window.URL.revokeObjectURL(url)
          break
        }
        else {
          return markdownContent
        }
      }
    }
  }
}

export function createExporter(content: string, quill?: any) {
  return new DocumentExporter(content, quill)
}
