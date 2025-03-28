import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'
import { defineComponent, h } from 'vue'

// 配置 Markdown 解析器
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        }</code></pre>`
      }
      catch (__) {}
    }
    // 对于未知语言，使用普通文本高亮
    return `<pre class="hljs dark:bg-gray-800"><code>${md.utils.escapeHtml(str)}</code></pre>`
  },
})

export default defineComponent({
  name: 'Markdown',
  props: {
    source: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    return () => {
      // 将原始Markdown渲染成HTML
      const renderedHTML = md.render(props.source || '')

      // 使用h函数创建一个包含HTML内容的div元素
      return h('div', {
        class: 'markdown-content',
        innerHTML: renderedHTML,
      })
    }
  },
})
