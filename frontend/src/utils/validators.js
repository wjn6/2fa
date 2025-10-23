/**
 * 统一的表单验证规则
 */

// 用户名验证
export const usernameRules = [
  { required: true, message: '请输入用户名', type: 'error' },
  { min: 3, max: 20, message: '用户名长度为3-20个字符', type: 'warning' },
  { 
    pattern: /^[a-zA-Z0-9_]+$/, 
    message: '用户名只能包含字母、数字和下划线', 
    type: 'warning' 
  }
]

// 密码验证
export const passwordRules = [
  { required: true, message: '请输入密码', type: 'error' },
  { min: 6, message: '密码至少6个字符', type: 'warning' },
  {
    validator: (val) => {
      // 至少包含数字和字母
      return /[0-9]/.test(val) && /[a-zA-Z]/.test(val)
    },
    message: '密码需包含数字和字母',
    type: 'warning'
  }
]

// 邮箱验证
export const emailRules = [
  { required: true, message: '请输入邮箱', type: 'error' },
  { 
    type: 'email', 
    message: '请输入有效的邮箱地址', 
    type: 'warning' 
  }
]

// 必填验证
export const requiredRule = (message = '此字段为必填项') => [
  { required: true, message, type: 'error' }
]

// 长度验证
export const lengthRule = (min, max, message) => [
  { min, max, message: message || `长度应在${min}-${max}个字符之间`, type: 'warning' }
]

// URL 验证
export const urlRules = [
  {
    pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
    message: '请输入有效的URL',
    type: 'warning'
  }
]

// 手机号验证
export const phoneRules = [
  {
    pattern: /^1[3-9]\d{9}$/,
    message: '请输入有效的手机号',
    type: 'warning'
  }
]

// 密码强度检查
export function checkPasswordStrength(password) {
  if (!password) return { strength: 0, label: '无' }
  
  let strength = 0
  if (password.length >= 6) strength++
  if (password.length >= 10) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++
  
  const labels = ['弱', '中等', '强', '很强', '极强']
  return {
    strength,
    label: labels[Math.min(strength - 1, labels.length - 1)] || '弱',
    percentage: (strength / 5) * 100
  }
}

// XSS 防护 - HTML 转义
export function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// 输入净化
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  // 移除潜在的危险字符
  return input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
}

// 验证 API Key 格式
export function validateApiKey(key) {
  return /^sk_[a-f0-9]{64}$/.test(key)
}

// 验证 TOTP Secret
export function validateTotpSecret(secret) {
  return /^[A-Z2-7]{16,}$/.test(secret)
}

export default {
  usernameRules,
  passwordRules,
  emailRules,
  requiredRule,
  lengthRule,
  urlRules,
  phoneRules,
  checkPasswordStrength,
  escapeHtml,
  sanitizeInput,
  validateApiKey,
  validateTotpSecret
}

