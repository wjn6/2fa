/**
 * 统一的错误处理工具
 */

import { MessagePlugin } from 'tdesign-vue-next'

// 错误类型映射
const ERROR_MESSAGES = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '拒绝访问',
  404: '请求的资源不存在',
  408: '请求超时',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务暂时不可用',
  504: '网关超时'
}

// 处理API错误
export function handleApiError(error, customMessage) {
  console.error('API Error:', error)
  
  if (!error.response) {
    // 网络错误
    MessagePlugin.error(customMessage || '网络连接失败，请检查网络设置')
    return
  }
  
  const { status, data } = error.response
  
  // 使用服务器返回的错误消息，或使用预定义消息
  const message = data?.message || ERROR_MESSAGES[status] || customMessage || '操作失败，请重试'
  
  MessagePlugin.error(message)
  
  // 特殊处理
  if (status === 401) {
    // Token 过期，跳转到登录页
    setTimeout(() => {
      window.location.href = '/login'
    }, 1500)
  }
  
  return message
}

// 处理表单验证错误
export function handleValidationError(errors, formRef) {
  if (!errors || errors.length === 0) return
  
  const firstError = errors[0]
  MessagePlugin.warning(firstError.message || '请检查表单输入')
  
  // 聚焦到第一个错误字段
  if (formRef?.value) {
    setTimeout(() => {
      const errorField = formRef.value.$el.querySelector('.t-is-error')
      if (errorField) {
        errorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }
}

// 处理业务逻辑错误
export function handleBusinessError(code, message) {
  const errorMessages = {
    'USER_NOT_FOUND': '用户不存在',
    'WRONG_PASSWORD': '密码错误',
    'USER_DISABLED': '账号已被禁用',
    'PERMISSION_DENIED': '权限不足',
    'RESOURCE_NOT_FOUND': '资源不存在',
    'DUPLICATE_ENTRY': '数据已存在',
    'INVALID_TOKEN': 'Token无效或已过期'
  }
  
  MessagePlugin.error(errorMessages[code] || message || '操作失败')
}

// 安全的异步函数包装器
export function safeAsync(fn, errorMessage) {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      handleApiError(error, errorMessage)
      throw error
    }
  }
}

// 带重试的异步函数
export async function retryAsync(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// 全局错误处理器
export function setupGlobalErrorHandler() {
  // 处理 Vue 错误
  window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error)
    MessagePlugin.error('发生了一个错误，请刷新页面重试')
  })
  
  // 处理 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason)
    MessagePlugin.error('操作失败，请重试')
  })
}

export default {
  handleApiError,
  handleValidationError,
  handleBusinessError,
  safeAsync,
  retryAsync,
  setupGlobalErrorHandler
}


