<template>
  <div class="home">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-container">
        <div class="header-left">
          <div class="brand-logo">
            <div class="logo-icon">
              <t-icon name="secured" size="22px" />
            </div>
            <div class="brand-info">
              <span class="brand-name">2FA Authenticator</span>
            </div>
          </div>
        </div>
        <div class="header-center">
          <t-input 
            v-model="searchKeyword" 
            placeholder="搜索密钥、发行商..."
            class="search-input"
            clearable
          >
            <template #prefix-icon><t-icon name="search" /></template>
          </t-input>
        </div>
        <div class="header-right">
          <t-button 
            v-if="!batchMode" 
            theme="primary" 
            @click="showAddDialog"
          >
            <template #icon><t-icon name="add" /></template>
            <span class="btn-text">新建</span>
          </t-button>
          <t-button 
            v-if="!batchMode && filteredSecrets.length > 0"
            variant="outline" 
            @click="enterBatchMode"
          >
            <template #icon><t-icon name="check-circle" /></template>
            <span class="btn-text">批量</span>
          </t-button>
          <t-button 
            v-if="batchMode"
            theme="danger"
            @click="exitBatchMode"
          >
            退出批量
          </t-button>
          <t-dropdown v-if="!batchMode" :options="menuOptions" @click="handleMenu">
            <t-button variant="outline" shape="circle">
              <t-icon name="ellipsis" />
            </t-button>
          </t-dropdown>
          <t-button v-if="!batchMode" variant="outline" shape="circle" @click="handleLock">
            <t-icon name="lock-on" />
          </t-button>
        </div>
      </div>
    </div>

    <!-- 批量操作工具栏 -->
    <div v-if="batchMode && filteredSecrets.length > 0" class="batch-toolbar">
      <div class="batch-toolbar-left">
        <t-checkbox 
          v-model="selectAll" 
          @change="handleSelectAll"
        >
          全选
        </t-checkbox>
        <span class="selected-count">已选择 {{ selectedIds.length }} 项</span>
      </div>
      <div class="batch-toolbar-right">
        <t-button 
          theme="primary" 
          variant="outline"
          :disabled="selectedIds.length === 0"
          @click="batchExport"
        >
          <template #icon><t-icon name="download" /></template>
          导出选中
        </t-button>
        <t-button 
          theme="danger"
          :disabled="selectedIds.length === 0"
          @click="batchDelete"
        >
          <template #icon><t-icon name="delete" /></template>
          删除选中
        </t-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- P1 优化：收藏快速访问栏 -->
      <div v-if="!loading && favoriteSecrets.length > 0" class="favorites-bar">
        <div class="favorites-header">
          <t-icon name="star-filled" style="color: #faad14; margin-right: 8px;" />
          <span class="favorites-title">常用密钥</span>
        </div>
        <div class="favorites-list">
          <div 
            v-for="secret in favoriteSecrets" 
            :key="secret.id"
            class="favorite-item"
            @click="copyToken(secret.id)"
            :title="`点击复制 ${secret.name} 的验证码`"
          >
            <div class="favorite-icon" :style="{ backgroundColor: getServiceColor(secret) }">
              {{ getServiceEmoji(secret) }}
            </div>
            <div class="favorite-info">
              <div class="favorite-name">{{ secret.name }}</div>
              <div class="favorite-token">{{ formatToken(getToken(secret.id)) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && filteredSecrets.length === 0" class="empty-state">
        <div class="empty-icon">
          <t-icon name="secured" size="80px" />
        </div>
        <h3 class="empty-title">{{ searchKeyword ? '没有找到匹配的密钥' : '开始使用 2FA 笔记本' }}</h3>
        <p class="empty-desc">{{ searchKeyword ? '试试其他搜索关键词' : '添加您的第一个两步验证密钥，保护账户安全' }}</p>
        <t-space v-if="!searchKeyword" direction="vertical" size="large">
          <t-button theme="primary" size="large" @click="showAddDialog">
            <template #icon><t-icon name="add" /></template>
            添加密钥
          </t-button>
          <t-button variant="text" size="large" @click="handleMenu({ value: 'import' })">
            或导入现有数据
          </t-button>
        </t-space>
      </div>

      <!-- 加载状态 -->
      <t-loading v-else-if="loading" size="large" text="加载中..." />

      <!-- 桌面端表格 -->
      <div v-else class="table-container desktop-view">
        <table class="secret-table">
          <thead>
            <tr>
              <th v-if="batchMode" class="checkbox-col"></th>
              <th class="icon-col"></th>
              <th class="name-col">服务/名称</th>
              <th class="issuer-col">发行者</th>
              <th class="note-col">备注</th>
              <th class="key-col">密钥</th>
              <th class="code-col">验证码</th>
              <th class="timer-col">剩余时间</th>
              <th class="action-col">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="secret in filteredSecrets" 
              :key="secret.id" 
              class="secret-row"
              :class="{ 'selected-row': selectedIds.includes(secret.id) }"
            >
              <td v-if="batchMode" class="checkbox-cell">
                <t-checkbox 
                  :checked="selectedIds.includes(secret.id)"
                  @change="toggleSelect(secret.id)"
                />
              </td>
              <td class="icon-cell">
                <div class="service-icon" :style="{ backgroundColor: getServiceColor(secret) }">
                  {{ getServiceEmoji(secret) }}
                </div>
              </td>
              <td class="name-cell">
                <div class="name-wrapper">
                  <span class="secret-name">{{ secret.name }}</span>
                  <t-icon v-if="secret.is_favorite" name="star-filled" style="color: #faad14; margin-left: 8px;" />
                </div>
              </td>
              <td class="issuer-cell">
                <span class="issuer">{{ secret.issuer || '-' }}</span>
              </td>
              <td class="note-cell">
                <span 
                  class="note-text" 
                  :title="secret.note"
                >
                  {{ secret.note || '-' }}
                </span>
              </td>
              <td class="secret-key-cell">
                <div class="secret-key-wrapper">
                  <span class="secret-key-text">
                    {{ visibleSecretIds.includes(secret.id) ? secret.secret_key : '••••••••••••••••' }}
                  </span>
                  <div class="secret-key-actions">
                    <t-button 
                      size="small" 
                      variant="text" 
                      @click="toggleSecretKeyVisibility(secret.id)"
                      :title="visibleSecretIds.includes(secret.id) ? '隐藏密钥' : '显示密钥'"
                    >
                      <t-icon :name="visibleSecretIds.includes(secret.id) ? 'browse-off' : 'browse'" />
                    </t-button>
                    <t-button 
                      size="small" 
                      variant="text" 
                      @click="copySecretKey(secret.secret_key)"
                      title="复制密钥"
                    >
                      <t-icon name="file-copy" />
                    </t-button>
                  </div>
                </div>
              </td>
              <td class="code-cell">
                <div 
                  class="code-display" 
                  :class="{ 
                    'code-expiring': tokenRemaining <= 5,
                    'copied-animation': recentlyCopied === secret.id 
                  }"
                  @click="copyToken(secret.id)" 
                  :title="tokenRemaining <= 5 ? '验证码即将过期！' : '点击复制验证码'"
                >
                  {{ formatToken(getToken(secret.id)) }}
                </div>
              </td>
              <td class="timer-cell">
                <div class="timer-wrapper">
                  <t-progress 
                    :percentage="tokenProgress" 
                    :stroke-width="6"
                    :theme="tokenProgress > 30 ? 'success' : 'warning'"
                    :show-label="false"
                    style="width: 100px; margin-right: 8px;"
                  />
                  <span class="timer-text">{{ tokenRemaining }}s</span>
                </div>
              </td>
              <td class="action-cell">
                <t-space v-if="!batchMode" size="small">
                  <t-button size="small" theme="primary" variant="outline" @click="copyToken(secret.id)">
                    <t-icon name="file-copy" />
                  </t-button>
                  <t-dropdown :options="getSecretMenu(secret)" @click="(e) => handleSecretMenu(e, secret)">
                    <t-button size="small" variant="outline">
                      <t-icon name="more" />
                    </t-button>
                  </t-dropdown>
                </t-space>
                <span v-else style="color: #999;">批量模式</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 移动端列表 -->
      <div v-if="!loading && filteredSecrets.length > 0" class="mobile-view">
        <div 
          v-for="secret in filteredSecrets" 
          :key="secret.id" 
          class="mobile-card"
          :class="{ 'selected-card': selectedIds.includes(secret.id) }"
        >
          <div class="mobile-card-header">
            <t-checkbox 
              v-if="batchMode"
              :checked="selectedIds.includes(secret.id)"
              @change="toggleSelect(secret.id)"
              style="margin-right: 12px;"
            />
            <div class="mobile-card-title">
              <div class="service-icon-mobile" :style="{ backgroundColor: getServiceColor(secret) }">
                {{ getServiceEmoji(secret) }}
              </div>
              <div>
                <div class="mobile-name">
                  {{ secret.name }}
                  <t-icon v-if="secret.is_favorite" name="star-filled" style="color: #faad14; margin-left: 4px;" size="14px" />
                </div>
                <div class="mobile-issuer">{{ secret.issuer || '未设置发行者' }}</div>
              </div>
            </div>
            <t-dropdown :options="getSecretMenu(secret)" @click="(e) => handleSecretMenu(e, secret)">
              <t-button size="small" variant="text">
                <t-icon name="more" size="20px" />
              </t-button>
            </t-dropdown>
          </div>
          
          <div v-if="secret.note" class="mobile-card-note">
            <t-icon name="chat" size="14px" style="color: #999; margin-right: 4px;" />
            <span class="mobile-note-text">{{ secret.note }}</span>
          </div>
          
          <div class="mobile-card-secret">
            <div class="mobile-secret-label">密钥</div>
            <div class="mobile-secret-value">
              <span class="mobile-secret-text">
                {{ visibleSecretIds.includes(secret.id) ? secret.secret_key : '••••••••••••••••' }}
              </span>
              <div class="mobile-secret-actions">
                <t-button 
                  size="small" 
                  variant="text" 
                  @click="toggleSecretKeyVisibility(secret.id)"
                >
                  <t-icon :name="visibleSecretIds.includes(secret.id) ? 'browse-off' : 'browse'" />
                </t-button>
                <t-button 
                  size="small" 
                  variant="text" 
                  @click="copySecretKey(secret.secret_key)"
                >
                  <t-icon name="file-copy" />
                </t-button>
              </div>
            </div>
          </div>

          <div class="mobile-card-code">
            <div class="mobile-code-display">{{ formatToken(getToken(secret.id)) }}</div>
            <t-button theme="primary" size="large" block @click="copyToken(secret.id)">
              <template #icon><t-icon name="file-copy" /></template>
              复制验证码
            </t-button>
          </div>

          <div class="mobile-card-timer">
            <t-progress 
              :percentage="tokenProgress" 
              :stroke-width="4"
              :theme="tokenProgress > 30 ? 'success' : 'warning'"
              :show-label="false"
            />
            <span class="mobile-timer-text">{{ tokenRemaining }} 秒后刷新</span>
          </div>
        </div>
      </div>

      <!-- 底部统计 -->
      <div v-if="!loading && filteredSecrets.length > 0" class="footer-stats">
        <div class="stat-item">
          <t-icon name="key" size="16px" />
          <span>总计 {{ secrets.length }} 个密钥</span>
        </div>
        <div v-if="searchKeyword" class="stat-item">
          <t-icon name="search" size="16px" />
          <span>筛选 {{ filteredSecrets.length }} 个</span>
        </div>
        <div class="stat-item">
          <t-icon name="refresh" size="16px" />
          <span>{{ tokenRemaining }}秒后刷新</span>
        </div>
      </div>
    </div>

    <!-- 添加/编辑密钥对话框 -->
    <t-dialog
      v-model:visible="secretDialogVisible"
      :header="secretDialogTitle"
      :width="isMobile ? '90%' : '600px'"
      @confirm="handleSecretSubmit"
    >
      <t-form :data="secretForm" label-width="80px">
        <t-form-item label="名称" required>
          <t-input v-model="secretForm.name" placeholder="例如：GitHub" />
        </t-form-item>
        <t-form-item label="密钥" required>
          <t-input v-model="secretForm.secret_key" placeholder="Base32 格式密钥" />
          <template #tips>
            <t-space direction="vertical" size="4px">
              <span>从服务商获取的密钥字符串</span>
              <t-button size="small" theme="primary" variant="text" @click="showQRUpload">
                或者上传二维码图片
              </t-button>
            </t-space>
          </template>
        </t-form-item>
        <t-form-item label="发行者">
          <t-input v-model="secretForm.issuer" placeholder="例如：github.com" />
        </t-form-item>
        <t-form-item label="备注">
          <t-textarea v-model="secretForm.note" placeholder="添加备注信息（可选）" :autosize="{ minRows: 2, maxRows: 4 }" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 导入数据对话框 -->
    <t-dialog
      v-model:visible="importDialogVisible"
      header="导入数据"
      :width="isMobile ? '90%' : '500px'"
      @confirm="handleImport"
    >
      <t-form>
        <t-form-item label="导入模式">
          <t-radio-group v-model="importMode">
            <t-radio value="merge">合并到现有数据</t-radio>
            <t-radio value="replace">替换现有数据</t-radio>
          </t-radio-group>
        </t-form-item>
        <t-form-item label="选择文件">
          <input type="file" accept=".json" @change="handleImportFileSelect" ref="fileInputRef" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 二维码上传对话框 -->
    <t-dialog
      v-model:visible="qrUploadDialogVisible"
      header="扫描二维码"
      :width="isMobile ? '90%' : '500px'"
      :footer="false"
      @close="closeQRUpload"
    >
      <div style="text-align: center;">
        <div v-if="qrImageData" style="margin-bottom: 16px;">
          <img :src="qrImageData" style="max-width: 100%; max-height: 300px; border-radius: 8px;" />
        </div>
        
        <!-- 拖拽上传区域 -->
        <div 
          class="qr-upload-zone"
          :class="{ 'dragging': isDragging }"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @click="triggerFileInput"
        >
          <t-icon name="cloud-upload" size="48px" style="color: #0052d9; margin-bottom: 16px;" />
          <div class="upload-text-primary">
            点击选择 / 拖拽图片 / Ctrl+V 粘贴
          </div>
          <div class="upload-text-secondary">
            支持 JPG、PNG 格式的二维码图片
          </div>
          <input 
            ref="qrFileInput"
            type="file" 
            accept="image/*" 
            style="display: none;"
            @change="handleQRFileSelect"
          />
        </div>
        
        <div style="margin-top: 16px; color: #999; font-size: 13px; text-align: left;">
          <p><strong>使用方法：</strong></p>
          <p>• 点击上方区域选择图片</p>
          <p>• 拖拽图片到上方区域</p>
          <p>• 复制图片后按 Ctrl+V 粘贴</p>
          <p>• 系统将自动解析二维码并填充密钥</p>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAppStore } from '../stores/app'
