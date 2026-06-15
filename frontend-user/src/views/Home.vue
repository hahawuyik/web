<template>
  <div class="container">
    <el-row :gutter="20">
      <!-- 左侧边栏：版块导航 -->
      <el-col :span="6">
        <el-card class="glass-card">
          <template #header>版块导航</template>
          <div v-for="forum in forums" :key="forum.id" class="forum-item">
            <router-link :to="`/forum/${forum.id}`" class="forum-link">
              <div class="forum-cover" v-if="forum.cover_image">
                <img :src="forum.cover_image" alt="版块封面" />
              </div>
              <div class="forum-info">
                <div class="forum-name">{{ forum.name }}</div>
                <div class="forum-desc">{{ forum.description }}</div>
              </div>
            </router-link>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧主内容：选项卡 + 帖子列表 + 分页 -->
      <el-col :span="18">
        <el-card class="glass-card">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="最新发帖" name="latest" />
            <el-tab-pane label="最新回复" name="latest_reply" />
            <el-tab-pane label="最近热帖" name="most_view" />
          </el-tabs>

          <div v-loading="loading">
            <PostCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
            />
            <el-empty v-if="posts.length === 0" description="暂无帖子" />
          </div>

          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="page"
              :page-size="limit"
              :total="total"
              layout="prev, pager, next"
              @current-change="fetchPosts"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getForums } from '@/api/forum'
import { getLatestPosts } from '@/api/post'
import { useUserStore } from '@/stores/user'
import PostCard from '@/components/PostCard.vue'

const userStore = useUserStore()
const forums = ref([])
const posts = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const limit = 10
const activeTab = ref('latest')   // 当前选项卡

// 获取版块列表
const fetchForums = async () => {
  const res = await getForums()
  forums.value = res
}

// 根据当前排序和页码获取帖子
const fetchPosts = async () => {
  loading.value = true
  try {
    const res = await getLatestPosts({
      sort: activeTab.value,
      page: page.value,
      limit
    })
    posts.value = res.rows
    total.value = res.count
  } catch (error) {
    console.error('获取帖子失败', error)
  } finally {
    loading.value = false
  }
}

// 切换选项卡时重置页码并刷新
const handleTabChange = () => {
  page.value = 1
  fetchPosts()
}

onMounted(async () => {
  await fetchForums()
  await fetchPosts()
})
</script>

<style scoped>
.container {
  min-height: 180vh;
  padding: 40px;
  position: relative;
  z-index: 1;
}

/* 毛玻璃卡片效果 */
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

:deep(.el-card__header) {
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
  font-weight: bold;
  font-size: 16px;
}

:deep(.el-card__body) {
  background: transparent !important;
}

/* 左侧版块导航样式 */
.forum-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(240, 240, 240, 0.5);
  transition: background-color 0.3s ease;
  border-radius: 8px;
}
.forum-item:hover {
  background-color: rgba(255, 230, 240, 0.6);
}
.forum-link {
  display: flex;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}
.forum-cover {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
}
.forum-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.forum-info {
  flex: 1;
}
.forum-name {
  font-weight: bold;
  margin-bottom: 5px;
}
.forum-desc {
  font-size: 12px;
  color: #999;
}

/* 右侧分页 */
.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

/* 选项卡样式微调 */
:deep(.el-tabs__header) {
  margin-bottom: 20px;
}
:deep(.el-tabs__item) {
  font-size: 16px;
}
</style>