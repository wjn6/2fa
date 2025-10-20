import axios from 'axios'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAppStore } from '../stores/app'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const appStore = useAppStore()
    
    // 添加session token
    if (appStore.sessionToken) {
      config.headers['x-session-token'] = appStore.sessionToken
    }
    
    // 添加auth token
    if (appStore.authToken) {
      config.headers['Authorization'] = `Bearer ${appStore.authToken}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const appStore = useAppStore()
    const config = error.config
    
    // P1 优化：网络错误自动重试
    if (!error.response && config && !config._retry) {
      config._retry = (config._retry || 0) + 1
      
      // 最多重试3次
      if (config._retry <= 3) {
        MessagePlugin.warning(`网络错误，正在重试（${config._retry}/3）...`)
        
        // 等待 1 秒后重试
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        return api(config)
      }
    }
    
    if (error.response) {
      // 需要解锁
      if (error.response.status === 423) {
        appStore.lock()
        MessagePlugin.warning('需要解锁才能继续操作')
      }
      // 未授权
      else if (error.response.status === 401) {
        appStore.logout()
        MessagePlugin.error('登录已过期')
      }
      // 其他错误
      else if (error.response.data?.message) {
        MessagePlugin.error(error.response.data.message)
      }
    } else if (error.request) {
      // 重试3次后仍然失败
      MessagePlugin.error('网络错误，请检查连接')
    } else {
      MessagePlugin.error('请求失败')
    }
    
    return Promise.reject(error)
  }
)

// 认证相关 API
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  checkMasterPassword: () => api.get('/auth/check-master-password'),
  setMasterPassword: (data) => api.post('/auth/set-master-password', data),
  unlock: (data) => api.post('/auth/unlock', data),
  lock: () => api.post('/auth/lock'),
  getPasswordHint: () => api.get('/auth/password-hint'),
  changeMasterPassword: (data) => api.post('/auth/change-master-password', data)
}

// 分类相关 API
export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
}

// 标签相关 API
export const tagApi = {
  getAll: () => api.get('/tags'),
  create: (data) => api.post('/tags', data),
  update: (id, data) => api.put(`/tags/${id}`, data),
  delete: (id) => api.delete(`/tags/${id}`),
  getSecrets: (id) => api.get(`/tags/${id}/secrets`)
}

// 密钥相关 API
export const secretApi = {
  getAll: (params) => api.get('/secrets', { params }),
  getDetail: (id) => api.get(`/secrets/${id}`),
  create: (data) => api.post('/secrets', data),
  update: (id, data) => api.put(`/secrets/${id}`, data),
  delete: (id) => api.delete(`/secrets/${id}`),
  batchDelete: (ids) => api.post('/secrets/batch-delete', { ids }),
  batchUpdateCategory: (ids, category_id) => api.post('/secrets/batch-update-category', { ids, category_id }),
  updateSort: (sortData) => api.post('/secrets/update-sort', { sortData }),
  toggleFavorite: (id) => api.post(`/secrets/${id}/toggle-favorite`),
  togglePin: (id) => api.post(`/secrets/${id}/toggle-pin`),
  getToken: (id) => api.get(`/secrets/${id}/token`),
  getAllTokens: () => api.get('/tokens')
}

// 二维码相关 API
export const qrcodeApi = {
  upload: (data) => api.post('/qrcode/upload', data),
  generate: (data) => api.post('/qrcode/generate', data),
  parseUrl: (data) => api.post('/qrcode/parse-url', data)
}

// 备份相关 API
export const backupApi = {
  export: () => api.get('/backup/export'),
  exportEncrypted: (password) => api.post('/backup/export-encrypted', { password }),
  import: (data) => api.post('/backup/import', data),
  history: () => api.get('/backup/history'),
  autoBackup: () => api.post('/backup/auto'),
  importGoogle: (data) => api.post('/backup/import-google', { data })
}

// 管理员相关 API
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings) => api.put('/admin/settings', { settings }),
  getStatistics: () => api.get('/admin/statistics'),
  getUsageLogs: (params) => api.get('/admin/usage-logs', { params }),
  cleanupSessions: () => api.post('/admin/cleanup-sessions'),
  cleanupLogs: (days) => api.post('/admin/cleanup-logs', { days }),
  optimizeDatabase: () => api.post('/admin/optimize-database')
}

export default api
