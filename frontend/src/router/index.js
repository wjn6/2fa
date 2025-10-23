import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '../stores/app'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresUnlock: true }
  },
  {
    path: '/unlock',
    name: 'Unlock',
    component: () => import('../views/Unlock.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/Users.vue')
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('../views/admin/Settings.vue')
      },
      {
        path: 'logs',
        name: 'AdminLogs',
        component: () => import('../views/admin/Logs.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresUnlock: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const appStore = useAppStore()
  
  // 需要解锁的页面
  if (to.meta.requiresUnlock && appStore.isLocked) {
    next('/unlock')
    return
  }
  
  // 需要管理员登录的页面
  if (to.meta.requiresAuth && !appStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // 如果已解锁，不允许访问解锁页
  if (to.name === 'Unlock' && !appStore.isLocked) {
    next('/')
    return
  }
  
  // 如果已登录，不允许访问登录/注册页
  if ((to.name === 'Login' || to.name === 'Register') && appStore.isAuthenticated) {
    next('/admin')
    return
  }
  
  next()
})

export default router