import { secretApi, backupApi, qrcodeApi } from '../api'
import { useKeyboard } from '../composables/useKeyboard'

const router = useRouter()
const appStore = useAppStore()

// 响应式检测
const isMobile = ref(window.innerWidth <= 768)
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

const loading = ref(false)
const secrets = ref([])
const tokens = ref({})
const tokenRemaining = ref(30)
const searchKeyword = ref('')

// 批量操作相关
const selectedIds = ref([])
const batchMode = ref(false)

// 密钥显示相关 - 使用数组而不是 Set，确保响应式
const visibleSecretIds = ref([])

// P1 优化：复制成功反馈
const recentlyCopied = ref(null)

// P1 优化：收藏密钥快速访问
const favoriteSecrets = computed(() => 
  secrets.value.filter(s => s.is_favorite).slice(0, 5)
)

const secretDialogVisible = ref(false)
const secretDialogTitle = ref('添加密钥')
const secretForm = ref({ name: '', secret_key: '', issuer: '', note: '' })

const importDialogVisible = ref(false)
const importMode = ref('merge')
const fileInputRef = ref(null)

const menuOptions = [
  { content: '导出数据', value: 'export' },
  { content: '导入数据', value: 'import' },
  { content: '设置', value: 'settings' }
]

const getSecretMenu = (secret) => [
  { content: '编辑', value: 'edit' },
  { content: secret.is_favorite ? '取消收藏' : '收藏', value: 'favorite' },
  { content: '删除', value: 'delete', theme: 'danger' }
]

