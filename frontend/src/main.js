import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

// 引入 TDesign 样式
import 'tdesign-vue-next/es/style/index.css'
import TDesign from 'tdesign-vue-next'

// 引入全局样式
import './styles/global.css'
import './styles/theme.css'
import './styles/mobile.css'

// 引入全局错误处理
import { setupGlobalErrorHandler } from './utils/errorHandler'

const app = createApp(App)
const pinia = createPinia()

// 配置全局错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err, info)
}

// 设置全局错误监听
setupGlobalErrorHandler()

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(TDesign)

app.mount('#app')
