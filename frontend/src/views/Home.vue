<template>
  <div class="home">
    <!-- 顶部导航栏 -->
    <t-header class="header">
      <template #logo>
        <div class="logo">
          <t-icon name="lock-on" size="24px" />
          <span class="logo-text">2FA 笔记本</span>
        </div>
      </template>
      <template #operations>
        <t-space>
          <t-button theme="primary" @click="showAddDialog">
            <template #icon><t-icon name="add" /></template>
            {{ $t('secret.addSecret') }}
          </t-button>
          <t-dropdown :options="menuOptions" @click="handleMenu">
            <t-button variant="text">
              <t-icon name="ellipsis" size="20px" />
            </t-button>
          </t-dropdown>
        </t-space>
      </template>
    </t-header>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 左侧分类栏 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>{{ $t('category.categories') }}</h3>
          <t-button size="small" variant="text" @click="showCategoryDialog">
            <t-icon name="add" />
          </t-button>
        </div>
        <t-menu v-model="selectedCategory">
          <t-menu-item value="all">
            <template #icon><t-icon name="view-list" /></template>
            {{ $t('category.allSecrets') }}
          </t-menu-item>
          <t-menu-item value="favorite">
            <template #icon><t-icon name="star-filled" /></template>
            {{ $t('secret.favorite') }}
          </t-menu-item>
          <t-menu-item 
            v-for="cat in categories" 
            :key="cat.id" 
            :value="cat.id.toString()"
          >
            <template #icon><t-icon name="folder" /></template>
            {{ cat.name }}
          </t-menu-item>
        </t-menu>
      </div>

      <!-- 右侧内容区 -->
      <div class="content">
        <div class="search-bar">
          <t-input 
            v-model="searchKeyword" 
            :placeholder="$t('common.search')"
            clearable
          >
            <template #prefix-icon><t-icon name="search" /></template>
          </t-input>
        </div>

        <div class="secret-list">
          <t-loading :loading="loading">
            <div v-if="filteredSecrets.length === 0" class="empty">
              <t-icon name="inbox" size="64px" />
              <p>{{ $t('secret.secrets') }}</p>
            </div>
            <div v-else class="secret-grid">
              <t-card 
                v-for="secret in filteredSecrets" 
                :key="secret.id"
                class="secret-card"
                hover-shadow
              >
                <div class="secret-header">
                  <h4>{{ secret.name }}</h4>
                  <t-dropdown :options="secretMenu" @click="(e) => handleSecretMenu(e, secret)">
                    <t-button size="small" variant="text">
                      <t-icon name="more" />
                    </t-button>
                  </t-dropdown>
                </div>
                
                <div class="secret-code">
                  <div class="code-display">{{ getToken(secret.id) }}</div>
                  <t-progress 
                    :percentage="tokenProgress" 
                    :stroke-width="4"
                    theme="success"
                    :show-label="false"
                  />
                  <div class="code-timer">{{ tokenRemaining }}秒</div>
                </div>

                <div class="secret-footer">
                  <t-tag size="small">{{ secret.category_name || '未分类' }}</t-tag>
                  <t-button size="small" @click="copyToken(secret.id)">
                    <template #icon><t-icon name="file-copy" /></template>
                    {{ $t('secret.copyToken') }}
                  </t-button>
                </div>
              </t-card>
            </div>
          </t-loading>
        </div>
      </div>
    </div>

    <!-- 添加/编辑密钥对话框 -->
    <t-dialog
      v-model:visible="secretDialogVisible"
      :header="secretDialogTitle"
      width="600px"
      @confirm="handleSecretSubmit"
    >
      <t-form :data="secretForm">
        <t-form-item :label="$t('secret.secretName')">
          <t-input v-model="secretForm.name" />
        </t-form-item>
        <t-form-item :label="$t('secret.secretKey')">
          <t-input v-model="secretForm.secret_key" />
        </t-form-item>
        <t-form-item :label="$t('secret.issuer')">
          <t-input v-model="secretForm.issuer" />
        </t-form-item>
        <t-form-item :label="$t('secret.category')">
          <t-select v-model="secretForm.category_id">
            <t-option 
              v-for="cat in categories" 
              :key="cat.id" 
              :value="cat.id" 
              :label="cat.name"
            />
          </t-select>
        </t-form-item>
        <t-form-item :label="$t('secret.note')">
          <t-textarea v-model="secretForm.note" :autosize="{ minRows: 3 }" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 分类对话框 -->
    <t-dialog
      v-model:visible="categoryDialogVisible"
      :header="$t('category.addCategory')"
      @confirm="handleCategorySubmit"
    >
      <t-form :data="categoryForm">
        <t-form-item :label="$t('category.categoryName')">
          <t-input v-model="categoryForm.name" />
        </t-form-item>
        <t-form-item :label="$t('category.categoryDesc')">
          <t-textarea v-model="categoryForm.description" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAppStore } from '../stores/app'
import { categoryApi, secretApi, backupApi } from '../api'
import { useKeyboard } from '../composables/useKeyboard'

const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()

const loading = ref(false)
const categories = ref([])
const secrets = ref([])
const tokens = ref({})
const tokenRemaining = ref(30)
const selectedCategory = ref('all')
const searchKeyword = ref('')

const secretDialogVisible = ref(false)
const secretDialogTitle = ref('')
const secretForm = ref({ name: '', secret_key: '', issuer: '', category_id: null, note: '' })

