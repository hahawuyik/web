<template>
  <div class="container">
    <el-card class="glass-card">
      <div class="profile-header">
        <el-avatar :size="100" :src="profileAvatar" />
        <div class="profile-info">
          <h2>{{ userInfo?.username }}</h2>
          <p><strong>积分：</strong>{{ userInfo?.points || 0 }} | <strong>等级：</strong>{{ userInfo?.level || 'Lv.1' }}</p>
          <p><strong>签名：</strong>{{ userInfo?.signature || '暂无' }}</p>
          <p v-if="userInfo?.created_at"><strong>注册时间：</strong>{{ formatTime(userInfo.created_at) }}</p>
          <p v-if="userInfo?.last_login"><strong>最近登录：</strong>{{ formatTime(userInfo.last_login) }}</p>
        </div>
        <div class="button-group">
          <el-button @click="$router.push('/profile/edit')">编辑资料</el-button>
          <el-button type="primary" @click="openChangePasswordDialog">修改密码</el-button>
          <el-button type="success" @click="$router.push('/weekly-report')">情绪周报</el-button>
        </div>
      </div>
      <el-divider />
      <div class="profile-bio">
        <h3>个人介绍</h3>
        <p>{{ userInfo?.bio || '这个人很懒，什么都没写' }}</p>
      </div>
    </el-card>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input type="password" v-model="passwordForm.oldPassword" placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input type="password" v-model="passwordForm.newPassword" placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input type="password" v-model="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="changePassword" :loading="changingPwd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { updatePassword } from '@/api/user'
import dayjs from 'dayjs'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)

const profileAvatar = computed(() => {
  const avatar = userInfo.value?.avatar
  if (!avatar) return '/default-avatar.png'
  const timestamp = Date.now()
  const connector = avatar.includes('?') ? '&' : '?'
  return `${avatar}${connector}t=${timestamp}`
})

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

// 修改密码相关
const passwordDialogVisible = ref(false)
const changingPwd = ref(false)
const passwordFormRef = ref()
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: (rule, value, cb) => value === passwordForm.value.newPassword ? cb() : cb(new Error('两次输入密码不一致')), trigger: 'blur' }
  ]
}

const openChangePasswordDialog = () => {
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  passwordDialogVisible.value = true
}

const changePassword = async () => {
  await passwordFormRef.value.validate()
  changingPwd.value = true
  try {
    await updatePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    await userStore.logout()
    // 跳转到登录页
    window.location.href = '/login'
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '修改失败')
  } finally {
    changingPwd.value = false
  }
}
</script>

<style scoped>
.container {
  min-height: calc(100vh - 60px);
  padding: 20px;
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.glass-card {
  width: 900px;
  min-height: 500px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 28px !important;
  box-shadow: 0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,182,193,0.35), 0 8px 32px rgba(0,0,0,0.12) !important;
  overflow: hidden;
}

:deep(.el-card__body) {
  background: transparent !important;
  width: 100%;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.profile-info {
  flex: 1;
}
.profile-info h2 {
  margin: 0 0 12px 0;
}
.profile-info p {
  margin: 6px 0;
  color: #555;
}
.button-group {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.profile-bio {
  margin-top: 20px;
}
.profile-bio h3 {
  margin: 0 0 12px 0;
}
.profile-bio p {
  line-height: 1.6;
  color: #444;
}
.el-divider {
  margin: 24px 0;
}
</style>