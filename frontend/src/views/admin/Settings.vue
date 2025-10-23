<template>
  <div class="settings p-16">
    <div class="page-header">
      <h1>系统设置</h1>
    </div>

    <t-card title="自动备份" style="margin-top: 24px;">
      <t-form>
        <t-form-item label="启用自动备份">
          <t-switch v-model="settings.auto_backup_enabled" />
        </t-form-item>
        <t-form-item label="备份间隔（小时）">
          <t-input-number v-model="settings.auto_backup_interval" :min="1" :max="168" />
        </t-form-item>
      </t-form>
    </t-card>

    <t-card title="自动锁定" style="margin-top: 24px;">
      <t-form>
        <t-form-item label="启用自动锁定">
          <t-switch v-model="settings.auto_lock_enabled" />
        </t-form-item>
        <t-form-item label="锁定超时（分钟）">
          <t-input-number v-model="settings.auto_lock_timeout" :min="1" :max="60" />
        </t-form-item>
      </t-form>
    </t-card>

    <div style="margin-top: 16px;">
      <t-button theme="primary" @click="saveSettings">保存设置</t-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { adminApi } from '../../api'

const settings = ref({
  auto_backup_enabled: false,
  auto_backup_interval: 24,
  auto_lock_enabled: true,
  auto_lock_timeout: 15
})

const loadSettings = async () => {
  try {
    const res = await adminApi.getSettings()
    const data = res.data.data
    settings.value = {
      auto_backup_enabled: data.auto_backup_enabled?.value === 'true',
      auto_backup_interval: parseInt(data.auto_backup_interval?.value || 24),
      auto_lock_enabled: data.auto_lock_enabled?.value === 'true',
      auto_lock_timeout: parseInt(data.auto_lock_timeout?.value || 15)
    }
  } catch (error) {
    console.error(error)
  }
}

const saveSettings = async () => {
  try {
    await adminApi.updateSettings({
      auto_backup_enabled: settings.value.auto_backup_enabled.toString(),
      auto_backup_interval: settings.value.auto_backup_interval.toString(),
      auto_lock_enabled: settings.value.auto_lock_enabled.toString(),
      auto_lock_timeout: settings.value.auto_lock_timeout.toString()
    })
    MessagePlugin.success('保存成功')
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.page-header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
</style>