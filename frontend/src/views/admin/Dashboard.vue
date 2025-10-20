<template>
  <div class="dashboard">
    <h1>统计仪表盘</h1>
    
    <t-row :gutter="16" style="margin-top: 24px;">
      <t-col :span="6">
        <t-card title="密钥总数" hover-shadow>
          <h2>{{ stats.totalSecrets || 0 }}</h2>
        </t-card>
      </t-col>
      <t-col :span="6">
        <t-card title="分类总数" hover-shadow>
          <h2>{{ stats.totalCategories || 0 }}</h2>
        </t-card>
      </t-col>
      <t-col :span="6">
        <t-card title="标签总数" hover-shadow>
          <h2>{{ stats.totalTags || 0 }}</h2>
        </t-card>
      </t-col>
      <t-col :span="6">
        <t-card title="用户总数" hover-shadow>
          <h2>{{ stats.totalUsers || 0 }}</h2>
        </t-card>
      </t-col>
    </t-row>

    <t-card title="最常使用密钥" style="margin-top: 24px;">
      <t-table :data="stats.topSecrets || []" :columns="columns" />
    </t-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '../../api'

const stats = ref({})
const columns = [
  { colKey: 'name', title: '名称' },
  { colKey: 'issuer', title: '发行者' },
  { colKey: 'use_count', title: '使用次数' }
]

const loadStats = async () => {
  try {
    const res = await adminApi.getStatistics()
    stats.value = res.data.data
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard h2 {
  font-size: 32px;
  color: #1890ff;
  margin: 0;
}
</style>

