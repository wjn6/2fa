<template>
  <div class="admin-layout">
    <t-layout>
      <!-- 桌面端侧边栏 -->
      <t-aside width="220px" class="admin-aside desktop-only">
        <div class="aside-header">
          <div class="brand-logo">
            <t-icon name="secured" size="24px" />
            <span>2FA Admin</span>
          </div>
        </div>
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
        <!-- 头部 -->
        <t-header class="admin-header">
          <div class="header-content">
            <div class="header-left">
              <t-icon name="menu-fold" size="20px" class="mobile-menu-icon mobile-only" @click="showMobileMenu = true" />
              <h2>后台管理</h2>
            </div>
            <t-space class="header-right">
              <span class="username">{{ appStore.user?.username }}</span>
              <t-button size="small" @click="handleBack" class="mobile-only">返回</t-button>
              <t-button size="small" @click="handleLogout">退出</t-button>
            </t-space>
          </div>
        </t-header>
        
        <!-- 移动端底部导航 -->
        <div class="mobile-nav mobile-only">
          <div 
            v-for="item in menuItems" 
            :key="item.value"
            class="mobile-nav-item"
            :class="{ 'active': activeMenu === item.value }"
            @click="handleMenuChange(item.value)"
          >
            <t-icon :name="item.icon" size="20px" />
            <span>{{ item.label }}</span>
          </div>
        </div>
        
        <!-- 内容区 -->
        <t-content>
          <div class="admin-content">
            <router-view />
          </div>
        </t-content>
      </t-layout>
    </t-layout>
    
    <!-- 移动端抽屉菜单 -->
    <t-drawer
      v-model:visible="showMobileMenu"
      placement="left"
      :size="'280px'"
      :show-overlay="true"
    >
      <template #header>
        <div class="drawer-header">
          <t-icon name="secured" size="24px" />
          <span>2FA Admin</span>
        </div>
      </template>
      <t-menu v-model="activeMenu" @change="handleMobileMenuChange">
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
    </t-drawer>
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
const showMobileMenu = ref(false)

const menuItems = [
  { value: 'dashboard', label: '仪表盘', icon: 'dashboard' },
  { value: 'users', label: '用户', icon: 'user' },
  { value: 'settings', label: '设置', icon: 'setting' },
  { value: 'logs', label: '日志', icon: 'chart-line' }
]

onMounted(() => {
  const path = route.path.split('/').pop()
  activeMenu.value = path || 'dashboard'
})

const handleMenuChange = (value) => {
  router.push(`/admin/${value}`)
}

const handleMobileMenuChange = (value) => {
  handleMenuChange(value)
  showMobileMenu.value = false
}

const handleBack = () => {
  router.push('/')
}

const handleLogout = () => {
  appStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏 */
.admin-aside {
  background: #1a1a1a !important;
}

.aside-header {
  padding: 20px 16px;
  border-bottom: 1px solid #3a3a3a;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

/* 头部 */
.admin-header {
  background: white;
  padding: 0 24px;
  border-bottom: 1px solid #e7e7e7;
  height: 56px !important;
}

[theme-mode="dark"] .admin-header {
  background: #2a2a2a;
  border-bottom-color: #3a3a3a;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-menu-icon {
  cursor: pointer;
  color: #666;
}

.mobile-menu-icon:hover {
  color: #0052d9;
}

.header-content h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

[theme-mode="dark"] .header-content h2 {
  color: #e5e5e5;
}

.username {
  font-size: 14px;
  color: #666;
}

[theme-mode="dark"] .username {
  color: #999;
}

/* 内容区 */
.admin-content {
  padding: 24px;
  min-height: calc(100vh - 56px);
  background: #f5f5f5;
  overflow-y: auto;
}

[theme-mode="dark"] .admin-content {
  background: #1a1a1a;
}

/* 抽屉头部 */
.drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

[theme-mode="dark"] .drawer-header {
  color: #e5e5e5;
}

/* 移动端底部导航 */
.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e7e7e7;
  padding: 8px 0;
  z-index: 1000;
  flex-direction: row;
  justify-content: space-around;
}

[theme-mode="dark"] .mobile-nav {
  background: #2a2a2a;
  border-top-color: #3a3a3a;
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  cursor: pointer;
  color: #666;
  font-size: 12px;
  transition: color 0.2s;
  flex: 1;
  text-align: center;
}

.mobile-nav-item:hover {
  color: #0052d9;
}

.mobile-nav-item.active {
  color: #0052d9;
  font-weight: 500;
}

[theme-mode="dark"] .mobile-nav-item {
  color: #999;
}

[theme-mode="dark"] .mobile-nav-item:hover,
[theme-mode="dark"] .mobile-nav-item.active {
  color: #4dabf7;
}

/* 响应式控制 */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }

  .mobile-only {
    display: block;
  }

  .mobile-nav {
    display: flex;
  }

  .admin-header {
    padding: 0 16px;
    height: 52px !important;
  }

  .header-content h2 {
    font-size: 16px;
  }

  .header-right {
    gap: 8px;
  }

  .username {
    display: none;
  }

  .admin-content {
    padding: 16px 12px;
    min-height: calc(100vh - 52px - 56px); /* 减去头部和底部导航 */
    padding-bottom: 70px; /* 为底部导航留空间 */
  }
}

/* 超小屏幕优化 */
@media (max-width: 375px) {
  .admin-content {
    padding: 12px 10px;
  }

  .mobile-nav-item {
    padding: 6px 8px;
    font-size: 11px;
  }
}
</style>

