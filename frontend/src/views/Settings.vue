<template>
  <div class="settings-page">
    <t-header class="header">
      <template #logo>
        <div class="logo" @click="$router.push('/')">
          <t-icon name="chevron-left" />
          <span>{{ $t('settings.settings') }}</span>
        </div>
      </template>
    </t-header>

    <div class="settings-content">
      <t-card :title="$t('settings.theme')">
        <t-radio-group v-model="appStore.theme" @change="handleThemeChange">
          <t-radio value="light">{{ $t('settings.themeLight') }}</t-radio>
          <t-radio value="dark">{{ $t('settings.themeDark') }}</t-radio>
          <t-radio value="auto">{{ $t('settings.themeAuto') }}</t-radio>
        </t-radio-group>
      </t-card>

      <t-card :title="$t('settings.language')">
        <t-select v-model="appStore.language" @change="handleLanguageChange">
          <t-option value="zh-CN" label="简体中文" />
          <t-option value="en-US" label="English" />
        </t-select>
      </t-card>

      <t-card :title="$t('settings.autoLock')">
        <t-space direction="vertical" style="width: 100%">
          <t-switch v-model="appStore.autoLockEnabled" @change="handleAutoLockChange">
            <template #label>{{ $t('settings.autoLock') }}</template>
          </t-switch>
          <div v-if="appStore.autoLockEnabled">
            <t-input-number
              v-model="appStore.autoLockTimeout"
              :min="1"
              :max="60"
              @change="handleAutoLockTimeoutChange"
            />
            <span style="margin-left: 8px;">{{ $t('settings.minutes') }}</span>
          </div>
        </t-space>
      </t-card>

      <t-card :title="$t('auth.changeMasterPassword')">
        <t-button theme="warning" @click="showChangePassword">
          {{ $t('auth.changeMasterPassword') }}
        </t-button>
      </t-card>
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
  background: var(--bg-color);
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

[theme-mode="dark"] .header {
  background: var(--bg-secondary);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
}

.settings-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.settings-content .t-card {
  margin-bottom: 16px;
}
</style>

