<template>
  <div class="settings-page">
    <!-- 顶部返回栏 -->
    <div class="header">
      <div class="header-content">
        <div class="back-btn" @click="$router.push('/')">
          <t-icon name="chevron-left" size="20px" />
          <span>返回</span>
        </div>
        <h1>设置</h1>
      </div>
    </div>

    <div class="settings-content app-container">
      <!-- 外观设置 -->
      <div class="setting-section">
        <div class="section-title">
          <t-icon name="palette" />
          <span>外观</span>
        </div>
        <div class="setting-card app-card">
          <div class="setting-item">
            <div class="item-info">
              <div class="item-label">主题模式</div>
              <div class="item-desc">选择您喜欢的主题</div>
            </div>
            <t-radio-group v-model="appStore.theme" @change="handleThemeChange" variant="default-filled">
              <t-radio-button value="light">浅色</t-radio-button>
              <t-radio-button value="dark">深色</t-radio-button>
              <t-radio-button value="auto">自动</t-radio-button>
            </t-radio-group>
          </div>
        </div>
      </div>

      <!-- 语言设置 -->
      <div class="setting-section">
        <div class="section-title">
          <t-icon name="translate" />
          <span>语言</span>
        </div>
        <div class="setting-card app-card">
          <div class="setting-item">
            <div class="item-info">
              <div class="item-label">界面语言</div>
              <div class="item-desc">选择显示语言</div>
            </div>
            <t-select v-model="appStore.language" @change="handleLanguageChange" style="width: 150px;">
              <t-option value="zh-CN" label="简体中文" />
              <t-option value="en-US" label="English" />
            </t-select>
          </div>
        </div>
      </div>

      <!-- 安全设置 -->
      <div class="setting-section">
        <div class="section-title">
          <t-icon name="lock-on" />
          <span>安全</span>
        </div>
        <div class="setting-card app-card">
          <div class="setting-item">
            <div class="item-info">
              <div class="item-label">自动锁定</div>
              <div class="item-desc">闲置后自动锁定应用</div>
            </div>
            <t-switch v-model="appStore.autoLockEnabled" @change="handleAutoLockChange" />
          </div>
          
          <div v-if="appStore.autoLockEnabled" class="setting-item sub-item">
            <div class="item-info">
              <div class="item-label">锁定时间</div>
              <div class="item-desc">闲置多久后自动锁定</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <t-input-number
                v-model="appStore.autoLockTimeout"
                :min="1"
                :max="60"
                @change="handleAutoLockTimeoutChange"
                style="width: 100px;"
              />
              <span class="unit-text">分钟</span>
            </div>
          </div>

          <t-divider />

          <div class="setting-item">
            <div class="item-info">
              <div class="item-label">修改主密码</div>
              <div class="item-desc">更改您的主密码</div>
            </div>
            <t-button theme="default" variant="outline" @click="showChangePassword">
              修改密码
            </t-button>
          </div>
        </div>
      </div>

      <!-- 关于 -->
      <div class="setting-section">
        <div class="section-title">
          <t-icon name="info-circle" />
          <span>关于</span>
        </div>
        <div class="setting-card app-card">
          <div class="setting-item">
            <div class="item-info">
              <div class="item-label">版本信息</div>
              <div class="item-desc">2FA Authenticator v2.3</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <t-dialog
      v-model:visible="changePasswordVisible"
      :header="$t('auth.changeMasterPassword')"
      width="500px"
      @confirm="handleChangePassword"
    >
      <t-form :data="passwordForm">
        <t-form-item label="旧密码">
          <t-input v-model="passwordForm.oldPassword" type="password" />
        </t-form-item>
        <t-form-item label="新密码">
          <t-input v-model="passwordForm.newPassword" type="password" />
        </t-form-item>
        <t-form-item label="密码提示">
          <t-input v-model="passwordForm.hint" placeholder="可选" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAppStore } from '../stores/app'
import { authApi } from '../api'

const { locale } = useI18n()
const appStore = useAppStore()

const changePasswordVisible = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  hint: ''
})

const handleThemeChange = (value) => {
  appStore.setTheme(value)
  MessagePlugin.success('主题已更新')
}

const handleLanguageChange = (value) => {
  appStore.setLanguage(value)
  locale.value = value
  MessagePlugin.success('语言已更新')
}

const handleAutoLockChange = () => {
  MessagePlugin.success('设置已更新')
}

const handleAutoLockTimeoutChange = () => {
  MessagePlugin.success('自动锁定时间已更新')
}

const showChangePassword = () => {
  changePasswordVisible.value = true
}

const handleChangePassword = async () => {
  try {
    const res = await authApi.changeMasterPassword(passwordForm.value)
    if (res.data.success) {
      MessagePlugin.success('密码修改成功')
      changePasswordVisible.value = false
      appStore.lock()
    }
  } catch (error) {
    console.error('Change password failed:', error)
  }
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f5f5f5;
}

[theme-mode="dark"] .settings-page {
  background: #1a1a1a;
}

.header {
  background: white;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
}

[theme-mode="dark"] .header {
  background: #2a2a2a;
  border-bottom-color: #3a3a3a;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
  font-size: 14px;
}

.back-btn:hover {
  color: #1890ff;
}

[theme-mode="dark"] .back-btn {
  color: #999;
}

[theme-mode="dark"] .back-btn:hover {
  color: #1890ff;
}

.header-content h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

[theme-mode="dark"] .header-content h1 {
  color: #e5e5e5;
}

.settings-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.setting-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 12px;
  padding-left: 4px;
}

[theme-mode="dark"] .section-title {
  color: #999;
}

.setting-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e7e7e7;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02);
  transition: box-shadow 0.2s ease;
}

.setting-card:hover {
  box-shadow: 0 2px 4px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
}

[theme-mode="dark"] .setting-card {
  background: #2a2a2a;
  border-color: #3a3a3a;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.15);
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  transition: background 0.2s;
}

.setting-item:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

[theme-mode="dark"] .setting-item:not(:last-child) {
  border-bottom-color: #3a3a3a;
}

.sub-item {
  background: #fafafa;
  padding-left: 40px;
}

[theme-mode="dark"] .sub-item {
  background: #252525;
}

.item-info {
  flex: 1;
}

.item-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

[theme-mode="dark"] .item-label {
  color: #e5e5e5;
}

.item-desc {
  font-size: 13px;
  color: #999;
}

.unit-text {
  font-size: 14px;
  color: #666;
}

[theme-mode="dark"] .unit-text {
  color: #999;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .header-content {
    padding: 12px 16px;
  }

  .header-content h1 {
    font-size: 18px;
  }

  .settings-content {
    padding: 16px 12px;
  }

  .section-title {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .setting-card {
    border-radius: 10px;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
  }

  .sub-item {
    padding-left: 32px;
  }

  .setting-item > *:last-child {
    width: 100%;
  }

  .item-label {
    font-size: 13px;
  }

  .item-desc {
    font-size: 12px;
  }

  /* 移动端单选按钮组优化 */
  .setting-item :deep(.t-radio-group) {
    width: 100%;
  }

  .setting-item :deep(.t-radio-button) {
    flex: 1;
    text-align: center;
  }

  /* 移动端选择框优化 */
  .setting-item :deep(.t-select) {
    width: 100% !important;
  }
}

/* 超小屏幕优化 */
@media (max-width: 375px) {
  .settings-content {
    padding: 12px 10px;
  }

  .setting-item {
    padding: 12px 14px;
  }

  .section-title {
    font-size: 12px;
  }

  .item-label {
    font-size: 12px;
  }

  .item-desc {
    font-size: 11px;
  }
}
</style>

