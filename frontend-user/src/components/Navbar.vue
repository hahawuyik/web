<template>
  <el-header class="navbar">
    <div class="container">
      <div class="logo">
        <router-link to="/">
          <!-- 替换文字为图片 logo -->
          <img :src="logoUrl" alt="春之语" class="logo-img" />
        </router-link>
      </div>
      <div class="nav-links">
        <router-link to="/">首页</router-link>
        <router-link v-if="userStore.userInfo" to="/post/create">发帖 </router-link>
        <router-link v-if="userStore.userInfo" to="/search">搜索 </router-link>
        <router-link v-if="userStore.userInfo" to="/encounter">邂逅 </router-link>
        <el-dropdown v-if="userStore.userInfo">
          <span class="user-dropdown">
            <el-avatar :size="32" :src="avatarUrl" />
            {{ userStore.userInfo.username }}
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="$router.push('/profile')">个人中心</el-dropdown-item>
              <el-dropdown-item @click="$router.push('/my-posts')">我的帖子</el-dropdown-item>
              <el-dropdown-item @click="$router.push('/my-replies')">我的回复</el-dropdown-item>
              <el-dropdown-item @click="$router.push('/my-favorites')">我的收藏</el-dropdown-item>
              <el-dropdown-item @click="$router.push('/notifications')">消息通知</el-dropdown-item>
              <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <template v-else>
          <router-link to="/login">登录</router-link>
          <router-link to="/register">注册</router-link>
        </template>
      </div>
    </div>
  </el-header>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

// 引入 logo 图片（请根据实际路径调整）
// 方法1（推荐）：将图片放在 src/assets 目录下，使用 import 引入
import logoImg from '@/assets/春之语论坛Logo设计.png'
// 方法2（备选）：如果放在 public 目录下，可直接使用 '/logo.png' 字符串
// 这里使用方法1，若路径报错请检查文件名是否正确或改用方法2
const logoUrl = logoImg

const userStore = useUserStore()
const router = useRouter()

// 头像地址：默认占位图 + 防缓存时间戳
const avatarUrl = computed(() => {
  const avatar = userStore.userInfo?.avatar
  if (!avatar) return '/default-avatar.png'   // 默认头像路径，请将图片放在 public 目录

  // 添加时间戳防止缓存，处理已有参数的情况
  const timestamp = Date.now()
  const connector = avatar.includes('?') ? '&' : '?'
  return `${avatar}${connector}t=${timestamp}`
})

const logout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/')
}
</script>

<style scoped>
.navbar {
  background-color: #e9f9f9;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}
.navbar .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}
.logo {
  display: flex;
  align-items: center;
  line-height: 0; /* 消除图片下方空隙 */
}
.logo-img {
  height: 80px;      /* 控制 logo 高度，与原来24px文字视觉平衡 */
  width: auto;       /* 宽度自适应，保持比例 */
  vertical-align: middle;
  display: block;
}
/* 移除了原 .logo a 的字体样式，图片不需要 */
.nav-links {
  display: flex;
  gap: 20px;
  align-items: center;
}
.nav-links a {
  color: #333;
}
.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
</style>