<template>
  <div class="unlock-container">
    <div class="unlock-box" :class="{ 'shake': showShake }">
      <!-- 图标 -->
      <div class="unlock-icon">
        <t-icon name="lock-on" />
      </div>

      <!-- 标题 -->
      <h1 class="unlock-title">{{ $t('auth.unlock') }}</h1>

      <!-- 提示 -->
      <div v-if="hint" class="hint-box">
        <t-icon name="info-circle" size="14px" />
        <span>{{ hint }}</span>
      </div>

      <!-- 密码输入 -->
      <div class="password-wrapper">
        <t-input
          ref="passwordInput"
          v-model="form.password"
          type="password"
          size="large"
          :placeholder="$t('auth.enterPassword')"
          @keyup.enter="handleUnlock"
          :disabled="loading"
        />
        <div class="password-hint">{{ $t('auth.enterMasterPassword') }}</div>
      </div>

      <!-- 解锁按钮 -->
      <t-button
        theme="primary"
        size="large"
        block
        :loading="loading"
        :disabled="!form.password"
        @click="handleUnlock"
        class="unlock-button"
      >
        {{ loading ? $t('auth.unlocking') : $t('auth.unlock') }}
      </t-button>

      <!-- 底部 -->
      <div class="unlock-footer">
        <t-button variant="text" size="small" @click="showSetPassword" v-if="!hasPassword">
          {{ $t('auth.setMasterPassword') }}
        </t-button>
      </div>
    </div>

    <!-- 设置主密码对话框 -->
    <t-dialog
      v-model:visible="setPasswordVisible"
      :header="$t('auth.setMasterPassword')"
      width="500px"
      @confirm="handleSetPassword"
    >
      <t-form :data="setPasswordForm" :rules="setPasswordRules">
        <t-form-item :label="$t('auth.password')" name="password">
          <t-input v-model="setPasswordForm.password" type="password" />
        </t-form-item>
        <t-form-item :label="$t('auth.passwordHint')" name="hint">
          <t-input v-model="setPasswordForm.hint" :placeholder="$t('auth.passwordHint') + '（可选）'" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAppStore } from '../stores/app'
import { authApi } from '../api'

const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()

const loading = ref(false)
const hasPassword = ref(true)
const hint = ref('')
const showShake = ref(false)
const passwordInput = ref(null)
const form = ref({
  password: ''
})

const setPasswordVisible = ref(false)
const setPasswordForm = ref({
  password: '',
  hint: ''
})

const setPasswordRules = {
  password: [
    { required: true, message: t('auth.enterPassword') },
    { min: 6, message: t('auth.passwordTooShort') }
  ]
}

// 自动聚焦密码框
const focusPasswordInput = () => {
  nextTick(() => {
    if (passwordInput.value) {
      passwordInput.value.$el.querySelector('input')?.focus()
    }
  })
}

// 错误晃动动效
const triggerShake = () => {
  showShake.value = true
  setTimeout(() => {
    showShake.value = false
  }, 500)
}

const checkMasterPassword = async () => {
  try {
    const res = await authApi.checkMasterPassword()
    hasPassword.value = res.data.data.hasPassword

    if (!hasPassword.value) {
      setPasswordVisible.value = true
    } else {
      // 获取密码提示
      const hintRes = await authApi.getPasswordHint()
      hint.value = hintRes.data.data.hint
      focusPasswordInput()
    }
  } catch (error) {
    console.error('Check master password failed:', error)
  }
}

const handleUnlock = async () => {
  if (!form.value.password) {
    return
  }

  loading.value = true
  try {
    const res = await authApi.unlock({ password: form.value.password })
    if (res.data.success) {
      appStore.unlock(res.data.data.sessionToken)
      MessagePlugin.success(t('auth.unlockSuccess'))
      router.push('/')
    }
  } catch (error) {
    console.error('Unlock failed:', error)
    triggerShake()
    form.value.password = ''
    focusPasswordInput()
  } finally {
    loading.value = false
  }
}

const showSetPassword = () => {
  setPasswordVisible.value = true
}