// 批量操作相关计算属性
const selectAll = computed({
  get: () => selectedIds.value.length === filteredSecrets.value.length && filteredSecrets.value.length > 0,
  set: (val) => {
    if (val) {
      selectedIds.value = filteredSecrets.value.map(s => s.id)
    } else {
      selectedIds.value = []
    }
  }
})

const tokenProgress = computed(() => (tokenRemaining.value / 30) * 100)

const filteredSecrets = computed(() => {
  let result = secrets.value
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(s => 
      s.name.toLowerCase().includes(keyword) ||
      (s.issuer && s.issuer.toLowerCase().includes(keyword)) ||
      (s.note && s.note.toLowerCase().includes(keyword))
    )
  }
  
  // 收藏的排在前面
  return result.sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1
    if (!a.is_favorite && b.is_favorite) return 1
    return 0
  })
})

// 服务图标映射
const serviceEmojis = {
  github: '🔵',
  google: '🔴',
  microsoft: '🟢',
  apple: '⚫',
  facebook: '🔵',
  twitter: '🔵',
  amazon: '🟠',
  aws: '🟠',
  azure: '🔵',
  steam: '⚫',
  discord: '🟣',
  telegram: '🔵',
  dropbox: '🔵',
  gitlab: '🟠',
  default: '🔐'
}

