<template>
  <div class="api-keys app-container">
    <t-card class="app-card">
      <div class="page-header">
        <h1>API 密钥管理</h1>
        <t-button theme="primary" @click="openCreate">
          <template #icon><t-icon name="add" /></template>
          新建密钥
        </t-button>
      </div>

      <div class="filters">
        <t-space direction="vertical" style="width: 100%;">
          <t-space :break-line="isMobile">
            <t-input 
              v-model="filters.keyword" 
              placeholder="搜索名称或前缀" 
              clearable
              :style="{ width: isMobile ? '100%' : '220px' }"
            >
              <template #prefix-icon><t-icon name="search" /></template>
            </t-input>
            <t-select 
              v-model="filters.permissions" 
              placeholder="权限" 
              clearable
              :style="{ width: isMobile ? '100%' : '140px' }"
            >
              <t-option value="" label="全部" />
              <t-option value="read" label="只读" />
              <t-option value="write" label="读写" />
            </t-select>
            <t-select 
              v-model="filters.status" 
              placeholder="状态" 
              clearable
              :style="{ width: isMobile ? '100%' : '140px' }"
            >
              <t-option value="" label="全部" />
              <t-option value="1" label="启用" />
              <t-option value="0" label="禁用" />
            </t-select>
            <t-button variant="outline" @click="resetFilters">
              <template #icon><t-icon name="refresh" /></template>
              重置
            </t-button>
          </t-space>
        </t-space>
      </div>

      <t-loading :loading="loading" size="large">
        <t-table 
          :data="pagedKeys" 
          :columns="columns" 
          row-key="id" 
          stripe 
          hover 
          :pagination="pagination" 
          @page-change="onPageChange"
          :empty="keys.length === 0 ? '暂无 API 密钥，点击上方按钮新建' : '没有符合条件的数据'"
        >
      <template #permissions="{ row }">
        <t-tag theme="primary" variant="light-outline">{{ row.permissions }}</t-tag>
      </template>
      <template #is_active="{ row }">
        <t-switch :value="row.is_active === 1" @change="(v)=>toggleActive(row, v)" />
      </template>
          <template #operation="{ row }">
            <t-space :size="isMobile ? 'small' : 'medium'">
              <t-button size="small" @click="openEdit(row)">
                <template #icon><t-icon name="edit" /></template>
                {{ isMobile ? '' : '编辑' }}
              </t-button>
              <t-button size="small" variant="outline" @click="copyPrefix(row)">
                <template #icon><t-icon name="file-copy" /></template>
                {{ isMobile ? '' : '复制' }}
              </t-button>
              <t-popconfirm content="确认删除此 API 密钥？" @confirm="removeKey(row)">
                <t-button size="small" theme="danger">
                  <template #icon><t-icon name="delete" /></template>
                  {{ isMobile ? '' : '删除' }}
                </t-button>
              </t-popconfirm>
            </t-space>
          </template>
        </t-table>
      </t-loading>
    </t-card>

    <t-dialog 
      v-model:visible="dialogVisible" 
      :header="dialogTitle" 
      :confirm-btn="{ content: submitting ? '提交中...' : '确定', loading: submitting }"
      @confirm="handleSubmit"
      width="500px"
    >
      <t-form :data="form" label-width="80px" :rules="formRules" ref="formRef">
        <t-form-item label="名称" name="name" required>
          <t-input 
            v-model="form.name" 
            placeholder="请输入密钥名称，例如：生产环境 API"
            maxlength="50"
          />
        </t-form-item>
        <t-form-item label="权限" name="permissions">
          <t-select v-model="form.permissions">
            <t-option value="read" label="只读 - 仅查询数据" />
            <t-option value="write" label="读写 - 可修改数据" />
          </t-select>
        </t-form-item>
        <t-form-item label="有效期" name="expiresIn" v-if="!form.id">
          <t-select v-model="form.expiresIn">
            <t-option value="" label="永不过期" />
            <t-option value="30d" label="30 天" />
            <t-option value="90d" label="90 天" />
            <t-option value="1y" label="1 年" />
          </t-select>
        </t-form-item>
        <t-alert 
          v-if="createdApiKey" 
          theme="success" 
          title="密钥创建成功！" 
          style="margin-top: 16px;"
        >
          <div style="margin-top: 8px;">
            <p style="margin: 0 0 8px 0; font-weight: 500;">请立即复制并妥善保存，此密钥仅显示一次：</p>
            <t-textarea 
              :value="createdApiKey" 
              readonly 
              :autosize="{ minRows: 2, maxRows: 4 }"
              style="font-family: monospace; font-size: 12px;"
            />
            <t-button 
              size="small" 
              theme="primary" 
              variant="outline" 
              @click="copyCreatedKey"
              style="margin-top: 8px;"
            >
              <template #icon><t-icon name="file-copy" /></template>
              复制密钥
            </t-button>
          </div>
        </t-alert>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { apiKeysApi } from '../api'

