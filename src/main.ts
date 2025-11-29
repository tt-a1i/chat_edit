import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import './styles/tokens.css'
import './style.css'
import '@fortawesome/fontawesome-free/css/all.css'
import './assets/markdown-dark.css'

// 仅在开发环境加载 react-grab
if (import.meta.env.DEV) {
  import('react-grab').then(({ init }) => {
    init({
      // 可选配置
      // theme: 'dark',        // 主题: 'light' | 'dark'
      // color: '#3b82f6',     // 高亮颜色
      // crosshair: true,      // 显示十字准星
    })
  })
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
