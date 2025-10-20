<template>
  <div class="home">
    <!-- 顶部导航栏 -->
    <div class="header">
      <div class="header-left">
        <t-icon name="lock-on" size="24px" style="color: #1890ff;" />
        <span class="logo-text">2FA 笔记本</span>
      </div>
      <div class="header-right">
        <t-input 
          v-model="searchKeyword" 
          placeholder="搜索密钥..."
          class="search-input"
          clearable
        >
          <template #prefix-icon><t-icon name="search" /></template>
        </t-input>
        <t-button theme="primary" @click="showAddDialog">
          <template #icon><t-icon name="add" /></template>
          <span class="btn-text">添加</span>
        </t-button>
        <t-dropdown :options="menuOptions" @click="handleMenu">
          <t-button variant="outline">
            <t-icon name="ellipsis" />
          </t-button>
        </t-dropdown>
        <t-button variant="outline" @click="handleLock">
          <t-icon name="lock-on" />
        </t-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 空状态 -->
      <div v-if="!loading && filteredSecrets.length === 0" class="empty-state">
        <t-icon name="inbox" size="80px" style="color: #dcdcdc;" />
        <p class="empty-text">还没有密钥，点击"添加"按钮开始</p>
        <t-button theme="primary" size="large" @click="showAddDialog">
          <template #icon><t-icon name="add" /></template>
          添加第一个密钥
        </t-button>
      </div>

      <!-- 加载状态 -->
      <t-loading v-else-if="loading" size="large" text="加载中..." />

      <!-- 桌面端表格 -->
      <div v-else class="table-container desktop-view">
        <table class="secret-table">
          <thead>
            <tr>
              <th width="5%"></th>
              <th width="25%">服务/名称</th>
              <th width="20%">发行者</th>
              <th width="20%">验证码</th>
              <th width="20%">剩余时间</th>
              <th width="10%">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="secret in filteredSecrets" :key="secret.id" class="secret-row">
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
              <td class="code-cell">
                <div class="code-display">{{ formatToken(getToken(secret.id)) }}</div>
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
                <t-space size="small">
                  <t-button size="small" theme="primary" variant="outline" @click="copyToken(secret.id)">
                    <t-icon name="file-copy" />
                  </t-button>
                  <t-dropdown :options="getSecretMenu(secret)" @click="(e) => handleSecretMenu(e, secret)">
                    <t-button size="small" variant="outline">
                      <t-icon name="more" />
                    </t-button>
                  </t-dropdown>
                </t-space>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 移动端列表 -->
      <div v-if="!loading && filteredSecrets.length > 0" class="mobile-view">
        <div v-for="secret in filteredSecrets" :key="secret.id" class="mobile-card">
          <div class="mobile-card-header">
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
          
          <div class="mobile-card-code">
            <div class="mobile-code-display">{{ formatToken(getToken(secret.id)) }}</div>
            <t-button theme="primary" size="large" block @click="copyToken(secret.id)">
              <template #icon><t-icon name="file-copy" /></template>
              复制
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
        <span>共 {{ filteredSecrets.length }} 个密钥</span>
        <span>验证码每 30 秒自动刷新</span>
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
          <input type="file" accept=".json" @change="handleFileSelect" ref="fileInputRef" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAppStore } from '../stores/app'
import { secretApi, backupApi } from '../api'
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

const secretDialogVisible = ref(false)
const secretDialogTitle = ref('添加密钥')
const secretForm = ref({ name: '', secret_key: '', issuer: '', note: '' })

const importDialogVisible = ref(false)
const importMode = ref('merge')
const fileInputRef = ref(null)

const menuOptions = [
  { content: '导出数据', value: 'export', prefixIcon: () => <t-icon name="download" /> },
  { content: '导入数据', value: 'import', prefixIcon: () => <t-icon name="upload" /> },
  { content: '设置', value: 'settings', prefixIcon: () => <t-icon name="setting" /> }
]

const getSecretMenu = (secret) => [
  { content: '编辑', value: 'edit', prefixIcon: () => <t-icon name="edit" /> },
  { content: secret.is_favorite ? '取消收藏' : '收藏', value: 'favorite', prefixIcon: () => <t-icon name="star" /> },
  { content: '删除', value: 'delete', prefixIcon: () => <t-icon name="delete" />, theme: 'danger' }
]

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
    secrets.value = res.data.data
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
    console.error(error)
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
      await navigator.clipboard.writeText(token)
      MessagePlugin.success('已复制到剪贴板')
    } catch (error) {
      MessagePlugin.error('复制失败')
    }
  }
}

const showAddDialog = () => {
  secretDialogTitle.value = '添加密钥'
  secretForm.value = { name: '', secret_key: '', issuer: '', note: '' }
  secretDialogVisible.value = true
}

const showQRUpload = () => {
  MessagePlugin.info('二维码上传功能开发中...')
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

const handleFileSelect = (event) => {
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

let timer = null

onMounted(() => {
  loadSecrets()
  loadTokens()
  
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
  background: white;
  padding: 16px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

[theme-mode="dark"] .header {
  background: var(--bg-secondary);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #1890ff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 300px;
}

.main-content {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
}

.empty-text {
  margin: 24px 0;
  font-size: 16px;
  color: #999;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
}

[theme-mode="dark"] .table-container {
  background: var(--bg-secondary);
}

.secret-table {
  width: 100%;
  border-collapse: collapse;
}

.secret-table thead {
  background: #fafafa;
}

[theme-mode="dark"] .secret-table thead {
  background: rgba(255,255,255,0.05);
}

.secret-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #666;
  border-bottom: 2px solid #e8e8e8;
}

[theme-mode="dark"] .secret-table th {
  color: #aaa;
  border-bottom-color: #333;
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
  padding: 16px;
}

.service-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
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

.code-display {
  font-family: 'Courier New', monospace;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #1890ff;
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
  margin-top: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 14px;
}

[theme-mode="dark"] .footer-stats {
  background: var(--bg-secondary);
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

[theme-mode="dark"] .mobile-card {
  background: var(--bg-secondary);
}

.mobile-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
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
}

.mobile-name {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.mobile-issuer {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.mobile-card-code {
  text-align: center;
  margin-bottom: 12px;
}

.mobile-code-display {
  font-family: 'Courier New', monospace;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #1890ff;
  margin-bottom: 16px;
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

/* 响应式 */
@media (max-width: 768px) {
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
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>
