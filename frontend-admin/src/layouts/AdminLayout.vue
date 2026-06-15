<template>
  <el-container class="admin-container">
    <el-aside :width="sidebarWidth" class="admin-sidebar">
      <Sidebar />
    </el-aside>
    <el-container>
      <el-header class="admin-header">
        <div class="header-left">
          <el-button :icon="Menu" @click="toggleSidebar" text />
          <Breadcrumb />
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="userInfo.avatar || '/default-avatar.png'" />
              <span>{{ userInfo.username }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Menu } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import Sidebar from './Sidebar.vue'
import Breadcrumb from '@/components/Breadcrumb.vue'

const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()

const sidebarWidth = computed(() => appStore.sidebarCollapsed ? '64px' : '220px')

const toggleSidebar = () => {
  appStore.toggleSidebar()
}

const handleCommand = (cmd) => {
  if (cmd === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}

const userInfo = computed(() => userStore.userInfo)
</script>

<style scoped>
.admin-container {
  height: 100vh;
}
.admin-sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow-x: hidden;
}
.admin-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.header-right {
  cursor: pointer;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.admin-main {
  background-color: #f0f2f6;
  padding: 20px;
}
</style>