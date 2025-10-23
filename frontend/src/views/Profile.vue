<template>
  <div class="profile-page">
    <!-- 头部 -->
    <div class="header">
      <div class="header-content">
        <div class="back-btn" @click="$router.back()">
          <t-icon name="chevron-left" size="20px" />
          <span>返回</span>
        </div>
        <h1>个人中心</h1>
      </div>
    </div>

    <div class="profile-content app-container">
      <!-- 用户信息卡片 -->
      <div class="info-section">
        <div class="section-title">
          <t-icon name="user" />
          <span>基本信息</span>
        </div>
        <div class="info-card app-card">
          <div class="avatar-section">
            <div class="avatar">
              <t-icon name="user" size="40px" />
            </div>
            <div class="user-info">
              <div class="username">{{ currentUser?.username }}</div>
              <div class="role-badge" :class="currentUser?.role">
                {{ currentUser?.role === 'admin' ? '管理员' : '普通用户' }}
              </div>
            </div>
          </div>

          <t-divider />

          <div class="info-item">
            <div class="item-label">
              <t-icon name="mail" />
              <span>邮箱</span>
            </div>
            <div class="item-value">
              <span v-if="!editingEmail">{{ currentUser?.email || '未设置' }}</span>
              <t-input 
                v-else 
                v-model="emailForm.email" 
                placeholder="请输入邮箱"
                style="width: 300px;"
              />
              <t-button 
                v-if="!editingEmail" 
                theme="default" 
                size="small" 
                @click="startEditEmail"
              >
                修改
              </t-button>
              <t-space v-else size="small">
                <t-button theme="primary" size="small" @click="handleUpdateEmail">保存</t-button>
                <t-button theme="default" size="small" @click="cancelEditEmail">取消</t-button>
              </t-space>
            </div>
          </div>

          <div class="info-item">
            <div class="item-label">
              <t-icon name="time" />
              <span>注册时间</span>
            </div>
            <div class="item-value">
              {{ formatDate(currentUser?.created_at) }}
            </div>
          </div>

          <div class="info-item">
            <div class="item-label">
              <t-icon name="login" />
              <span>最后登录</span>
            </div>
            <div class="item-value">
              {{ formatDate(currentUser?.last_login) }}
            </div>
          </div>

          <div class="info-item">
            <div class="item-label">
              <t-icon name="chart-line" />
              <span>登录次数</span>
            </div>
            <div class="item-value">
              {{ currentUser?.login_count || 0 }} 次
            </div>
          </div>
        </div>
      </div>

      <!-- 安全设置 -->
      <div class="security-section">
        <div class="section-title">
          <t-icon name="lock-on" />
          <span>安全设置</span>
        </div>
        <div class="security-card app-card">
          <div class="security-item" @click="showChangePasswordDialog">
            <div class="item-left">
              <t-icon name="secured" class="item-icon" />
              <div class="item-info">
                <div class="item-title">修改密码</div>
                <div class="item-desc">定期修改密码可以提高账号安全性</div>
              </div>
            </div>
            <t-icon name="chevron-right" />
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <div class="section-title">
          <t-icon name="chart-pie" />
          <span>我的统计</span>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <t-icon name="lock-on" size="24px" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.secretCount }}</div>
              <div class="stat-label">密钥数量</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <t-icon name="folder" size="24px" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.categoryCount }}</div>
              <div class="stat-label">分类数量</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <t-icon name="tag" size="24px" />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.tagCount }}</div>
              <div class="stat-label">标签数量</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <t-dialog
      v-model:visible="changePasswordVisible"
      header="修改密码"
      width="500px"
      :confirm-btn="{ content: '确定', theme: 'primary', loading: passwordLoading }"
      :cancel-btn="{ content: '取消' }"
      @confirm="handleChangePassword"
    >
      <t-form ref="passwordFormRef" :data="passwordForm" :rules="passwordRules" label-width="80px">
        <t-form-item label="旧密码" name="oldPassword">
          <t-input 
            v-model="passwordForm.oldPassword" 
            type="password" 
            placeholder="请输入当前密码"
            clearable
          />
        </t-form-item>
        <t-form-item label="新密码" name="newPassword">
          <t-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="至少6个字符"
            clearable
          />
        </t-form-item>
        <t-form-item label="确认密码" name="confirmPassword">
          <t-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="再次输入新密码"
            clearable
          />
        </t-form-item>
      </t-form>
      <t-alert theme="info" message="温馨提示：修改密码后需要重新登录" style="margin-top: 16px;" />
    </t-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useAppStore } from '../stores/app'
import { userApi, secretApi, categoryApi, tagApi } from '../api'

const router = useRouter()
const appStore = useAppStore()

