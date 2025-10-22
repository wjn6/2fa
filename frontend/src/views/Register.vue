<template>
  <div class="register-container">
    <div class="register-box" :class="{ 'shake': showShake }">
      <!-- 图标 -->
      <div class="register-icon">
        <t-icon name="user-add" />
      </div>

      <!-- 标题 -->
      <h1 class="register-title">创建账号</h1>
      <p class="register-subtitle">注册 2FA Authenticator</p>

      <!-- 注册表单 -->
      <t-form ref="formRef" :data="form" :rules="rules" @submit="handleRegister">
        <t-form-item name="username">
          <t-input
            v-model="form.username"
            size="large"
            placeholder="用户名（至少3个字符）"
            :disabled="loading"
          >
            <template #prefix-icon><t-icon name="user" /></template>
          </t-input>
        </t-form-item>

        <t-form-item name="email">
          <t-input
            v-model="form.email"
            size="large"
            type="email"
            placeholder="邮箱（可选）"
            :disabled="loading"
          >
            <template #prefix-icon><t-icon name="mail" /></template>
          </t-input>
        </t-form-item>

        <t-form-item name="password">
          <t-input
            v-model="form.password"
            size="large"
            type="password"
            placeholder="密码（至少6个字符）"
            :disabled="loading"
          >
            <template #prefix-icon><t-icon name="lock-on" /></template>
          </t-input>
        </t-form-item>

        <t-form-item name="confirmPassword">
          <t-input
            v-model="form.confirmPassword"
            size="large"
            type="password"
            placeholder="确认密码"
            :disabled="loading"
            @keyup.enter="handleRegister"
          >
            <template #prefix-icon><t-icon name="lock-on" /></template>
          </t-input>
        </t-form-item>

        <t-button
          theme="primary"
          size="large"
          block
          type="submit"
          :loading="loading"
          :disabled="!isFormValid"
          class="register-button"
        >
          {{ loading ? '注册中...' : '立即注册' }}
        </t-button>
      </t-form>

      <!-- 登录链接 -->
      <div class="register-footer">
        <span>已有账号？</span>
        <t-button variant="text" size="small" @click="$router.push('/login')">
          立即登录
        </t-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { userApi } from '../api'
import { useAppStore } from '../stores/app'

const router = useRouter()
const appStore = useAppStore()

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const formRef = ref(null)
const loading = ref(false)
const showShake = ref(false)

const rules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, message: '用户名至少3个字符' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码至少6个字符' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码' },
    { 
      validator: (val) => val === form.value.password,
      message: '两次密码不一致' 
    }
  ]
}

const isFormValid = computed(() => {
  return form.value.username.length >= 3 &&
         form.value.password.length >= 6 &&
         form.value.password === form.value.confirmPassword
})

const triggerShake = () => {
  showShake.value = true
  setTimeout(() => {
    showShake.value = false
  }, 500)
}

const handleRegister = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    const res = await userApi.register({
      username: form.value.username,
      password: form.value.password,
      email: form.value.email || null
    })

    if (res.data.success) {
      MessagePlugin.success({
        content: '注册成功！正在跳转登录...',
        duration: 2000
      })
      
      setTimeout(() => {
        router.push({
          path: '/login',
          query: { username: form.value.username }
        })
      }, 1000)
    }
  } catch (error) {
    console.error('注册失败:', error)
    triggerShake()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-box {
  background: var(--td-bg-color-container);
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.register-box.shake {
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}

.register-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.register-title {
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  margin: 0 0 8px 0;
  color: var(--td-text-color-primary);
}

.register-subtitle {
  text-align: center;
  color: var(--td-text-color-placeholder);
  margin: 0 0 32px 0;
  font-size: 14px;
}

.register-button {
  margin-top: 8px;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
}

.register-footer {
  margin-top: 24px;
  text-align: center;
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.register-footer span {
  margin-right: 8px;
}

/* 暗色模式 */
.dark .register-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.dark .register-box {
  background: var(--td-bg-color-container);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

/* 响应式 */
@media (max-width: 480px) {
  .register-box {
    padding: 32px 24px;
  }

  .register-icon {
    width: 64px;
    height: 64px;
    font-size: 32px;
  }

  .register-title {
    font-size: 24px;
  }
}
</style>

