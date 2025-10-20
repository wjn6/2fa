<template>
  <div id="app" :class="{ 'dark': appStore.isDarkMode }">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAppStore } from './stores/app'
import { useAutoLock } from './composables/useAutoLock'

const appStore = useAppStore()
const { startMonitoring } = useAutoLock()

onMounted(() => {
  // 应用主题
  appStore.applyTheme()
  
  // 启动自动锁定监控
  if (appStore.autoLockEnabled) {
    startMonitoring()
  }
})
</script>

<style>
#app {
  min-height: 100vh;
  transition: all 0.3s;
}
</style>
