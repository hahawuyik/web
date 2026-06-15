<template>
  <div class="container">
    <el-card class="glass-card">
      <template #header>我的收藏</template>

      <div v-loading="loading">
        <div v-for="fav in validFavorites" :key="fav.id" class="favorite-item">
          <PostCard :post="fav.post" />
          <div class="action-buttons">
            <el-button size="small" class="btn-view-post" @click="viewPost(fav.post.id)">查看帖子</el-button>
            <el-button size="small" class="btn-delete" @click="unfavorite(fav.id)">取消收藏</el-button>
          </div>
        </div>
        <el-empty v-if="!loading && validFavorites.length === 0" description="暂无收藏" />
      </div>

      <div class="pagination-container" v-if="total > limit">
        <el-pagination
          v-model:current-page="page"
          :page-size="limit"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchFavorites"
          @input="fireworksHandler"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getFavorites, removeFavorite } from '@/api/favorite'
import PostCard from '@/components/PostCard.vue'
import { useTypingFireworks } from '@/composables/useTypingFireworks'
const { fireworksHandler } = useTypingFireworks()
const router = useRouter()
const favorites = ref([])
const loading = ref(false)
const page = ref(1)
const limit = 10
const total = ref(0)

const fetchFavorites = async () => {
  loading.value = true
  try {
    const res = await getFavorites({ page: page.value, limit })
    favorites.value = res.rows || res.data || []
    total.value = res.count || 0
  } catch (error) {
    ElMessage.error('加载收藏失败')
  } finally {
    loading.value = false
  }
}

const viewPost = (postId) => {
  router.push(`/post/${postId}`)
}

const unfavorite = async (favoriteId) => {
  await ElMessageBox.confirm('确定取消收藏？', '提示', { type: 'warning' })
  try {
    await removeFavorite(favoriteId)
    ElMessage.success('已取消收藏')
    await fetchFavorites()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const validFavorites = computed(() => {
  return favorites.value.filter(fav => fav.post !== null)
})

onMounted(() => {
  fetchFavorites()
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

.favorite-item {
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  padding-bottom: 16px;
}

.action-buttons {
  margin-top: 12px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}
</style>