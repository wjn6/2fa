<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="login-logo">
          <div class="login-logo-icon">
            <t-icon name="secured" size="32px" />
          </div>
        </div>
        <h1>{{ $t('admin.admin') }}</h1>
      </div>

      <t-form ref="formRef" :data="form" :rules="rules" @submit="handleLogin">
        <t-form-item :label="$t('auth.username')" name="username">
          <t-input v-model="form.username" size="large">
            <template #prefix-icon>
              <t-icon name="user" />
            </template>
          </t-input>
        </t-form-item>

        <t-form-item :label="$t('auth.password')" name="password">
          <t-input v-model="form.password" type="password" size="large" @keyup.enter="handleLogin">
            <template #prefix-icon>
              <t-icon name="lock-on" />
            </template>
          </t-input>
        </t-form-item>

        <t-form-item>
          <t-button
            theme="primary"
            size="large"
            block
            :loading="loading"
            @click="handleLogin"
          >
            {{ $t('auth.login') }}
          </t-button>
        </t-form-item>
      </t-form>

      <div class="login-footer">
        <t-button variant="text" @click="$router.push('/')">
          {{ $t('common.back') }}
        </t-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAppStore } from '../stores/app'
import { authApi } from '../api'

const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()

const loading = ref(false)
const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: t('auth.username') }],
  password: [{ required: true, message: t('auth.password') }]
}

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    return
  }

  loading.value = true
  try {
    const res = await authApi.login(form.value)
    if (res.data.success) {
      appStore.login(res.data.data.token, res.data.data.user)
      MessagePlugin.success(t('common.success'))
      router.push('/admin')
    }
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 20px;
}

[theme-mode="dark"] .login-container {
  background: #1a1a1a;
}

.login-box {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;
}

[theme-mode="dark"] .login-box {
  background: #2a2a2a;
  border-color: #3a3a3a;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3), 0 1px 4px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-logo {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
}

.login-logo-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #0050b3 0%, #1890ff 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.25);
}

[theme-mode="dark"] .login-logo-icon {
  background: linear-gradient(135deg, #1890ff 0%, #4dabf7 100%);
  box-shadow: 0 8px 24px rgba(77, 171, 247, 0.3);
}

.login-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}

[theme-mode="dark"] .login-header h1 {
  color: #ffffff;
}

.login-subtitle {
  color: #999;
  font-size: 13px;
  margin: 0;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.login-footer {
  text-align: center;
  margin-top: 16px;
}
</style>


