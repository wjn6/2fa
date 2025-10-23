/**
 * 通用工具函数
 */

// 防抖函数
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 节流函数
export function throttle(fn, delay = 300) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

// 复制到剪贴板
export async function copyToClipboard(text, successMessage = '已复制') {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
    }
    
    // 如果传入 MessagePlugin，显示成功提示
    if (successMessage && typeof window !== 'undefined' && window.TDesign) {
      const { MessagePlugin } = await import('tdesign-vue-next')
      MessagePlugin.success(successMessage)
    }
    
    return true
  } catch (error) {
    console.error('复制失败:', error)
    if (typeof window !== 'undefined' && window.TDesign) {
      const { MessagePlugin } = await import('tdesign-vue-next')
      MessagePlugin.error('复制失败')
    }
    return false
  }
}

// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

// 相对时间格式化
export function formatRelativeTime(date) {
  if (!date) return ''
  
  const now = Date.now()
  const time = new Date(date).getTime()
  const diff = now - time
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < week) return `${Math.floor(diff / day)} 天前`
  if (diff < month) return `${Math.floor(diff / week)} 周前`
  
  return formatDate(date, 'YYYY-MM-DD')
}

// 文件大小格式化
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

// 生成随机 ID
export function generateId(prefix = '') {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// 深度克隆
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (obj instanceof Object) {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// 下载文件
export function downloadFile(content, filename, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// 读取文件内容
export function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// 检测是否为移动设备
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 检测是否为触摸设备
export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// 高亮搜索关键词
export function highlightKeyword(text, keyword) {
  if (!keyword || !text) return text
  
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// 过滤数组（支持多字段搜索）
export function filterByKeyword(list, keyword, fields = ['name']) {
  if (!keyword) return list
  
  const lowerKeyword = keyword.toLowerCase()
  return list.filter(item => {
    return fields.some(field => {
      const value = item[field]
      return value && String(value).toLowerCase().includes(lowerKeyword)
    })
  })
}

// 排序函数
export function sortBy(list, field, order = 'asc') {
  return [...list].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]
    
    if (aVal === bVal) return 0
    
    const result = aVal > bVal ? 1 : -1
    return order === 'asc' ? result : -result
  })
}

// 分组函数
export function groupBy(list, field) {
  return list.reduce((groups, item) => {
    const key = item[field]
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
    return groups
  }, {})
}

// 去重函数
export function uniqueBy(list, field) {
  const seen = new Set()
  return list.filter(item => {
    const key = item[field]
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

// 睡眠函数
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 重试函数
export async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await sleep(delay)
    }
  }
}

// 颜色转换（hex to rgb）
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

// 颜色转换（rgb to hex）
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

// 生成随机颜色
export function randomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

// 本地存储封装
export const storage = {
  get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : defaultValue
    } catch {
      return defaultValue
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
  
  clear() {
    try {
      localStorage.clear()
      return true
    } catch {
      return false
    }
  }
}

export default {
  debounce,
  throttle,
  copyToClipboard,
  formatDate,
  formatRelativeTime,
  formatFileSize,
  generateId,
  deepClone,
  downloadFile,
  readFile,
  isMobileDevice,
  isTouchDevice,
  highlightKeyword,
  filterByKeyword,
  sortBy,
  groupBy,
  uniqueBy,
  sleep,
  retry,
  hexToRgb,
  rgbToHex,
  randomColor,
  storage
}

