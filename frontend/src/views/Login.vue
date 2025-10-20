<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <t-icon name="shield" size="64px" style="color: #1890ff;" />
        <h1>{{ $t('admin.admin') }}</h1>
        <p>2FA Notebook Admin Panel</p>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

[theme-mode="dark"] .login-box {
  background: var(--bg-secondary);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  margin: 16px 0 8px;
  font-size: 24px;
  font-weight: 600;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.login-footer {
  text-align: center;
  margin-top: 16px;
}
</style>

