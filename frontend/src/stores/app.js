import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 状态
  const theme = ref(localStorage.getItem('theme') || 'light')
  const language = ref(localStorage.getItem('language') || 'zh-CN')
  const isLocked = ref(true)
  const sessionToken = ref(localStorage.getItem('sessionToken') || '')
  const autoLockEnabled = ref(true)
  const autoLockTimeout = ref(15) // 分钟
  const lastActivityTime = ref(Date.now())

  // 用户信息（后台管理）
  const user = ref(null)
  const authToken = ref(localStorage.getItem('authToken') || '')

  // 计算属性
  const isDarkMode = computed(() => {
    if (theme.value === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return theme.value === 'dark'
  })

  const isAuthenticated = computed(() => !!authToken.value)
  const isUnlocked = computed(() => !isLocked.value && !!sessionToken.value)

  // 方法
  function setTheme(newTheme) {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme()
  }

  function applyTheme() {
    const isDark = isDarkMode.value
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.setAttribute('theme-mode', isDark ? 'dark' : 'light')
  }

  function setLanguage(newLanguage) {
    language.value = newLanguage
    localStorage.setItem('language', newLanguage)
  }

  function unlock(token) {
    isLocked.value = false
    sessionToken.value = token
    localStorage.setItem('sessionToken', token)
    updateActivity()
  }

  function lock() {
    isLocked.value = true
    sessionToken.value = ''
    localStorage.removeItem('sessionToken')
  }

  function login(token, userData) {
    authToken.value = token
    user.value = userData
    localStorage.setItem('authToken', token)
  }

  function logout() {
    authToken.value = ''
    user.value = null
    localStorage.removeItem('authToken')
  }

  function updateActivity() {
    lastActivityTime.value = Date.now()
  }

  function checkAutoLock() {
    if (!autoLockEnabled.value || isLocked.value) return

    const inactiveTime = Date.now() - lastActivityTime.value
    const timeoutMs = autoLockTimeout.value * 60 * 1000

    if (inactiveTime > timeoutMs) {
      lock()
      return true
    }
    return false
  }

  // 初始化
  applyTheme()

  // 监听系统主题变化
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'auto') {
        applyTheme()
      }
    })
  }

  return {
    theme,
    language,
    isLocked,
    sessionToken,
    autoLockEnabled,
    autoLockTimeout,
    lastActivityTime,
    user,
    authToken,
    isDarkMode,
    isAuthenticated,
    isUnlocked,
    setTheme,
    applyTheme,
    setLanguage,
    unlock,
    lock,
    login,
    logout,
    updateActivity,
    checkAutoLock
  }
})

