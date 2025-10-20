<template>
  <div class="unlock-container">
    <div class="unlock-box">
      <div class="unlock-header">
        <t-icon name="lock-on" size="64px" style="color: #1890ff;" />
        <h1>{{ $t('auth.unlock') }}</h1>
        <p>{{ $t('auth.enterMasterPassword') }}</p>
      </div>

      <t-form ref="formRef" :data="form" :rules="rules" @submit="handleUnlock">
        <t-form-item name="password">
          <t-input
            v-model="form.password"
            type="password"
            size="large"
            :placeholder="$t('auth.enterPassword')"
            @keyup.enter="handleUnlock"
          >
            <template #prefix-icon>
              <t-icon name="lock-on" />
            </template>
          </t-input>
        </t-form-item>

        <t-form-item v-if="hint">
          <div class="hint-box">
            <t-icon name="info-circle" />
            <span>{{ $t('auth.passwordHint') }}: {{ hint }}</span>
          </div>
        </t-form-item>

        <t-form-item>
          <t-button
            theme="primary"
            size="large"
            block
            :loading="loading"
            @click="handleUnlock"
          >
            {{ $t('auth.unlock') }}
          </t-button>
        </t-form-item>
      </t-form>

      <div class="unlock-footer">
        <t-button variant="text" @click="showSetPassword" v-if="!hasPassword">
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
import { ref, onMounted } from 'vue'
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
const form = ref({
  password: ''
})

const setPasswordVisible = ref(false)
const setPasswordForm = ref({
  password: '',
  hint: ''
})

const rules = {
  password: [{ required: true, message: t('auth.enterPassword') }]
}

const setPasswordRules = {
  password: [
    { required: true, message: t('auth.enterPassword') },
    { min: 6, message: t('auth.passwordTooShort') }
  ]
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
    }
  } catch (error) {
    console.error('Check master password failed:', error)
  }
}

const handleUnlock = async () => {
  if (!form.value.password) {
    MessagePlugin.warning(t('auth.enterPassword'))
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
.unlock-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.unlock-box {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

[theme-mode="dark"] .unlock-box {
  background: var(--bg-secondary);
}

.unlock-header {
  text-align: center;
  margin-bottom: 32px;
}

.unlock-header h1 {
  margin: 16px 0 8px;
  font-size: 24px;
  font-weight: 600;
}

.unlock-header p {
  color: #666;
  font-size: 14px;
}

[theme-mode="dark"] .unlock-header p {
  color: #aaa;
}

.hint-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  font-size: 13px;
  color: #0284c7;
}

[theme-mode="dark"] .hint-box {
  background: rgba(2, 132, 199, 0.1);
}

.unlock-footer {
  text-align: center;
  margin-top: 16px;
}
</style>


