<template>
  <div class="auth-container">
    <el-card class="auth-card">
      <h2>登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="account">
          <el-input
            v-model="form.account"
            placeholder="用户名/邮箱/手机号"
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
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" block>登录</el-button>
        </el-form-item>
        <div class="auth-links">
          <router-link to="/register">注册账号</router-link>
          <router-link to="/reset-password">忘记密码？</router-link>
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

const form = reactive({ account: '', password: '' })
const rules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
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
  const cursorY = rect.top + rect.height / 2   // 光标垂直居中，也可以取 rect.top + 某个偏移

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
    particleCount: 8,
    spread: 40,
    origin: pos,
    startVelocity: 8,
    colors: ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93']
  })
}

const handleLogin = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const success = await userStore.login(form.account, form.password)
    if (success) {
      ElMessage.success('登录成功')
      router.push('/')
    } else {
      ElMessage.error('账号或密码错误')
    }
  } catch {
    ElMessage.error('登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
}
.auth-card {
  position: relative;
  z-index: 20;
  width: 520px;
  padding: 40px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(12px);
  border-radius: 28px;
  border: 2px solid rgba(255,255,255,0.5);
  box-shadow:
    0 0 20px rgba(255,255,255,0.5),
    0 0 40px rgba(255,182,193,0.35),
    0 8px 32px rgba(0,0,0,0.12);
  overflow: hidden;
}
.auth-links {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
</style>