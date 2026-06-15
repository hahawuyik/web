<template>
  <div class="container">
    <el-card class="glass-card">
      <template #header>
        <div class="forum-header">
          <div class="forum-header-left">
            <div class="forum-cover" v-if="forum.cover_image">
              <img :src="forum.cover_image" alt="版块封面" />
            </div>
            <div class="forum-info">
              <h2>{{ forum.name }}</h2>
              <p class="forum-desc">{{ forum.description }}</p>
            </div>
          </div>
          <div class="sort-bar">
            <el-radio-group v-model="sort" @change="fetchPosts">
              <el-radio-button label="latest">最新发布</el-radio-button>
              <el-radio-button label="latest_reply">最新回复</el-radio-button>
              <el-radio-button label="most_view">最多查看</el-radio-button>
            </el-radio-group>
            <el-button type="primary" @click="goToCreate" v-if="userStore.userInfo">发帖</el-button>
          </div>
        </div>
      </template>
      <PostCard v-for="post in posts" :key="post.id" :post="post" />
      <el-empty v-if="posts.length === 0" description="暂无帖子" />
      <el-pagination
        v-model:current-page="page"
        :total="total"
        :page-size="limit"
        layout="prev, pager, next"
        @current-change="fetchPosts"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getForumById } from '@/api/forum'
import { getPostsByForum } from '@/api/post'
import { useUserStore } from '@/stores/user'
import PostCard from '@/components/PostCard.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const forumId = route.params.id

const forum = ref({})
const posts = ref([])
const sort = ref('latest')
const page = ref(1)
const limit = 20
const total = ref(0)

const fetchForum = async () => {
  const res = await getForumById(forumId)
  forum.value = res
}

const fetchPosts = async () => {
  const res = await getPostsByForum(forumId, { sort: sort.value, page: page.value, limit })
  posts.value = res.rows
  total.value = res.count
}

const goToCreate = () => {
  router.push({ path: '/post/create', query: { forumId } })
}

onMounted(() => {
  fetchForum()
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

.forum-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}
.forum-header-left {
  display: flex;
  gap: 20px;
  align-items: center;
}
.forum-cover {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}
.forum-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}
.forum-info h2 {
  margin: 0 0 8px 0;
}
.forum-desc {
  color: #666;
  font-size: 14px;
}
.sort-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}
.pagination {
  margin-top: 20px;
  text-align: center;
}
</style>