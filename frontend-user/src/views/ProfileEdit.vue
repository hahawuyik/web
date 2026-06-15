<template>
  <div class="container">
    <el-card class="glass-card">
      <h2>编辑资料</h2>
      <el-form :model="form" label-width="80px" class="edit-form">
        <el-form-item label="头像">
          <div class="avatar-upload-row">
            <el-upload action="#" :auto-upload="false" :on-change="handleAvatarChange" :limit="1">
              <el-button>选择图片</el-button>
            </el-upload>
            <el-button type="primary" @click="uploadAvatar" :loading="avatarLoading">上传头像</el-button>
          </div>
        </el-form-item>
        <el-form-item label="签名" class="signature-item">
          <el-input 
            type="textarea"
            v-model="form.signature" 
            maxlength="200" 
            show-word-limit 
            :rows="4"
            class="long-input"
          />
        </el-form-item>
        <el-form-item label="个人介绍" class="bio-item">
          <el-input 
            type="textarea" 
            v-model="form.bio" 
            rows="12" 
            class="long-textarea"
          />
        </el-form-item>
        <el-form-item class="btn-item">
          <el-button type="primary" @click="saveProfile" :loading="saving">保存</el-button>
          <el-button @click="$router.back()">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { updateProfile, updateAvatar } from '@/api/user'

const userStore = useUserStore()
const form = reactive({ signature: '', bio: '' })
const avatarFile = ref(null)
const avatarLoading = ref(false)
const saving = ref(false)

onMounted(() => {
  form.signature = userStore.userInfo?.signature || ''
  form.bio = userStore.userInfo?.bio || ''
})

const handleAvatarChange = (file) => {
  avatarFile.value = file.raw
}

const uploadAvatar = async () => {
  if (!avatarFile.value) return ElMessage.warning('请选择图片')
  avatarLoading.value = true
  try {
    const res = await updateAvatar(avatarFile.value)
    ElMessage.success('头像更新成功')
    if (res.avatar)
  {
      userStore.userInfo.avatar = res.avatar
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      storedUser.avatar = res.avatar
      localStorage.setItem('user', JSON.stringify(storedUser))
  }
    await userStore.fetchProfile()
  } finally {
    avatarLoading.value = false
  }
}

const saveProfile = async () => {
  saving.value = true
  try {
    await updateProfile(form)
    ElMessage.success('资料更新成功')
    await userStore.fetchProfile()
  } finally {
    saving.value = false
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
  min-height: 700px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 28px !important;
  box-shadow:
    0 0 20px rgba(255, 255, 255, 0.5),
    0 0 40px rgba(255, 182, 193, 0.35),
    0 8px 32px rgba(0, 0, 0, 0.12) !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

:deep(.el-card__body) {
  background: transparent !important;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.glass-card h2 {
  margin-top: 0;
  margin-bottom: 30px;
  text-align: center;
}

.edit-form {
  width: 100%;
  max-width: 100%;
}

/* 头像上传按钮对齐 */
.avatar-upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 签名输入框拉长 */
.signature-item :deep(.el-textarea__inner) {
  width: 100%;
  min-height: 120px;
  resize: vertical;
}

/* 个人介绍文本域拉长 */
.bio-item :deep(.el-textarea__inner) {
  width: 100%;
  min-height: 320px;
  resize: vertical;
}

/* 按钮行贴底，去掉底部margin */
.btn-item {
  margin-bottom: 0 !important;
}

/* 调整表单标签和内容的间距 */
:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}
</style>