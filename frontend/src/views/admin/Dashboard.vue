<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>统计仪表盘</h1>
      <t-space>
        <span class="update-time">最后更新：{{ updateTime }}</span>
        <t-button variant="outline" size="small" @click="refreshData" :loading="loading">
          <template #icon><t-icon name="refresh" /></template>
          刷新
        </t-button>
      </t-space>
    </div>
    
    <t-loading :loading="loading" size="large">
      <!-- 统计卡片 -->
      <t-row :gutter="[16, 16]" class="stats-row">
        <t-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <t-card hover-shadow class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <t-icon name="secured" size="24px" />
              </div>
              <div class="stat-info">
                <div class="stat-label">密钥总数</div>
                <div class="stat-value">{{ stats.totalSecrets || 0 }}</div>
              </div>
            </div>
          </t-card>
        </t-col>
      <t-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <t-card hover-shadow class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <t-icon name="folder" size="24px" />
            </div>
            <div class="stat-info">
              <div class="stat-label">分类总数</div>
              <div class="stat-value">{{ stats.totalCategories || 0 }}</div>
            </div>
          </div>
        </t-card>
      </t-col>
      <t-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <t-card hover-shadow class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <t-icon name="discount" size="24px" />
            </div>
            <div class="stat-info">
              <div class="stat-label">标签总数</div>
              <div class="stat-value">{{ stats.totalTags || 0 }}</div>
            </div>
          </div>
        </t-card>
      </t-col>
      <t-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <t-card hover-shadow class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <t-icon name="user" size="24px" />
            </div>
            <div class="stat-info">
              <div class="stat-label">用户总数</div>
              <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
            </div>
          </div>
        </t-card>
      </t-col>
    </t-row>

      <!-- 最常使用密钥表格 -->
      <t-card title="最常使用密钥" class="table-card">
        <t-table 
          :data="stats.topSecrets || []" 
          :columns="columns"
          :max-height="400"
          stripe
          hover
          :empty="'暂无数据'"
        />
      </t-card>
    </t-loading>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { adminApi } from '../../api'

const stats = ref({})
const loading = ref(false)
const updateTime = ref('刚刚')

const columns = [
  { colKey: 'name', title: '名称', width: 200 },
  { colKey: 'issuer', title: '发行者', width: 150 },
  { colKey: 'use_count', title: '使用次数', width: 120, align: 'center' }
]

const loadStats = async () => {
  loading.value = true
  try {
    const res = await adminApi.getStatistics()
    stats.value = res.data.data || {}
    updateTime.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  } catch (error) {
    console.error('加载统计数据失败:', error)
    MessagePlugin.error(error.response?.data?.message || '加载统计数据失败')
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await loadStats()
  MessagePlugin.success('数据已刷新')
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dashboard-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

[theme-mode="dark"] .dashboard-header h1 {
  color: #e5e5e5;
}

.update-time {
  font-size: 13px;
  color: #999;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

[theme-mode="dark"] .stat-value {
  color: #e5e5e5;
}

/* 表格卡片 */
.table-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 24px var(--shadow-light);
}

/* 响应式 */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .dashboard-header h1 {
    font-size: 20px;
  }

  .stats-row {
    margin-bottom: 16px;
  }

  .stat-content {
    padding: 4px 0;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
  }

  .stat-label {
    font-size: 12px;
  }

  .stat-value {
    font-size: 24px;
  }

  .table-card {
    border-radius: 10px;
  }

  /* 表格横向滚动 */
  .table-card :deep(.t-table) {
    min-width: 500px;
  }
}

@media (max-width: 375px) {
  .dashboard-header h1 {
    font-size: 18px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: 20px;
  }
}
</style>

