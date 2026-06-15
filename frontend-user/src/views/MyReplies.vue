<template>
  <div class="container">
    <el-card class="glass-card">
      <template #header>
        <div class="card-header">
          <span>我的回复</span>
          <el-button type="primary" link @click="fetchReplies">刷新</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索回复内容"
          clearable
          style="width: 250px"
          @keyup.enter="handleSearch"
          @input="fireworksHandler"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <div v-loading="loading" class="replies-list">
        <div v-for="reply in replies" :key="reply.id" class="reply-item">
          <el-card shadow="hover" class="reply-card">
            <div class="reply-header">
              <span class="reply-time">{{ reply.created_at }}</span>
              <span class="reply-post">帖子：{{ reply.postTitle }}</span>
            </div>
            <div class="reply-content">{{ reply.content }}</div>
            <div class="action-buttons">
              <el-button size="small" class="btn-view-post" @click="viewPost(reply.postId)">查看帖子</el-button>
              <el-button size="small" class="btn-delete" @click="deleteReply(reply.id)">删除评论</el-button>
            </div>
          </el-card>
        </div>
        <el-empty v-if="!loading && replies.length === 0" description="暂无回复" />
      </div>

      <div class="pagination-container" v-if="total > limit">
        <el-pagination
          v-model:current-page="page"
          :page-size="limit"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchReplies"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getMyReplies} from '@/api/user'
import { deleteReply as deleteReplyApi } from '@/api/reply'
import { useTypingFireworks } from '@/composables/useTypingFireworks'

const { fireworksHandler } = useTypingFireworks()
const router = useRouter()
const replies = ref([])
const loading = ref(false)
const page = ref(1)
const limit = 10
const total = ref(0)
const keyword = ref('')

const fetchReplies = async () => {
  loading.value = true
  try {
    const res = await getMyReplies({
      page: page.value,
      limit,
      keyword: keyword.value
    })
    replies.value = res.rows || res.data || []
    total.value = res.count || 0
  } catch (error) {
    ElMessage.error('加载回复失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchReplies()
}

const resetSearch = () => {
  keyword.value = ''
  handleSearch()
}

const viewPost = (postId) => {
  router.push(`/post/${postId}`)
}

const deleteReply = async (replyId) => {
  await ElMessageBox.confirm('确定删除该评论吗？', '提示', { type: 'warning' })
  try {
    await deleteReplyApi(replyId)
    ElMessage.success('删除成功')
    await fetchReplies()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchReplies()
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

.search-bar {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.reply-item {
  margin-bottom: 16px;
}

.reply-card {
  transition: all 0.3s ease;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
  color: #909399;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.reply-content {
  font-size: 15px;
  line-height: 1.6;
  color: #303133;
  margin: 12px 0;
  white-space: pre-wrap;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.pagination-container {
  margin-top: 20px;
  text-align: center;
}
</style>