const currentUser = ref(null)
const editingEmail = ref(false)
const emailForm = ref({ email: '' })
const changePasswordVisible = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref(null)
const stats = ref({
  secretCount: 0,
  categoryCount: 0,
  tagCount: 0
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码' }],
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: 6, message: '密码至少6个字符' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码' },
    {
      validator: (val) => val === passwordForm.value.newPassword,
      message: '两次输入的密码不一致'
    }
  ]
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取当前用户信息
const fetchCurrentUser = async () => {
  try {
    const res = await userApi.getCurrentUser()
    if (res.data.success) {
      currentUser.value = res.data.data
      emailForm.value.email = res.data.data.email || ''
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    MessagePlugin.error('获取用户信息失败')
  }
}

// 获取统计信息
const fetchStats = async () => {
  try {
    const [secretRes, categoryRes, tagRes] = await Promise.all([
      secretApi.getAll(),
      categoryApi.getAll(),
      tagApi.getAll()
    ])
    
    stats.value = {
      secretCount: secretRes.data.data?.length || 0,
      categoryCount: categoryRes.data.data?.length || 0,
      tagCount: tagRes.data.data?.length || 0
    }
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// 开始编辑邮箱
const startEditEmail = () => {
  editingEmail.value = true
  emailForm.value.email = currentUser.value?.email || ''
}

// 取消编辑邮箱
const cancelEditEmail = () => {
  editingEmail.value = false
  emailForm.value.email = currentUser.value?.email || ''
}

// 更新邮箱
const handleUpdateEmail = async () => {
  try {
    const res = await userApi.updateProfile({ email: emailForm.value.email })
    if (res.data.success) {
      MessagePlugin.success('邮箱更新成功')
      editingEmail.value = false
      await fetchCurrentUser()
    }
  } catch (error) {
    console.error('更新邮箱失败:', error)
    MessagePlugin.error(error.response?.data?.message || '更新邮箱失败')
  }
}

// 显示修改密码对话框
const showChangePasswordDialog = () => {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  changePasswordVisible.value = true
}

// 修改密码
const handleChangePassword = async () => {
  // 验证表单
  const valid = await passwordFormRef.value.validate()
  if (!valid) return

  passwordLoading.value = true
  try {
    const res = await userApi.changePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    
    if (res.data.success) {
      MessagePlugin.success('密码修改成功，请重新登录')
      changePasswordVisible.value = false
      
      // 延迟后退出登录
      setTimeout(() => {
        appStore.logout()
        router.push('/login')
      }, 1500)
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    MessagePlugin.error(error.response?.data?.message || '修改密码失败')
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  fetchCurrentUser()
  fetchStats()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f5f5f5;
}

[theme-mode="dark"] .profile-page {
  background: #1a1a1a;
}

/* 头部 */
.header {
  background: white;
  border-bottom: 1px solid #e5e5e5;
  position: sticky;
  top: 0;
  z-index: 100;
}

[theme-mode="dark"] .header {
  background: #2a2a2a;
  border-bottom-color: #3a3a3a;
}

.header-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
  font-size: 14px;
}

.back-btn:hover {
  color: #0052d9;
}

[theme-mode="dark"] .back-btn {
  color: #999;
}

[theme-mode="dark"] .back-btn:hover {
  color: #4dabf7;
}

.header-content h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

[theme-mode="dark"] .header-content h1 {
  color: #e5e5e5;
}

/* 内容区 */
.profile-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 12px;
  padding-left: 4px;
}

[theme-mode="dark"] .section-title {
  color: #999;
}

/* 用户信息卡片 */
.info-section {
  margin-bottom: 24px;
}

.info-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e7e7e7;
  padding: 24px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02);
}

[theme-mode="dark"] .info-card {
  background: #2a2a2a;
  border-color: #3a3a3a;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

[theme-mode="dark"] .username {
  color: #e5e5e5;
}

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.admin {
  background: #fff1f0;
  color: #cf1322;
}

.role-badge.user {
  background: #e6f7ff;
  color: #0052d9;
}

[theme-mode="dark"] .role-badge.admin {
  background: #2a1215;
  color: #ff7875;
}

[theme-mode="dark"] .role-badge.user {
  background: #111d2c;
  color: #4dabf7;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.info-item:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

[theme-mode="dark"] .info-item:not(:last-child) {
  border-bottom-color: #3a3a3a;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

[theme-mode="dark"] .item-label {
  color: #999;
}

.item-value {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #333;
  font-size: 14px;
}

[theme-mode="dark"] .item-value {
  color: #e5e5e5;
}

/* 安全设置 */
.security-section {
  margin-bottom: 24px;
}

.security-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e7e7e7;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02);
}

[theme-mode="dark"] .security-card {
  background: #2a2a2a;
  border-color: #3a3a3a;
}

.security-item {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}

.security-item:hover {
  background: #f5f5f5;
}

[theme-mode="dark"] .security-item:hover {
  background: #333;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.item-icon {
  color: #0052d9;
  font-size: 24px;
}

[theme-mode="dark"] .item-icon {
  color: #4dabf7;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

[theme-mode="dark"] .item-title {
  color: #e5e5e5;
}

.item-desc {
  font-size: 13px;
  color: #999;
}

/* 统计信息 */
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e7e7e7;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.02);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

[theme-mode="dark"] .stat-card {
  background: #2a2a2a;
  border-color: #3a3a3a;
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
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  line-height: 1;
  margin-bottom: 4px;
}

[theme-mode="dark"] .stat-value {
  color: #e5e5e5;
}

.stat-label {
  font-size: 13px;
  color: #999;
}

/* 响应式 */
@media (max-width: 768px) {
  .profile-content {
    padding: 16px 12px;
  }

  .info-card {
    padding: 20px 16px;
  }

  .avatar {
    width: 64px;
    height: 64px;
  }

  .username {
    font-size: 20px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .item-value {
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
}
</style>