const serviceColors = {
  github: '#181717',
  google: '#4285F4',
  microsoft: '#00A4EF',
  apple: '#000000',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  amazon: '#FF9900',
  aws: '#FF9900',
  azure: '#0078D4',
  steam: '#171A21',
  discord: '#5865F2',
  telegram: '#26A5E4',
  dropbox: '#0061FF',
  gitlab: '#FC6D26',
  default: '#1890ff'
}

const getServiceEmoji = (secret) => {
  const searchText = (secret.name + ' ' + (secret.issuer || '')).toLowerCase()
  for (const [key, emoji] of Object.entries(serviceEmojis)) {
    if (searchText.includes(key)) return emoji
  }
  return serviceEmojis.default
}

const getServiceColor = (secret) => {
  const searchText = (secret.name + ' ' + (secret.issuer || '')).toLowerCase()
  for (const [key, color] of Object.entries(serviceColors)) {
    if (searchText.includes(key)) return color
  }
  return serviceColors.default
}

const loadSecrets = async () => {
  loading.value = true
  try {
    const res = await secretApi.getAll()
    
    // P1 优化：数据格式验证
    if (!Array.isArray(res.data.data)) {
      throw new Error('数据格式错误')
    }
    
    // 验证每个密钥的必需字段
    const validSecrets = res.data.data.filter(secret => {
      if (!secret.id || !secret.name || !secret.secret_key) {
        console.warn('发现无效密钥:', secret)
        return false
      }
      return true
    })
    
    if (validSecrets.length < res.data.data.length) {
      MessagePlugin.warning(`发现 ${res.data.data.length - validSecrets.length} 个无效密钥已被过滤`)
    }
    
    secrets.value = validSecrets
  } catch (error) {
    MessagePlugin.error('加载失败：' + error.message)
  } finally {
    loading.value = false
  }
}

const loadTokens = async () => {
  try {
    const res = await secretApi.getAllTokens()
    const newTokens = {}
    res.data.data.forEach(item => {
      newTokens[item.id] = item.token
    })
    tokens.value = newTokens
    tokenRemaining.value = res.data.data[0]?.remaining || 30
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('加载验证码失败:', error)
    }
    // 静默失败，避免干扰用户体验
  }
}

const getToken = (id) => tokens.value[id] || '------'

const formatToken = (token) => {
  if (token === '------') return token
  return token.slice(0, 3) + ' ' + token.slice(3)
}

const copyToken = async (id) => {
  const token = tokens.value[id]
  if (token && token !== '------') {
    try {
      // 优先使用 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(token)
        MessagePlugin.success('验证码已复制（30秒后自动清除）')
      } else {
        // 回退方案：使用 textarea
        const textarea = document.createElement('textarea')
        textarea.value = token
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        try {
          const successful = document.execCommand('copy')
          if (successful) {
            MessagePlugin.success('验证码已复制（30秒后自动清除）')
          } else {
            throw new Error('复制命令执行失败')
          }
        } finally {
          document.body.removeChild(textarea)
        }
      }
      
      // P1 优化：复制成功视觉反馈
      recentlyCopied.value = id
      setTimeout(() => {
        recentlyCopied.value = null
      }, 1000)
      
      // P1 优化：30秒后自动清空剪贴板
      setTimeout(async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const currentClip = await navigator.clipboard.readText()
            if (currentClip === token) {
              await navigator.clipboard.writeText('')
            }
          }
        } catch (e) {
          // 某些浏览器不允许读取剪贴板，忽略错误
        }
      }, 30000)
      
    } catch (error) {
      MessagePlugin.error('复制失败：' + error.message)
    }
  } else {
    MessagePlugin.warning('验证码还未生成，请稍候')
  }
}

const showAddDialog = () => {
  secretDialogTitle.value = '添加密钥'
  secretForm.value = { name: '', secret_key: '', issuer: '', note: '' }
  secretDialogVisible.value = true
}

const qrUploadDialogVisible = ref(false)
const qrImageData = ref('')
const qrFileInput = ref(null)
const isDragging = ref(false)

const showQRUpload = () => {
  qrUploadDialogVisible.value = true
  qrImageData.value = ''
  
  // 监听粘贴事件
  setTimeout(() => {
    document.addEventListener('paste', handlePaste)
  }, 100)
}

// 关闭对话框时移除粘贴监听
const closeQRUpload = () => {
  document.removeEventListener('paste', handlePaste)
}

// 触发文件选择
const triggerFileInput = () => {
  qrFileInput.value?.click()
}

// 处理二维码图片选择
const handleQRFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    processQRImage(file)
  }
}

// 处理拖拽
const handleDragOver = (e) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e) => {
  e.preventDefault()
  isDragging.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processQRImage(file)
  } else {
    MessagePlugin.warning('请拖拽图片文件')
  }
}