const keys = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = ref({ id: null, name: '', permissions: 'read', expiresIn: '' })
const formRef = ref(null)
const createdApiKey = ref('')
const filters = ref({ keyword: '', permissions: '', status: '' })
const pagination = ref({ current: 1, pageSize: 10, total: 0 })
const loading = ref(false)
const submitting = ref(false)
const isMobile = ref(window.innerWidth <= 768)

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入密钥名称', type: 'error' },
    { min: 2, message: '名称至少2个字符', type: 'warning' }
  ]
}

// 响应式检测
const handleResize = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const columns = [
  { colKey: 'name', title: '名称' },
  { colKey: 'key_prefix', title: '前缀' },
  { colKey: 'permissions', title: '权限', cell: 'permissions' },
  { colKey: 'is_active', title: '启用', cell: 'is_active', width: 120 },
  { colKey: 'expires_at', title: '到期时间', width: 180 },
  { colKey: 'last_used_at', title: '最后使用', width: 180 },
  { colKey: 'operation', title: '操作', width: 200 }
]

const loadKeys = async () => {
  loading.value = true
  try {
    const res = await apiKeysApi.list()
    keys.value = res.data.data || []
    pagination.value.total = filteredKeys.value.length
  } catch (e) {
    console.error('加载 API 密钥失败:', e)
    MessagePlugin.error(e.response?.data?.message || '加载 API 密钥失败')
  } finally {
    loading.value = false
  }
}

const filteredKeys = computed(() => {
  const kw = (filters.value.keyword || '').toLowerCase()
  return (keys.value || []).filter(k => {
    const matchKw = !kw || (String(k.name || '').toLowerCase().includes(kw) || String(k.key_prefix || '').toLowerCase().includes(kw))
    const matchPerm = !filters.value.permissions || k.permissions === filters.value.permissions
    const matchStatus = filters.value.status === '' || String(k.is_active) === String(filters.value.status)
    return matchKw && matchPerm && matchStatus
  })
})

const pagedKeys = computed(() => {
  const start = (pagination.value.current - 1) * pagination.value.pageSize
  return filteredKeys.value.slice(start, start + pagination.value.pageSize)
})

watch(filteredKeys, (list) => {
  pagination.value.total = list.length
  if ((pagination.value.current - 1) * pagination.value.pageSize >= list.length) {
    pagination.value.current = 1
  }
})

const onPageChange = (pageInfo) => {
  const { current, pageSize } = pageInfo
  pagination.value.current = current
  pagination.value.pageSize = pageSize
}

const resetFilters = () => {
  filters.value = { keyword: '', permissions: '', status: '' }
}

const openCreate = () => {
  dialogTitle.value = '新建密钥'
  form.value = { id: null, name: '', permissions: 'read', expiresIn: '' }
  createdApiKey.value = ''
  dialogVisible.value = true
}

const openEdit = (row) => {
  dialogTitle.value = '编辑密钥'
  form.value = { id: row.id, name: row.name, permissions: row.permissions, expiresIn: '' }
  createdApiKey.value = ''
  dialogVisible.value = true
}

const handleSubmit = async () => {
  // 表单验证
  const valid = await formRef.value?.validate()
  if (!valid) return

  submitting.value = true
  try {
    if (form.value.id) {
      await apiKeysApi.update(form.value.id, {
        name: form.value.name,
        permissions: form.value.permissions
      })
      MessagePlugin.success('更新成功')
      dialogVisible.value = false
    } else {
      const res = await apiKeysApi.create({
        name: form.value.name,
        permissions: form.value.permissions,
        expiresIn: form.value.expiresIn
      })
      createdApiKey.value = res.data.data?.apiKey || ''
      MessagePlugin.success('创建成功，请立即保存密钥')
      // 创建成功时保留弹窗展示密钥
    }
    await loadKeys()
  } catch (e) {
    console.error('提交失败:', e)
    MessagePlugin.error(e.response?.data?.message || '操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

const toggleActive = async (row, v) => {
  try {
    await apiKeysApi.update(row.id, { isActive: v })
    row.is_active = v ? 1 : 0
    MessagePlugin.success(v ? '已启用' : '已禁用')
  } catch (e) {
    console.error('切换状态失败:', e)
    MessagePlugin.error(e.response?.data?.message || '操作失败')
    // 回滚状态
    row.is_active = v ? 0 : 1
  }
}

const removeKey = async (row) => {
  try {
    await apiKeysApi.delete(row.id)
    MessagePlugin.success('删除成功')
    await loadKeys()
  } catch (e) {
    console.error('删除失败:', e)
    MessagePlugin.error(e.response?.data?.message || '删除失败')
  }
}

const copyPrefix = async (row) => {
  try {
    await navigator.clipboard.writeText(row.key_prefix || '')
    MessagePlugin.success('前缀已复制到剪贴板')
  } catch (e) {
    console.error('复制失败:', e)
    MessagePlugin.error('复制失败，请手动复制')
  }
}

const copyCreatedKey = async () => {
  try {
    await navigator.clipboard.writeText(createdApiKey.value)
    MessagePlugin.success('完整密钥已复制到剪贴板')
  } catch (e) {
    console.error('复制失败:', e)
    MessagePlugin.error('复制失败，请手动复制')
  }
}

onMounted(() => {
  loadKeys()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.filters {
  margin-bottom: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .page-header h1 {
    font-size: 18px;
  }

  .filters {
    padding: 12px;
  }
}
</style>