const categoryDialogVisible = ref(false)
const categoryForm = ref({ name: '', description: '' })

const menuOptions = [
  { content: t('backup.export'), value: 'export' },
  { content: t('backup.import'), value: 'import' },
  { content: t('settings.settings'), value: 'settings' },
  { content: t('auth.lock'), value: 'lock' }
]

const secretMenu = [
  { content: t('common.edit'), value: 'edit' },
  { content: t('secret.favorite'), value: 'favorite' },
  { content: t('common.delete'), value: 'delete' }
]

const tokenProgress = computed(() => (tokenRemaining.value / 30) * 100)

const filteredSecrets = computed(() => {
  let result = secrets.value
  
  if (selectedCategory.value !== 'all') {
    if (selectedCategory.value === 'favorite') {
      result = result.filter(s => s.is_favorite)
    } else {
      result = result.filter(s => s.category_id === parseInt(selectedCategory.value))
    }
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(s => 
      s.name.toLowerCase().includes(keyword) ||
      (s.issuer && s.issuer.toLowerCase().includes(keyword))
    )
  }
  
  return result
})

const loadCategories = async () => {
  try {
    const res = await categoryApi.getAll()
    categories.value = res.data.data
  } catch (error) {
    console.error(error)
  }
}

const loadSecrets = async () => {
  loading.value = true
  try {
    const res = await secretApi.getAll()
    secrets.value = res.data.data
  } catch (error) {
    console.error(error)
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

const copyToken = async (id) => {
  const token = tokens.value[id]
  if (token && token !== '------') {
    try {
      await navigator.clipboard.writeText(token)
      MessagePlugin.success(t('secret.copiedSuccess'))
    } catch (error) {
      MessagePlugin.error('Failed to copy')
    }
  }
}

const showAddDialog = () => {
  secretDialogTitle.value = t('secret.addSecret')
  secretForm.value = { name: '', secret_key: '', issuer: '', category_id: null, note: '' }
  secretDialogVisible.value = true
}

const showCategoryDialog = () => {
  categoryForm.value = { name: '', description: '' }
  categoryDialogVisible.value = true
}

const handleSecretSubmit = async () => {
  try {
    if (secretForm.value.id) {
      await secretApi.update(secretForm.value.id, secretForm.value)
    } else {
      await secretApi.create(secretForm.value)
    }
    MessagePlugin.success(t('common.success'))
    loadSecrets()
    loadTokens()
    secretDialogVisible.value = false
  } catch (error) {
    console.error(error)
  }
}

const handleCategorySubmit = async () => {
  try {
    await categoryApi.create(categoryForm.value)
    MessagePlugin.success(t('common.success'))
    loadCategories()
    categoryDialogVisible.value = false
  } catch (error) {
    console.error(error)
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
        MessagePlugin.success(t('backup.exportSuccess'))
      } catch (error) {
        console.error(error)
      }
      break
    case 'settings':
      router.push('/settings')
      break
    case 'lock':
      appStore.lock()
      router.push('/unlock')
      break
  }
}

const handleSecretMenu = async (data, secret) => {
  switch (data.value) {
    case 'edit':
      secretDialogTitle.value = t('secret.editSecret')
      secretForm.value = { ...secret }
      secretDialogVisible.value = true
      break
    case 'favorite':
      try {
        await secretApi.toggleFavorite(secret.id)
        loadSecrets()
      } catch (error) {
        console.error(error)
      }
      break
    case 'delete':
      try {
        await secretApi.delete(secret.id)
        MessagePlugin.success(t('message.deleteSuccess'))
        loadSecrets()
      } catch (error) {
        console.error(error)
      }
      break
  }
}

// 快捷键
useKeyboard({
  onSearch: () => document.querySelector('.search-bar input')?.focus(),
  onNew: showAddDialog,
  onLock: () => handleMenu({ value: 'lock' })
})

let timer = null

onMounted(() => {
  loadCategories()
  loadSecrets()
  loadTokens()
  
  timer = setInterval(() => {
    tokenRemaining.value--
    if (tokenRemaining.value <= 0) {
      loadTokens()
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
}

.header {
  background: white;
  box-shadow: 0 2px 8px var(--shadow-light);
}

[theme-mode="dark"] .header {
  background: var(--bg-secondary);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1890ff;
}

.main-container {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 250px;
  background: white;
  border-right: 1px solid var(--border-color);
  padding: 20px 0;
  overflow-y: auto;
}

[theme-mode="dark"] .sidebar {
  background: var(--bg-secondary);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 16px;
  border-bottom: 1px solid var(--border-color);
}

.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.search-bar {
  margin-bottom: 24px;
}

.secret-list {
  min-height: 400px;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #999;
}

.secret-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.secret-card {
  transition: all 0.3s;
}

.secret-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.secret-header h4 {
  font-size: 16px;
  font-weight: 600;
}

.secret-code {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  margin-bottom: 12px;
}

[theme-mode="dark"] .secret-code {
  background: rgba(255, 255, 255, 0.05);
}

.code-display {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 4px;
  font-family: 'Courier New', monospace;
  color: #1890ff;
  margin-bottom: 12px;
}

.code-timer {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.secret-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
  }
  
  .secret-grid {
    grid-template-columns: 1fr;
  }
}
</style>
