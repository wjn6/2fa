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

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(TDesign)

app.mount('#app')