// 处理粘贴
const handlePaste = (e) => {
  if (!qrUploadDialogVisible.value) return
  
  const items = e.clipboardData?.items
  if (!items) return
  
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      const file = items[i].getAsFile()
      processQRImage(file)
      e.preventDefault()
      break
    }
  }
}

// 处理二维码图片
const processQRImage = (file) => {
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      qrImageData.value = e.target.result
      MessagePlugin.loading('正在解析二维码...', 0)
      
      // 调用后端解析二维码
      const res = await qrcodeApi.upload({ image: e.target.result })
      
      MessagePlugin.close()
      
      if (res.data.success) {
        const data = res.data.data
        // 自动填充表单
        secretForm.value = {
          name: data.name || '',
          secret_key: data.secret || '',
          issuer: data.issuer || '',
          note: ''
        }
        MessagePlugin.success('二维码解析成功！')
        qrUploadDialogVisible.value = false
        secretDialogVisible.value = true
        closeQRUpload()
      }
    } catch (error) {
      MessagePlugin.close()
      MessagePlugin.error('二维码解析失败：' + (error.response?.data?.message || error.message))
    }
  }
  reader.onerror = () => {
    MessagePlugin.error('图片读取失败，请重试')
  }
  reader.readAsDataURL(file)
}

const handleSecretSubmit = async () => {
  if (!secretForm.value.name || !secretForm.value.secret_key) {
    MessagePlugin.warning('请填写名称和密钥')
    return
  }

  try {
    if (secretForm.value.id) {
      await secretApi.update(secretForm.value.id, secretForm.value)
      MessagePlugin.success('更新成功')
    } else {
      await secretApi.create(secretForm.value)
      MessagePlugin.success('添加成功')
    }
    loadSecrets()
    loadTokens()
    secretDialogVisible.value = false
  } catch (error) {
    MessagePlugin.error(error.response?.data?.message || '操作失败')
  }
}

const handleSecretMenu = async (data, secret) => {
  switch (data.value) {
    case 'edit':
      secretDialogTitle.value = '编辑密钥'
      secretForm.value = { ...secret }
      secretDialogVisible.value = true
      break
    case 'favorite':
      try {
        await secretApi.toggleFavorite(secret.id)
        loadSecrets()
        MessagePlugin.success(secret.is_favorite ? '已取消收藏' : '已收藏')
      } catch (error) {
        MessagePlugin.error('操作失败')
      }
      break
    case 'delete':
      try {
        await secretApi.delete(secret.id)
        MessagePlugin.success('删除成功')
        loadSecrets()
      } catch (error) {
        MessagePlugin.error('删除失败')
      }
      break
  }
}

const handleMenu = async (data) => {
  switch (data.value) {
    case 'export':
      try {
        const res = await backupApi.export()
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `2fa-backup-${Date.now()}.json`
        link.click()
        URL.revokeObjectURL(url)
        
        // P1 优化：记录备份时间
        localStorage.setItem('last_backup_time', Date.now().toString())
        
        MessagePlugin.success('导出成功')
      } catch (error) {
        MessagePlugin.error('导出失败')
      }
      break
    case 'import':
      importDialogVisible.value = true
      break
    case 'settings':
      router.push('/settings')
      break
  }
}

const handleLock = () => {
  appStore.lock()
  router.push('/unlock')
}

// 密钥显示/隐藏相关函数
const toggleSecretKeyVisibility = (secretId) => {
  const index = visibleSecretIds.value.indexOf(secretId)
  if (index > -1) {
    // 已显示，隐藏它
    visibleSecretIds.value.splice(index, 1)
  } else {
    // 未显示，显示它
    visibleSecretIds.value.push(secretId)
  }
}

const copySecretKey = async (secretKey) => {
  try {
    // 优先使用 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(secretKey)
      MessagePlugin.success('密钥已复制到剪贴板')
    } else {
      // 回退方案：使用 textarea
      const textarea = document.createElement('textarea')
      textarea.value = secretKey
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        const successful = document.execCommand('copy')
        if (successful) {
          MessagePlugin.success('密钥已复制到剪贴板')
        } else {
          throw new Error('复制命令执行失败')
        }
      } finally {
        document.body.removeChild(textarea)
      }
    }
  } catch (error) {
    MessagePlugin.error('复制失败：' + error.message)
  }
}

// 批量操作函数
const enterBatchMode = () => {
  batchMode.value = true
  selectedIds.value = []
}

const exitBatchMode = () => {
  batchMode.value = false
  selectedIds.value = []
}

const toggleSelect = (id) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const handleSelectAll = (checked) => {
  if (checked) {
    selectedIds.value = filteredSecrets.value.map(s => s.id)
  } else {
    selectedIds.value = []
  }
}

const batchDelete = async () => {
  if (selectedIds.value.length === 0) {
    MessagePlugin.warning('请先选择要删除的密钥')
    return
  }

  const confirmed = confirm(`确定要删除选中的 ${selectedIds.value.length} 个密钥吗？此操作不可恢复！`)
  if (!confirmed) return

  try {
    await secretApi.batchDelete(selectedIds.value)
    MessagePlugin.success(`成功删除 ${selectedIds.value.length} 个密钥`)
    loadSecrets()
    loadTokens()
    exitBatchMode()
  } catch (error) {
    MessagePlugin.error('批量删除失败：' + (error.response?.data?.message || error.message))
  }
}

