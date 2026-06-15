<template>
  <div class="container">
    <el-card class="glass-card">
      <template #header>消息通知</template>
      <div v-for="noti in notifications" :key="noti.id" class="noti-item" :class="{ unread: !noti.is_read }">
        <div class="noti-content">{{ noti.content }}</div>
        <div class="noti-time">{{ formatTime(noti.created_at) }}</div>
        <el-button size="small" v-if="!noti.is_read" @click="markRead(noti.id)">标记已读</el-button>
      </div>
      <el-empty v-if="notifications.length === 0" description="暂无通知" />
      <el-pagination v-model:current-page="page" :total="total" layout="prev, pager, next" @current-change="fetch" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { getNotifications, markNotificationRead } from '@/api/user'

const notifications = ref([])
const page = ref(1)
const limit = 20
const total = ref(0)

const fetch = async () => {
  const res = await getNotifications({ page: page.value, limit })
  notifications.value = res.rows
  total.value = res.count
}

const markRead = async (id) => {
  await markNotificationRead(id)
  await fetch()
}

const formatTime = (t) => dayjs(t).format('YYYY-MM-DD HH:mm')

onMounted(() => fetch())
</script>

<style scoped>
.container {
  min-height: calc(100vh - 60px);
  padding: 20px;
  position: relative;
  z-index: 1;
}

.glass-card {
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

.noti-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.noti-item.unread {
  background-color: rgba(240, 249, 255, 0.6);
}
.noti-content {
  flex: 1;
}
.noti-time {
  font-size: 12px;
  color: #999;
  margin: 0 10px;
}
</style>