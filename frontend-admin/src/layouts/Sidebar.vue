<template>
  <div class="sidebar-logo" :class="{ collapsed: appStore.sidebarCollapsed }">
    <span v-if="!appStore.sidebarCollapsed">论坛后台</span>
    <span v-else>后台</span>
  </div>
  <el-menu
    :collapse="appStore.sidebarCollapsed"
    :collapse-transition="false"
    :default-active="activeMenu"
    router
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409EFF"
  >
    <el-menu-item index="/dashboard">
      <el-icon><DataLine /></el-icon>
      <span>仪表盘</span>
    </el-menu-item>
    <el-menu-item index="/users" v-if="userStore.userInfo.role === 'admin'">
      <el-icon><User /></el-icon>
      <span>用户管理</span>
    </el-menu-item>
    <el-menu-item index="/posts">
      <el-icon><Document /></el-icon>
      <span>帖子管理</span>
    </el-menu-item>
    <el-menu-item index="/replies">
      <el-icon><ChatDotRound /></el-icon>
      <span>回复管理</span>
    </el-menu-item>
    <el-menu-item index="/reports">
      <el-icon><Warning /></el-icon>
      <span>举报处理</span>
    </el-menu-item>
    <el-menu-item index="/ai-assistants" v-if="userStore.userInfo.role === 'admin'">
      <el-icon><Cpu /></el-icon>
      <span>AI助手管理</span>
    </el-menu-item>
    <el-menu-item index="/forums">
      <el-icon><Grid /></el-icon>
      <span>版块管理</span>
    </el-menu-item>
    <el-menu-item index="/settings" v-if="userStore.userInfo.role === 'admin'">
      <el-icon><Setting /></el-icon>
      <span>系统设置</span>
    </el-menu-item>
    <el-menu-item index="/notifications" v-if="userStore.userInfo.role === 'admin'">
      <el-icon><Bell /></el-icon>
      <span>公告通知</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { DataLine, User, Document, ChatDotRound, Warning, Grid, Setting, Bell, Cpu } from '@element-plus/icons-vue'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.sidebar-logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  background-color: #2b3a4a;
  overflow: hidden;
  white-space: nowrap;
}
.sidebar-logo.collapsed {
  font-size: 14px;
}
.el-menu {
  border-right: none;
}
</style>