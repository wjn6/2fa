<template>
  <div class="logs p-16">
    <div class="page-header">
      <h1>使用日志</h1>
    </div>

    <t-table :data="logs" :columns="columns" style="margin-top: 16px;" stripe hover>
      <template #action="{ row }">
        {{ row.action }}
      </template>
    </t-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '../../api'

const logs = ref([])

const columns = [
  { colKey: 'id', title: 'ID', width: 80 },
  { colKey: 'secret_name', title: '密钥名称' },
  { colKey: 'action', title: '操作' },
  { colKey: 'created_at', title: '时间', width: 200 }
]

const loadLogs = async () => {
  try {
    const res = await adminApi.getUsageLogs({ limit: 100 })
    logs.value = res.data.data.logs
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.page-header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
</style>
