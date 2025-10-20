import { onMounted, onUnmounted } from 'vue'

export function useKeyboard(handlers) {
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + K: 搜索
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      handlers.onSearch?.()
    }
    
    // Ctrl/Cmd + N: 新建
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault()
      handlers.onNew?.()
    }
    
    // Ctrl/Cmd + S: 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handlers.onSave?.()
    }
    
    // Ctrl/Cmd + L: 锁定
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
      e.preventDefault()
      handlers.onLock?.()
    }
    
    // Escape: 关闭/取消
    if (e.key === 'Escape') {
      handlers.onEscape?.()
    }
    
    // 数字键 1-9: 快速复制
    if (/^[1-9]$/.test(e.key) && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      const index = parseInt(e.key) - 1
      handlers.onQuickCopy?.(index)
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
}


