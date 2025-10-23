<template>
  <div class="login-container">
    <div class="login-card app-card fade-in" :class="{ 'shake': showShake }">
      <!-- 图标 -->
      <div class="login-header">
        <div class="brand">
          <div class="brand-logo rounded-md">
            <t-icon :name="isAdminMode ? 'secured' : 'user'" />
          </div>
          <div class="brand-meta">
            <h1 class="login-title">2FA Authenticator</h1>
            <p class="login-subtitle">{{ isAdminMode ? '管理员登录' : '用户登录' }}</p>
          </div>
        </div>
        <t-button variant="text" size="small" @click="toggleMode" class="switch-btn">
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
        <t-button variant="text" size="small" @click="$router.push('/register')">立即注册</t-button>
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
    background: linear-gradient(135deg, #0b1526 0%, #0f284f 100%);
    padding: 24px;
  }

  .login-card {
    width: 100%;
    max-width: 440px;
    padding: 36px 32px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
  }

.login-box.shake {
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
  20%, 40%, 60%, 80% { transform: translateX(8px); }
}

  .login-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-logo {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #0050b3 0%, #1890ff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 8px 24px rgba(24, 144, 255, 0.25);
  }

  .brand-meta { display: flex; flex-direction: column; }

.login-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
}

.login-subtitle {
  color: var(--text-secondary);
  margin: 2px 0 0 0;
  font-size: 12px;
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
    margin-top: 12px;
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
    border-radius: var(--radius-md);
  }

  .login-footer {
    margin-top: 12px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 13px;
  }

.login-footer span {
  margin-right: 8px;
}

/* 暗色模式 */
  .dark .login-container {
    background: linear-gradient(135deg, #0b0f1a 0%, #0f1e3a 100%);
  }

/* 响应式 */
@media (max-width: 480px) {
  .login-card { padding: 28px 24px; }
  .login-title { font-size: 20px; }
}
</style>
