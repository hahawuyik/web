<template>
  <div class="container">
    <el-card class="glass-card">
      <template #header>
        <div class="card-header">
          <span>我的帖子</span>
          <el-button type="primary" link @click="fetchPosts">刷新</el-button>
        </div>
      </template>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalPosts }}</div>
            <div class="stat-label">总帖子</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalViews }}</div>
            <div class="stat-label">总阅读</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalLikes }}</div>
            <div class="stat-label">总获赞</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalComments }}</div>
            <div class="stat-label">总评论</div>
          </div>
        </el-col>
      </el-row>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索标题"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
          @input="fireworksHandler"
        />
        <el-select v-model="searchParams.status" placeholder="状态" clearable style="width: 120px">
          <el-option label="正常" value="normal" />
          <el-option label="已删除" value="deleted" />
          <el-option label="置顶" value="top" />
          <el-option label="精华" value="essence" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <div v-loading="loading" class="posts-list">
        <PostCard v-for="post in posts" :key="post.id" :post="post" />
        <el-empty v-if="!loading && posts.length === 0" description="暂无帖子" />
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page"
          :page-size="limit"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchPosts"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { getMyPosts, getMyPostsStats } from '@/api/user'
import PostCard from '@/components/PostCard.vue'
import { ElMessage } from 'element-plus'
import { useTypingFireworks } from '@/composables/useTypingFireworks'
const { fireworksHandler } = useTypingFireworks()
const posts = ref([])
const loading = ref(false)
const page = ref(1)
const limit = 10
const total = ref(0)
const dateRange = ref([])

// 统计数据
const stats = reactive({
  totalPosts: 0,
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0
})

// 搜索参数
const searchParams = reactive({
  keyword: '',
  status: '',
  startDate: '',
  endDate: ''
})

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await getMyPostsStats()
    Object.assign(stats, res)
  } catch (error) {
    console.error('获取统计失败', error)
  }
}

// 获取帖子列表
const fetchPosts = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      limit,
      ...searchParams,
      startDate: dateRange.value?.[0] || '',
      endDate: dateRange.value?.[1] || ''
    }
    const res = await getMyPosts(params)
    posts.value = res.rows || res.data || []
    total.value = res.count || 0
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchPosts()
}

const resetSearch = () => {
  searchParams.keyword = ''
  searchParams.status = ''
  dateRange.value = []
  handleSearch()
}

onMounted(() => {
  fetchStats()
  fetchPosts()
})
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
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 28px !important;
  box-shadow: 0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,182,193,0.35), 0 8px 32px rgba(0,0,0,0.12) !important;
  overflow: hidden;
}

:deep(.el-card__body) {
  background: transparent !important;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(255,255,255,0.5);
  border-radius: 16px;
  padding: 16px;
  text-align: center;
  backdrop-filter: blur(4px);
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.posts-list {
  min-height: 300px;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}
</style>