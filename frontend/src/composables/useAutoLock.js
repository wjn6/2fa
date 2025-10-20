import { onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../stores/app'

export function useAutoLock() {
  const appStore = useAppStore()
  let checkInterval = null
  let activityListeners = []

  const updateActivity = () => {
    appStore.updateActivity()
  }

  const checkLock = () => {
    const shouldLock = appStore.checkAutoLock()
    if (shouldLock) {
      console.log('Auto locked due to inactivity')
    }
  }

  const startMonitoring = () => {
    // 监听用户活动
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    
    events.forEach(event => {
      document.addEventListener(event, updateActivity)
      activityListeners.push({ event, handler: updateActivity })
    })

    // 每分钟检查一次
    checkInterval = setInterval(checkLock, 60 * 1000)
  }

  const stopMonitoring = () => {
    // 移除事件监听
    activityListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler)
    })
    activityListeners = []

    // 清除定时器
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
  }

  onMounted(() => {
    if (appStore.autoLockEnabled) {
      startMonitoring()
    }
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    startMonitoring,
    stopMonitoring
  }
}


