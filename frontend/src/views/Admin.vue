<template>
  <div class="admin-layout">
    <t-layout>
      <t-aside width="200px">
        <t-menu v-model="activeMenu" theme="dark" @change="handleMenuChange">
          <t-menu-item value="dashboard">
            <template #icon><t-icon name="dashboard" /></template>
            仪表盘
          </t-menu-item>
          <t-menu-item value="users">
            <template #icon><t-icon name="user" /></template>
            用户管理
          </t-menu-item>
          <t-menu-item value="settings">
            <template #icon><t-icon name="setting" /></template>
            系统设置
          </t-menu-item>
          <t-menu-item value="logs">
            <template #icon><t-icon name="chart-line" /></template>
            使用日志
          </t-menu-item>
        </t-menu>
      </t-aside>
      <t-layout>
        <t-header class="admin-header">
          <div class="header-content">
            <h2>后台管理</h2>
            <t-space>
              <span>{{ appStore.user?.username }}</span>
              <t-button @click="handleLogout">退出登录</t-button>
            </t-space>
          </div>
        </t-header>
        <t-content>
          <div class="admin-content">
            <router-view />
          </div>
        </t-content>
      </t-layout>
    </t-layout>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()

const activeMenu = ref('dashboard')

onMounted(() => {
  const path = route.path.split('/').pop()
  activeMenu.value = path || 'dashboard'
})

const handleMenuChange = (value) => {
  router.push(`/admin/${value}`)
}

const handleLogout = () => {
  appStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

.admin-header {
  background: white;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.admin-content {
  padding: 24px;
  min-height: calc(100vh - 64px);
}
</style>

