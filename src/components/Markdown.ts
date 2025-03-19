import { Component, computed, defineComponent, h, ref } from 'vue'
import highlightjs from 'markdown-it-highlightjs'
import markdownit from 'markdown-it'
import katex from 'markdown-it-katex'
import 'katex/dist/katex.min.css'

const Markdown: Component = defineComponent({
  props: {
    source: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const md = ref<markdownit>(
      markdownit({
        html: true,
        linkify: true,
        typographer: true
      })
    )
    md.value.use(katex, {
      throwOnError: false,
      errorColor: '#cc0000'
    })
    md.value.use(highlightjs, {
      inline: true,
      auto: true,
      ignoreIllegals: true,
    })



    const content = computed(() => md.value.render(props.source))

    return () => h('div', {
      innerHTML: content.value,
      class: 'markdown-body katex-math' // 添加必要的类名
    })
  },
})

export default Markdown