const handleSetPassword = async () => {
  if (!setPasswordForm.value.password || setPasswordForm.value.password.length < 6) {
    MessagePlugin.warning(t('auth.passwordTooShort'))
    return
  }

  try {
    const res = await authApi.setMasterPassword(setPasswordForm.value)
    if (res.data.success) {
      MessagePlugin.success(t('common.success'))
      hasPassword.value = true
      setPasswordVisible.value = false
      hint.value = setPasswordForm.value.hint
      form.value.password = setPasswordForm.value.password
      handleUnlock()
    }
  } catch (error) {
    console.error('Set password failed:', error)
  }
}

onMounted(() => {
  checkMasterPassword()
})
</script>

<style scoped>
/* 容器 - Apple 风格 */
.unlock-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  padding: 20px;
}

[theme-mode="dark"] .unlock-container {
  background: #000000;
}

/* 解锁框 - 垂直布局 */
.unlock-box {
  width: 100%;
  max-width: 380px;
  text-align: center;
  animation: fadeIn 0.4s ease-out;
}

/* 图标 */
.unlock-icon {
  margin: 0 auto 32px;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #666;
}

[theme-mode="dark"] .unlock-icon {
  color: #999;
}

/* 标题 */
.unlock-title {
  margin: 0 0 24px 0;
  font-size: 22px;
  font-weight: 500;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}

[theme-mode="dark"] .unlock-title {
  color: #ffffff;
}

/* 密码提示框 */
.hint-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 24px;
  padding: 10px 16px;
  background: rgba(0, 82, 217, 0.06);
  border-radius: 8px;
  font-size: 13px;
  color: #0052d9;
  border: 1px solid rgba(0, 82, 217, 0.12);
}

[theme-mode="dark"] .hint-box {
  background: rgba(0, 82, 217, 0.1);
  border-color: rgba(0, 82, 217, 0.2);
  color: #4dabf7;
}

/* 密码输入包装 */
.password-wrapper {
  margin-bottom: 24px;
}

.password-wrapper :deep(.t-input) {
  height: 52px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.password-wrapper :deep(.t-input:hover) {
  border-color: #0052d9;
}

.password-wrapper :deep(.t-input:focus-within) {
  border-color: #0052d9;
  box-shadow: 0 0 0 3px rgba(0, 82, 217, 0.1);
  transform: scale(1.01);
}

.password-wrapper :deep(.t-input__inner) {
  font-size: 16px;
  text-align: center;
  letter-spacing: 2px;
}

[theme-mode="dark"] .password-wrapper :deep(.t-input) {
  background: #1a1a1a;
  border-color: #333;
  color: #fff;
}

[theme-mode="dark"] .password-wrapper :deep(.t-input:hover) {
  border-color: #0052d9;
}

/* 密码提示文字 */
.password-hint {
  margin-top: 12px;
  font-size: 13px;
  color: #999;
  letter-spacing: 0.2px;
}

[theme-mode="dark"] .password-hint {
  color: #666;
}

/* 解锁按钮 */
.unlock-button {
  height: 56px !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  margin-bottom: 24px;
}

.unlock-button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.3);
}

.unlock-button:not(:disabled):active {
  transform: translateY(0);
}

.unlock-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 底部 */
.unlock-footer {
  text-align: center;
  margin-top: 12px;
}

.unlock-footer :deep(.t-button) {
  color: #666;
  font-size: 14px;
}

.unlock-footer :deep(.t-button:hover) {
  color: #0052d9;
}

[theme-mode="dark"] .unlock-footer :deep(.t-button) {
  color: #999;
}

[theme-mode="dark"] .unlock-footer :deep(.t-button:hover) {
  color: #4dabf7;
}

/* 错误晃动动画 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}

.shake {
  animation: shake 0.5s ease;
}

/* 淡入动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .unlock-box {
    max-width: 100%;
  }

  .unlock-icon {
    width: 64px;
    height: 64px;
    font-size: 36px;
    margin-bottom: 24px;
  }

  .unlock-title {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .password-wrapper :deep(.t-input) {
    height: 48px;
  }

  .unlock-button {
    height: 52px !important;
  }

  .hint-box {
    font-size: 12px;
    padding: 8px 12px;
  }
}
</style>


