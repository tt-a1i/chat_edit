import hljs from 'highlight.js'
import katex from 'katex'
import MarkdownIt from 'markdown-it'
import mdLinkAttrs from 'markdown-it-link-attributes'
import mdKatex from 'markdown-it-texmath'
import 'highlight.js/styles/github.css'

// 配置数学公式渲染规则
function renderKatex(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
    })
  } catch (error) {
    console.error('KaTeX error:', error)
    return latex
  }
}

// 初始化 markdown-it 实例
export function createMarkdownRenderer() {
  const md = new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    listIndent: 2,
    typographer: true,
    highlight(str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code class="language-${lang}">${
            hljs.highlight(str, { language: lang }).value
          }</code></pre>`
        } catch {}
      }
      return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
    },
  })

  // 添加特殊字符转换规则
  /*   const escapeMap: Record<string, string> = {
    '_': '\\_',
    '*': '\\*',
    '[': '\\[',
    ']': '\\]',
    '(': '\\(',
    ')': '\\)',
    '{': '\\{',
    '}': '\\}',
  } */

  // 添加数学公式支持
  md.use((md) => {
    // 行内公式
    const inlineRule = (state: any, silent: boolean) => {
      const start = state.pos
      const max = state.posMax

      if (state.src[start] !== '$') {
        return false
      }

      let pos = start + 1
      let found = false

      while (pos < max) {
        if (state.src[pos] === '$') {
          found = true
          break
        }
        pos++
      }

      if (!found || pos === start + 1) {
        return false
      }

      const content = state.src.slice(start + 1, pos)
      if (!silent) {
        const token = state.push('math_inline', 'math', 0)
        token.content = content
        token.markup = '$'
      }

      state.pos = pos + 1
      return true
    }

    // 块级公式
    const blockRule = (state: any, startLine: number, endLine: number, silent: boolean) => {
      const start = state.bMarks[startLine] + state.tShift[startLine]
      const max = state.eMarks[startLine]

      if (state.src.slice(start, start + 2) !== '$$') {
        return false
      }

      const pos = start + 2
      let firstLine = state.src.slice(pos, max)

      if (silent) {
        return true
      }

      let nextLine = startLine
      let endPos = -1

      while (nextLine < endLine) {
        nextLine++
        if (nextLine >= endLine) {
          break
        }

        const lineStart = state.bMarks[nextLine] + state.tShift[nextLine]
        const lineMax = state.eMarks[nextLine]
        const lineText = state.src.slice(lineStart, lineMax)

        endPos = lineText.indexOf('$$')
        if (endPos !== -1) {
          const content = `${firstLine}\n${
            state.getLines(startLine + 1, nextLine, state.tShift[startLine], true)}`
          const token = state.push('math_block', 'math', 0)
          token.block = true
          token.content = content
          token.markup = '$$'
          token.map = [startLine, nextLine]
          state.line = nextLine + 1
          return true
        }

        firstLine += `\n${lineText}`
      }

      return false
    }

    md.inline.ruler.after('escape', 'math_inline', inlineRule)
    md.block.ruler.before('fence', 'math_block', blockRule, {
      alt: ['paragraph', 'reference', 'blockquote', 'list'],
    })

    md.renderer.rules.math_inline = (tokens, idx) => {
      return renderKatex(tokens[idx].content, false)
    }

    md.renderer.rules.math_block = (tokens, idx) => {
      return renderKatex(tokens[idx].content, true)
    }
  })

  // 处理特殊字符转义
  // md.core.ruler.before('replacements', 'escape_special', (state) => {
  //   state.src = state.src.replace(/[\\_*[\](){}]/g, match => escapeMap[match] || match)
  //   return true
  // })

  md.use(mdKatex, {
    throwOnError: false,
    errorColor: ' #cc0000',
  }).use(mdLinkAttrs, {
    attrs: {
      target: '_blank',
      rel: 'noopener',
    },
  })

  return md
}

// 更新 renderMarkdown 函数
export function renderMarkdown(text: string): string {
  const md = createMarkdownRenderer()
  return md.render(text)
}
