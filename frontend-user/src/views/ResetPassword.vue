<template>
  <div class="auth-container">
    <el-card class="glass-card">
      <h2>{{ step === 1 ? '找回密码' : '重置密码' }}</h2>
      <el-form v-if="step === 1" :model="form1" :rules="rules1" ref="form1Ref">
        <el-form-item prop="email">
          <el-input v-model="form1.email" placeholder="注册邮箱" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="sendResetCode" :loading="sending">发送重置邮件</el-button>
        </el-form-item>
        <div class="auth-links">
          <router-link to="/login">返回登录</router-link>
        </div>
      </el-form>
      <el-form v-else :model="form2" :rules="rules2" ref="form2Ref">
        <el-form-item prop="token">
          <el-input v-model="form2.token" placeholder="重置令牌（邮件中的token）" />
        </el-form-item>
        <el-form-item prop="newPassword">
          <el-input type="password" v-model="form2.newPassword" placeholder="新密码" />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input type="password" v-model="form2.confirmPassword" placeholder="确认新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleResetPassword" :loading="resetting">重置密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { forgotPassword, resetPassword as resetPasswordApi } from '@/api/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const step = ref(1)
const sending = ref(false)
const resetting = ref(false)
const form1Ref = ref()
const form2Ref = ref()

const form1 = reactive({ email: '' })
const rules1 = {
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式错误' }]
}

const form2 = reactive({ token: '', newPassword: '', confirmPassword: '' })
const rules2 = {
  token: [{ required: true, message: '请输入重置令牌' }],
  newPassword: [{ required: true, message: '请输入新密码', min: 6 }],
  confirmPassword: [{ validator: (rule, value, cb) => value === form2.newPassword ? cb() : cb(new Error('两次密码不一致')) }]
}

const sendResetCode = async () => {
  await form1Ref.value.validate()
  sending.value = true
  try {
    await forgotPassword({ email: form1.email })
    ElMessage.success('重置邮件已发送，请查收邮件中的 token')
    step.value = 2
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '发送失败')
  } finally {
    sending.value = false
  }
}

const handleResetPassword = async () => {
  await form2Ref.value.validate()
  resetting.value = true
  try {
    await resetPasswordApi({ token: form2.token, newPassword: form2.newPassword })
    ElMessage.success('密码重置成功，请登录')
    router.push('/login')
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '重置失败')
  } finally {
    resetting.value = false
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.glass-card {
  width: 520px;
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
}

:deep(.el-card__body) {
  background: transparent !important;
}
</style>