const batchExport = () => {
  if (selectedIds.value.length === 0) {
    MessagePlugin.warning('请先选择要导出的密钥')
    return
  }

  try {
    const selectedSecrets = secrets.value.filter(s => selectedIds.value.includes(s.id))
    
    const exportData = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      count: selectedSecrets.length,
      secrets: selectedSecrets
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `2fa-selected-${selectedSecrets.length}-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    MessagePlugin.success(`成功导出 ${selectedSecrets.length} 个密钥`)
  } catch (error) {
    MessagePlugin.error('导出失败：' + error.message)
  }
}

// 处理备份文件选择
const handleImportFileSelect = (event) => {
  fileInputRef.value = event.target.files[0]
}

const handleImport = async () => {
  if (!fileInputRef.value) {
    MessagePlugin.warning('请选择文件')
    return
  }

  try {
    const text = await fileInputRef.value.text()
    const data = JSON.parse(text)
    
    await backupApi.import({
      categories: data.categories,
      secrets: data.secrets,
      merge: importMode.value === 'merge'
    })

    MessagePlugin.success('导入成功')
    loadSecrets()
    loadTokens()
    importDialogVisible.value = false
  } catch (error) {
    MessagePlugin.error('导入失败：' + error.message)
  }
}

// 快捷键
useKeyboard({
  onSearch: () => document.querySelector('.search-input input')?.focus(),
  onNew: showAddDialog,
  onLock: handleLock
})

// P1 优化：检查备份状态
const checkBackupStatus = () => {
  const lastBackup = localStorage.getItem('last_backup_time')
  if (!lastBackup) return
  
  const days = (Date.now() - parseInt(lastBackup)) / (1000 * 60 * 60 * 24)
  
  if (days > 7) {
    setTimeout(() => {
      MessagePlugin.warning({
        content: `您已经 ${Math.floor(days)} 天没有备份数据了，建议立即备份`,
        duration: 8000
      })
    }, 2000) // 延迟2秒显示，避免干扰加载
  }
}

let timer = null

onMounted(() => {
  loadSecrets()
  loadTokens()
  
  // P1 优化：检查备份状态
  checkBackupStatus()
  
  timer = setInterval(() => {
    tokenRemaining.value--
    if (tokenRemaining.value <= 0) {
      loadTokens()
    }
  }, 1000)

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('paste', handlePaste)
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  background: var(--bg-color);
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0;
}

[theme-mode="dark"] .header {
  background: linear-gradient(to bottom, #2a2a2a 0%, #252525 100%);
  border-bottom-color: #3a3a3a;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.header-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 12px 32px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 32px;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #0050b3 0%, #1890ff 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

[theme-mode="dark"] .logo-icon {
  background: linear-gradient(135deg, #1890ff 0%, #4dabf7 100%);
  box-shadow: 0 2px 8px rgba(77, 171, 247, 0.3);
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}

[theme-mode="dark"] .brand-name {
  color: #ffffff;
}

.brand-desc {
  font-size: 11px;
  color: #999;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.header-center {
  display: flex;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-toolbar {
  background: #fff9e6;
  border: 1px solid #ffe58f;
  border-left: 3px solid #faad14;
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 24px;
  border-radius: 8px;
  margin-top: -8px;
  margin-bottom: 16px;
}

[theme-mode="dark"] .batch-toolbar {
  background: rgba(250, 173, 20, 0.1);
  border-color: rgba(250, 173, 20, 0.3);
  border-left-color: #faad14;
}

.batch-toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.selected-count {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

[theme-mode="dark"] .selected-count {
  color: #aaa;
}

.batch-toolbar-right {
  display: flex;
  gap: 12px;
}

.checkbox-cell {
  padding: 16px 12px !important;
}

.selected-row {
  background: #e6f7ff !important;
}

[theme-mode="dark"] .selected-row {
  background: rgba(24, 144, 255, 0.1) !important;
}

.selected-card {
  border: 2px solid #1890ff !important;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2) !important;
}

.search-input {
  width: 100%;
  max-width: 500px;
}

.search-input :deep(.t-input) {
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid transparent;
  height: 40px;
  transition: all 0.2s;
}

.search-input :deep(.t-input__inner) {
  font-size: 14px;
}

.search-input :deep(.t-input:hover) {
  background: #efefef;
  border-color: #d9d9d9;
}

.search-input :deep(.t-input:focus) {
  background: white;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

[theme-mode="dark"] .search-input :deep(.t-input) {
  background: rgba(255,255,255,0.06);
  border-color: transparent;
}

[theme-mode="dark"] .search-input :deep(.t-input:hover) {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.1);
}

[theme-mode="dark"] .search-input :deep(.t-input:focus) {
  background: rgba(255,255,255,0.1);
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.main-content {
  flex: 1;
  padding: 32px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

/* P1 优化：收藏快速访问栏 */
.favorites-bar {
  background: linear-gradient(135deg, #fffbf0 0%, #fff 100%);
  border: 1px solid #ffe8b3;
  border-left: 3px solid #faad14;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.08);
}

[theme-mode="dark"] .favorites-bar {
  background: linear-gradient(135deg, rgba(250, 173, 20, 0.12) 0%, rgba(250, 173, 20, 0.06) 100%);
  border-color: rgba(250, 173, 20, 0.25);
  border-left-color: #faad14;
}

.favorites-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #999;
  margin-bottom: 16px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

[theme-mode="dark"] .favorites-header {
  color: #888;
}

.favorites-title {
  font-size: 12px;
}

.favorites-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.favorite-item {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 12px;
}

.favorite-item:hover {
  border-color: #1890ff;
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.12);
  transform: translateY(-3px);
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
}

[theme-mode="dark"] .favorite-item {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

[theme-mode="dark"] .favorite-item:hover {
  border-color: #1890ff;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(24, 144, 255, 0.08) 100%);
}

.favorite-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.favorite-info {
  flex: 1;
  min-width: 0;
}

.favorite-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

[theme-mode="dark"] .favorite-name {
  color: #ddd;
}

.favorite-token {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: 700;
  color: #1890ff;
  letter-spacing: 1px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.empty-icon {
  color: #dcdcdc;
  margin-bottom: 24px;
}

[theme-mode="dark"] .empty-icon {
  color: #666;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

[theme-mode="dark"] .empty-title {
  color: #e5e5e5;
}

.empty-desc {
  color: #999;
  font-size: 14px;
  margin: 0 0 32px 0;
  max-width: 400px;
  line-height: 1.6;
}

.table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02);
  overflow: hidden;
}

[theme-mode="dark"] .table-container {
  background: #2a2a2a;
  border-color: #3a3a3a;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15);
}

.secret-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.secret-table thead {
  background: linear-gradient(to bottom, #fafafa 0%, #f5f5f5 100%);
  border-bottom: 2px solid #e8e8e8;
}

[theme-mode="dark"] .secret-table thead {
  background: linear-gradient(to bottom, #2a2a2a 0%, #252525 100%);
  border-bottom-color: #3a3a3a;
}

.secret-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 12px;
  color: #999;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

[theme-mode="dark"] .secret-table th {
  color: #888;
}

/* 表格列宽定义 */
.checkbox-col {
  width: 50px;
}

.icon-col {
  width: 60px;
}

.name-col {
  width: 180px;
}

.issuer-col {
  width: 140px;
}

.note-col {
  width: 160px;
}

.key-col {
  width: 180px;
}

.code-col {
  width: 130px;
}

.timer-col {
  width: 160px;
}

.action-col {
  width: 110px;
}

.secret-row {
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.secret-row:hover {
  background: #fafafa;
}

[theme-mode="dark"] .secret-row {
  border-bottom-color: #333;
}

[theme-mode="dark"] .secret-row:hover {
  background: rgba(255,255,255,0.03);
}

.secret-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
  vertical-align: middle;
  font-size: 14px;
}

[theme-mode="dark"] .secret-table td {
  border-bottom-color: #2a2a2a;
}

.secret-table tbody tr {
  transition: all 0.2s ease;
}

.secret-table tbody tr:hover {
  background: linear-gradient(to right, #fafafa 0%, #ffffff 100%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

[theme-mode="dark"] .secret-table tbody tr:hover {
  background: linear-gradient(to right, #2a2a2a 0%, #272727 100%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.service-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.secret-table tbody tr:hover .service-icon {
  transform: scale(1.05);
}

.name-wrapper {
  display: flex;
  align-items: center;
}

.secret-name {
  font-weight: 500;
  font-size: 15px;
}

.issuer {
  color: #666;
  font-size: 13px;
}

[theme-mode="dark"] .issuer {
  color: #999;
}

.note-text {
  color: #666;
  font-size: 13px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  padding: 4px 8px;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f6f7 100%);
  border-radius: 4px;
  border-left: 2px solid #d9d9d9;
  transition: all 0.2s ease;
}

.note-text:hover {
  background: linear-gradient(135deg, #f0f2f5 0%, #e8eaed 100%);
  border-left-color: #0052d9;
}

[theme-mode="dark"] .note-text {
  color: #999;
  background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%);
  border-left-color: #4a4a4a;
}

[theme-mode="dark"] .note-text:hover {
  background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.04) 100%);
  border-left-color: #0052d9;
}

.note-cell {
  max-width: 160px;
}

.secret-key-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.secret-key-text {
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  color: #666;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 100px;
}

[theme-mode="dark"] .secret-key-text {
  color: #aaa;
}

.secret-key-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.secret-key-actions .t-button {
  padding: 2px;
  min-width: unset;
}

.secret-key-actions .t-icon {
  font-size: 16px;
  color: #666;
  transition: color 0.2s;
}

[theme-mode="dark"] .secret-key-actions .t-icon {
  color: #aaa;
}

.secret-key-actions .t-button:hover .t-icon {
  color: #1890ff;
}

.code-display {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #0050b3;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 6px;
  display: inline-block;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border: 1px solid #bae7ff;
  box-shadow: 0 1px 3px rgba(0, 80, 179, 0.08);
}

.code-display:hover {
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
  border-color: #91d5ff;
}

.code-display:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.15);
}

[theme-mode="dark"] .code-display {
  color: #4dabf7;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.15) 0%, rgba(24, 144, 255, 0.1) 100%);
  border-color: rgba(24, 144, 255, 0.3);
}

[theme-mode="dark"] .code-display:hover {
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.2) 0%, rgba(24, 144, 255, 0.15) 100%);
  border-color: rgba(24, 144, 255, 0.4);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

/* P1 优化：验证码即将过期提醒 */
.code-expiring {
  animation: pulse 0.5s ease-in-out infinite;
  color: #ff4d4f !important;
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.6;
    transform: scale(1.02);
  }
}

/* P1 优化：复制成功动画 */
.copied-animation {
  animation: copied-flash 0.6s ease;
}

@keyframes copied-flash {
  0% { 
    background: transparent;
    transform: scale(1);
  }
  20% { 
    background: #52c41a;
    color: white;
    transform: scale(1.08);
    box-shadow: 0 4px 12px rgba(82, 196, 26, 0.4);
  }
  100% { 
    background: transparent;
    transform: scale(1);
  }
}

.timer-wrapper {
  display: flex;
  align-items: center;
}

.timer-text {
  font-weight: 500;
  color: #666;
  min-width: 30px;
}

.footer-stats {
  margin-top: 32px;
  padding: 14px 20px;
  background: linear-gradient(to right, #fafafa 0%, #ffffff 100%);
  border-radius: 10px;
  display: flex;
  justify-content: center;
  gap: 32px;
  color: #999;
  font-size: 13px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}

[theme-mode="dark"] .footer-stats {
  background: linear-gradient(to right, #2a2a2a 0%, #272727 100%);
  border-color: #3a3a3a;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.stat-item .t-icon {
  color: #1890ff;
}

[theme-mode="dark"] .stat-item .t-icon {
  color: #4dabf7;
}

/* 移动端样式 */
.mobile-view {
  display: none;
}

.mobile-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.mobile-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06);
  transform: translateY(-2px);
}

[theme-mode="dark"] .mobile-card {
  background: var(--bg-secondary);
  border-color: #3a3a3a;
}

[theme-mode="dark"] .mobile-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2);
}

.mobile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.mobile-card-note {
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
  border-left: 3px solid #0052d9;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

[theme-mode="dark"] .mobile-card-note {
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 100%);
  border-left-color: #0052d9;
}

.mobile-note-text {
  flex: 1;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  word-break: break-word;
}

[theme-mode="dark"] .mobile-note-text {
  color: #999;
}

.mobile-card-title {
  display: flex;
  gap: 12px;
  align-items: center;
  flex: 1;
}

.service-icon-mobile {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  transition: transform 0.2s ease;
}

.mobile-card:active .service-icon-mobile {
  transform: scale(0.95);
}

.mobile-name {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  line-height: 1.4;
  color: #333;
}

[theme-mode="dark"] .mobile-name {
  color: #e5e5e5;
}

.mobile-issuer {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
  line-height: 1.3;
}

[theme-mode="dark"] .mobile-issuer {
  color: #888;
}

.mobile-card-secret {
  background: linear-gradient(135deg, #f8f9fa 0%, #f5f5f5 100%);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 14px;
  border: 1px solid #e8e8e8;
}

[theme-mode="dark"] .mobile-card-secret {
  background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%);
  border-color: #3a3a3a;
}

.mobile-secret-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.mobile-secret-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-secret-text {
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  color: #666;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}

[theme-mode="dark"] .mobile-secret-text {
  color: #aaa;
}

.mobile-secret-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.mobile-secret-actions .t-button {
  padding: 4px;
  min-width: unset;
}

.mobile-secret-actions .t-icon {
  font-size: 18px;
  color: #666;
}

[theme-mode="dark"] .mobile-secret-actions .t-icon {
  color: #aaa;
}

.mobile-secret-actions .t-button:hover .t-icon {
  color: #1890ff;
}

.mobile-card-code {
  text-align: center;
  margin-bottom: 14px;
}

.mobile-code-display {
  font-family: 'SF Mono', 'Courier New', monospace;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 6px;
  color: #1890ff;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
  padding: 8px 0;
}

[theme-mode="dark"] .mobile-code-display {
  color: #4da3ff;
  text-shadow: 0 2px 4px rgba(77, 163, 255, 0.2);
}

.mobile-card-timer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-timer-text {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
}

/* 二维码上传区域样式 */
.qr-upload-zone {
  border: 2px dashed #dcdcdc;
  border-radius: 12px;
  padding: 40px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f5f7fa;
}

.qr-upload-zone:hover {
  border-color: #0052d9;
  background: #f0f5ff;
}

.qr-upload-zone.dragging {
  border-color: #0052d9;
  background: #e6f4ff;
  transform: scale(1.02);
}

html[theme-mode="dark"] .qr-upload-zone {
  background: #2c2c2c;
  border-color: #4a4a4a;
}

html[theme-mode="dark"] .qr-upload-zone:hover {
  background: #363636;
  border-color: #0052d9;
}

html[theme-mode="dark"] .qr-upload-zone.dragging {
  background: #1a3a5c;
  border-color: #0052d9;
}

.upload-text-primary {
  font-size: 16px;
  margin-bottom: 8px;
  color: #000;
}

.upload-text-secondary {
  font-size: 13px;
  color: #999;
}

html[theme-mode="dark"] .upload-text-primary {
  color: #fff;
}

html[theme-mode="dark"] .upload-text-secondary {
  color: #999;
}

/* 响应式 */
  @media (max-width: 768px) {
  /* 收藏栏移动端适配 */
  .favorites-bar {
    padding: 12px 16px;
    margin-bottom: 16px;
  }
  
  .favorites-list {
    grid-template-columns: 1fr;
  }

  .header {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 12px;
  }

  .header-left {
    order: 1;
  }

  .header-right {
    order: 2;
    width: 100%;
    justify-content: space-between;
  }

  .search-input {
    flex: 1;
    max-width: none;
  }

  .btn-text {
    display: none;
  }

  .batch-toolbar {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }

  .batch-toolbar-left,
  .batch-toolbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .batch-toolbar-right {
    flex-wrap: wrap;
  }

  .logo-text {
    font-size: 16px;
  }

  .main-content {
    padding: 16px;
  }

  .desktop-view {
    display: none !important;
  }

  .mobile-view {
    display: block !important;
  }

  .footer-stats {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .stat-item {
    font-size: 12px;
  }
}

/* 中等屏幕优化 */
@media (min-width: 769px) and (max-width: 1200px) {
  .name-col {
    width: 160px;
  }
  
  .issuer-col {
    width: 120px;
  }
  
  .note-col {
    width: 140px;
  }
  
  .key-col {
    width: 160px;
  }
  
  .code-col {
    width: 120px;
  }
  
  .timer-col {
    width: 140px;
  }
  
  .action-col {
    width: 100px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1400px) {
  .main-content {
    max-width: 1600px;
    margin: 0 auto;
  }
  
  .name-col {
    width: 220px;
  }
  
  .issuer-col {
    width: 160px;
  }
  
  .note-col {
    width: 180px;
  }
  
  .key-col {
    width: 200px;
  }
}
</style>
