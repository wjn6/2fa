<template>
  <div class="users">
    <div class="page-header">
      <h1>用户管理</h1>
      <t-button theme="primary" @click="showAddDialog">
        <template #icon><t-icon name="add" /></template>
        添加用户
      </t-button>
    </div>

    <t-table :data="users" :columns="columns" style="margin-top: 24px;">
      <template #operation="{ row }">
        <t-space>
          <t-button size="small" @click="editUser(row)">编辑</t-button>
          <t-button size="small" theme="danger" @click="deleteUser(row)">删除</t-button>
        </t-space>
      </template>
    </t-table>

    <t-dialog v-model:visible="dialogVisible" :header="dialogTitle" @confirm="handleSubmit">
      <t-form :data="form">
        <t-form-item label="用户名">
          <t-input v-model="form.username" />
        </t-form-item>
        <t-form-item label="密码" v-if="!form.id">
          <t-input v-model="form.password" type="password" />
        </t-form-item>
        <t-form-item label="邮箱">
          <t-input v-model="form.email" />
        </t-form-item>
        <t-form-item label="角色">
          <t-select v-model="form.role">
            <t-option value="admin" label="管理员" />
            <t-option value="user" label="普通用户" />
          </t-select>
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { adminApi } from '../../api'

const users = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = ref({})

const columns = [
  { colKey: 'username', title: '用户名' },
  { colKey: 'email', title: '邮箱' },
  { colKey: 'role', title: '角色' },
  { colKey: 'operation', title: '操作', width: 200 }
]

const loadUsers = async () => {
  try {
    const res = await adminApi.getUsers()
    users.value = res.data.data
  } catch (error) {
    console.error(error)
  }
}

const showAddDialog = () => {
  dialogTitle.value = '添加用户'
  form.value = { username: '', password: '', email: '', role: 'user' }
  dialogVisible.value = true
}

const editUser = (user) => {
  dialogTitle.value = '编辑用户'
  form.value = { ...user }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    if (form.value.id) {
      await adminApi.updateUser(form.value.id, form.value)
    } else {
      await adminApi.createUser(form.value)
    }
    MessagePlugin.success('操作成功')
    loadUsers()
    dialogVisible.value = false
  } catch (error) {
    console.error(error)
  }
}

const deleteUser = async (user) => {
  try {
    await adminApi.deleteUser(user.id)
    MessagePlugin.success('删除成功')
    loadUsers()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

