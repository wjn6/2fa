<template>
  <div class="theme-custom app-container">
    <t-card class="app-card">
      <div class="page-header">
        <h1>主题定制</h1>
        <t-space>
          <t-button theme="primary" @click="saveTheme">
            <template #icon><t-icon name="check" /></template>
            保存设置
          </t-button>
          <t-button variant="outline" @click="resetTheme">
            <template #icon><t-icon name="rollback" /></template>
            重置
          </t-button>
        </t-space>
      </div>

      <t-divider />

      <t-row :gutter="[24, 24]">
        <t-col :xs="12" :sm="6" :md="8">
          <t-form :data="form" label-width="100px" layout="vertical">
            <t-form-item label="主题模式">
              <t-radio-group v-model="form.mode" @change="applyTheme">
                <t-radio-button value="light">
                  <t-icon name="sunny" style="margin-right: 4px;" />
                  浅色
                </t-radio-button>
                <t-radio-button value="dark">
                  <t-icon name="moon" style="margin-right: 4px;" />
                  深色
                </t-radio-button>
                <t-radio-button value="auto">
                  <t-icon name="control-platform" style="margin-right: 4px;" />
                  自动
                </t-radio-button>
              </t-radio-group>
            </t-form-item>

            <t-form-item label="预设主题">
              <div class="preset-themes">
                <div 
                  v-for="preset in presetThemes" 
                  :key="preset.name"
                  class="preset-item"
                  :class="{ active: form.primary === preset.color }"
                  @click="applyPreset(preset)"
                >
                  <div class="preset-color" :style="{ background: preset.color }"></div>
                  <div class="preset-name">{{ preset.name }}</div>
                </div>
              </div>
            </t-form-item>

            <t-form-item label="自定义主色">
              <t-space>
                <input 
                  type="color" 
                  v-model="form.primary" 
                  @input="applyTheme" 
                  class="color-picker"
                />
                <t-input 
                  v-model="form.primary" 
                  placeholder="#1890ff"
                  style="width: 150px;"
                  @change="applyTheme"
                />
              </t-space>
            </t-form-item>
          </t-form>
        </t-col>

        <t-col :xs="12" :sm="6" :md="4">
          <div class="preview-section">
            <h3 class="preview-title">实时预览</h3>
            <div class="preview-card app-card">
              <h4 style="margin: 0 0 16px 0;">界面组件</h4>
              <t-space direction="vertical" style="width: 100%;">
                <t-space>
                  <t-button theme="primary" size="small">主要按钮</t-button>
                  <t-button size="small">次要按钮</t-button>
                  <t-button theme="danger" size="small">危险按钮</t-button>
                </t-space>
                <t-space>
                  <t-tag theme="primary">标签</t-tag>
                  <t-tag theme="success">成功</t-tag>
                  <t-tag theme="warning">警告</t-tag>
                </t-space>
                <t-switch v-model="previewSwitch" label="开关示例" />
                <t-progress :percentage="75" label="进度条" />
              </t-space>
            </div>
          </div>
        </t-col>
      </t-row>
    </t-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()

const form = ref({
  mode: appStore.theme || 'light',
  primary: '#1890ff'
})

const previewSwitch = ref(true)

// 预设主题
const presetThemes = [
  { name: '默认蓝', color: '#1890ff', desc: 'TDesign 默认蓝色' },
  { name: '科技紫', color: '#7356f1', desc: '科技感紫色' },
  { name: '商务灰', color: '#5e7ce0', desc: '沉稳商务灰蓝' },
  { name: '活力橙', color: '#ff7d00', desc: '活力橙色' },
  { name: '自然绿', color: '#00a870', desc: '清新绿色' },
  { name: '优雅粉', color: '#ed49b4', desc: '优雅粉色' },
  { name: '经典红', color: '#e34d59', desc: '经典红色' },
  { name: '深邃蓝', color: '#0052d9', desc: '深邃蓝色' }
]

const applyPreset = (preset) => {
  form.value.primary = preset.color
  applyTheme()
  MessagePlugin.success(`已应用「${preset.name}」主题`)
}

const applyTheme = () => {
  try {
    // 应用主题模式
    appStore.setTheme(form.value.mode)
    // 应用主色到 CSS 变量
    document.documentElement.style.setProperty('--td-brand-color', form.value.primary)
    document.documentElement.style.setProperty('--primary-color', form.value.primary)
  } catch (e) {
    console.error('应用主题失败:', e)
  }
}

const saveTheme = () => {
  try {
    localStorage.setItem('custom_theme_config', JSON.stringify({
      mode: form.value.mode,
      primary: form.value.primary
    }))
    applyTheme()
    MessagePlugin.success('主题设置已保存')
  } catch (e) {
    console.error('保存主题失败:', e)
    MessagePlugin.error('保存失败，请重试')
  }
}

const resetTheme = () => {
  form.value.mode = 'light'
  form.value.primary = '#1890ff'
  localStorage.removeItem('custom_theme_config')
  applyTheme()
  MessagePlugin.success('已重置为默认主题')
}

onMounted(() => {
  try {
    const saved = localStorage.getItem('custom_theme_config')
    if (saved) {
      const config = JSON.parse(saved)
      form.value.mode = config.mode || 'light'
      form.value.primary = config.primary || '#1890ff'
      applyTheme()
    }
  } catch (e) {
    console.error('加载主题配置失败:', e)
  }
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}

.page-header h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.preset-themes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.preset-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.preset-item:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}

.preset-item.active {
  border-color: var(--primary-color);
  background: var(--primary-color-light, rgba(24, 144, 255, 0.1));
}

.preset-color {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.preset-name {
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

.color-picker {
  width: 60px;
  height: 38px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  background: transparent;
}

.color-picker:hover {
  border-color: var(--primary-color);
}

.preview-section {
  position: sticky;
  top: 80px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-primary);
}

.preview-card {
  padding: 20px;
  min-height: 300px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .page-header h1 {
    font-size: 18px;
  }

  .preset-themes {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
  }

  .preset-item {
    padding: 8px;
  }

  .preset-color {
    width: 32px;
    height: 32px;
  }

  .preview-section {
    position: static;
  }
}
</style>


