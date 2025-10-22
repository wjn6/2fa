<template>
  <div class="login-container">
    <div class="login-box" :class="{ 'shake': showShake }">
      <!-- 图标 -->
      <div class="login-icon">
        <t-icon :name="isAdminMode ? 'secured' : 'user'" />
      </div>

      <!-- 标题 -->
      <h1 class="login-title">2FA Authenticator</h1>
      <p class="login-subtitle">{{ isAdminMode ? '管理员登录' : '用户登录' }}</p>

      <!-- 登录模式切换 -->
      <div class="mode-switch">
        <t-button 
          variant="text" 
          size="small" 
          @click="toggleMode"
          class="switch-btn"
        >
          <t-icon :name="isAdminMode ? 'user' : 'secured'" />
          <span>切换到{{ isAdminMode ? '用户' : '管理员' }}登录</span>
        </t-button>
      </div>

      <!-- 登录表单 -->
      <div class="login-form">
        <!-- 用户名（普通用户模式） -->
        <div v-if="!isAdminMode" class="input-wrapper">
          <t-input
            v-model="form.username"
            size="large"
            placeholder="用户名"
            :disabled="loading"
            @keyup.enter="focusPassword"
          >
            <template #prefix-icon><t-icon name="user" /></template>
          </t-input>
        </div>

        <!-- 密码 -->
        <div class="input-wrapper">
          <t-input
            ref="passwordInput"
            v-model="form.password"
            type="password"
            size="large"
            :placeholder="isAdminMode ? '管理员密码' : '密码'"
            @keyup.enter="handleLogin"
            :disabled="loading"
          />
          <div v-if="isAdminMode" class="password-hint">请输入管理员密码</div>
        </div>

        <!-- 登录按钮 -->
        <t-button
          theme="primary"
          size="large"
          block
          :loading="loading"
          :disabled="!isFormValid"
          @click="handleLogin"
          class="login-button"
        >
          {{ loading ? '登录中...' : '登录' }}
        </t-button>
      </div>

      <!-- 注册链接（普通用户模式） -->
      <div v-if="!isAdminMode" class="login-footer">
        <span>还没有账号？</span>
        <t-button variant="text" size="small" @click="$router.push('/register')">
          立即注册
        </t-button>
      </div>

      <!-- 返回 -->
      <div class="login-footer">
        <t-button variant="text" size="small" @click="$router.push('/')">
          返回首页
        </t-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAppStore } from '../stores/app'
import { authApi, userApi } from '../api'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const loading = ref(false)
const showShake = ref(false)
const passwordInput = ref(null)
const isAdminMode = ref(true) // 默认管理员登录

const form = ref({
  username: route.query.username || '',
  password: ''
})

// 如果 URL 中有 username 参数，自动切换到用户模式
if (route.query.username) {
  isAdminMode.value = false
}

const isFormValid = computed(() => {
  if (isAdminMode.value) {
    return form.value.password.length > 0
  }
  return form.value.username.length > 0 && form.value.password.length > 0
})

// 自动聚焦
onMounted(() => {
  focusInput()
})

const focusInput = () => {
  nextTick(() => {
    if (!isAdminMode.value && !form.value.username) {
      // 用户模式且没有用户名，聚焦用户名输入框
      const usernameInput = document.querySelector('input[placeholder="用户名"]')
      usernameInput?.focus()
    } else {
      // 否则聚焦密码输入框
      if (passwordInput.value) {
        passwordInput.value.$el.querySelector('input')?.focus()
      }
    }
  })
}

const focusPassword = () => {
  if (passwordInput.value) {
    passwordInput.value.$el.querySelector('input')?.focus()
  }
}

const toggleMode = () => {
  isAdminMode.value = !isAdminMode.value
  form.value.password = ''
  if (!isAdminMode.value) {
    form.value.username = route.query.username || ''
  }
  focusInput()
}

const triggerShake = () => {
  showShake.value = true
  setTimeout(() => {
    showShake.value = false
  }, 500)
}

const handleLogin = async () => {
  if (!isFormValid.value) {
    return
  }

  loading.value = true
  try {
    if (isAdminMode.value) {
      // 管理员登录
      const res = await authApi.login({
        username: 'admin',
        password: form.value.password
      })
      if (res.data.success) {
        appStore.login(res.data.data.token, res.data.data.user)
        MessagePlugin.success('登录成功')
        router.push('/admin')
      }
    } else {
      // 普通用户登录
      const res = await userApi.login({
        username: form.value.username,
        password: form.value.password
      })
      if (res.data.success) {
        appStore.login(res.data.data.token, res.data.data.user)
        MessagePlugin.success('登录成功')
        router.push('/')
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    triggerShake()
    form.value.password = ''
    focusPassword()
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
  background: var(--td-bg-color-container);
  border-radius: 16px;
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-box.shake {
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}

.login-icon {
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

.login-title {
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  margin: 0 0 8px 0;
  color: var(--td-text-color-primary);
}

.login-subtitle {
  text-align: center;
  color: var(--td-text-color-placeholder);
  margin: 0 0 16px 0;
  font-size: 14px;
}

.mode-switch {
  text-align: center;
  margin-bottom: 24px;
}

.switch-btn {
  color: var(--td-brand-color);
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-wrapper {
  position: relative;
}

.password-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  text-align: center;
}

.login-button {
  margin-top: 8px;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
}

.login-footer {
  margin-top: 16px;
  text-align: center;
  color: var(--td-text-color-secondary);
  font-size: 14px;
}

.login-footer span {
  margin-right: 8px;
}

/* 暗色模式 */
.dark .login-container {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.dark .login-box {
  background: var(--td-bg-color-container);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
}

/* 响应式 */
@media (max-width: 480px) {
  .login-box {
    padding: 32px 24px;
  }

  .login-icon {
    width: 64px;
    height: 64px;
    font-size: 32px;
  }

  .login-title {
    font-size: 24px;
  }
}
</style>
