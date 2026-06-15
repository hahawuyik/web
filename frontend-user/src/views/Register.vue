<template>
  <div class="auth-container">
    <el-card class="glass-card">
      <h2>注册</h2>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="用户名"
            @input="onTyping"
          />
        </el-form-item>
        <el-form-item prop="email">
          <el-input
            v-model="form.email"
            placeholder="邮箱"
            @input="onTyping"
          />
        </el-form-item>
        <el-form-item prop="mobile">
          <el-input
            v-model="form.mobile"
            placeholder="手机号"
            @input="onTyping"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            type="password"
            v-model="form.password"
            placeholder="密码"
            @input="onTyping"
          />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input
            type="password"
            v-model="form.confirmPassword"
            placeholder="确认密码"
            @input="onTyping"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister" :loading="loading" block>注册</el-button>
        </el-form-item>
        <div class="auth-links">
          <router-link to="/login">已有账号？去登录</router-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import confetti from 'canvas-confetti'

const userStore = useUserStore()
const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({ username: '', email: '', mobile: '', password: '', confirmPassword: '' })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [{ validator: (rule, value, cb) => value === form.password ? cb() : cb(new Error('两次密码不一致')), trigger: 'blur' }]
}

// 获取光标在单行 input 中的屏幕坐标（返回 origin 所需的比例值）
const getCursorScreenPosition = (inputEl) => {
  if (!inputEl) return null
  const rect = inputEl.getBoundingClientRect()
  const value = inputEl.value
  const selectionStart = inputEl.selectionStart
  const textBeforeCursor = value.slice(0, selectionStart)

  // 创建隐藏 span 测量文本宽度
  const span = document.createElement('span')
  span.style.position = 'absolute'
  span.style.visibility = 'hidden'
  span.style.whiteSpace = 'pre'
  span.style.font = window.getComputedStyle(inputEl).font
  span.style.letterSpacing = window.getComputedStyle(inputEl).letterSpacing
  span.style.padding = window.getComputedStyle(inputEl).padding
  span.textContent = textBeforeCursor || ' '
  document.body.appendChild(span)

  const textWidth = span.offsetWidth
  document.body.removeChild(span)

  // 获取输入框内文字的左侧内边距和边框
  const computedStyle = window.getComputedStyle(inputEl)
  const paddingLeft = parseFloat(computedStyle.paddingLeft)
  const borderLeft = parseFloat(computedStyle.borderLeftWidth)

  const cursorX = rect.left + paddingLeft + borderLeft + textWidth
  const cursorY = rect.top + rect.height / 2   // 光标垂直居中

  return {
    x: cursorX / window.innerWidth,
    y: cursorY / window.innerHeight
  }
}

// 打字烟花：跟随光标位置
const onTyping = () => {
  const activeEl = document.activeElement
  // 确保聚焦的是真正的输入框
  if (!activeEl || !activeEl.matches('input, textarea')) return

  const pos = getCursorScreenPosition(activeEl)
  if (!pos) return

  confetti({
    particleCount: 10,
    spread: 40,
    origin: pos,
    startVelocity: 8,
    colors: ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93']
  })
}

const handleRegister = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    await userStore.register(form)
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '注册失败')
  } finally {
    loading.value = false
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
  width: 400px;
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