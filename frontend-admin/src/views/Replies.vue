<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-container">
          <span>回复管理</span>
          <div class="search-bar">
            <el-input
              v-model="keyword"
              placeholder="回复内容"
              clearable
              style="width: 200px"
              @keyup.enter="searchReplies"
              @input="fireworksHandler"
            />
            <el-button type="primary" @click="searchReplies">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </div>
      </template>
      <el-table :data="replies" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column prop="author.username" label="作者" />
        <el-table-column label="所属帖子" min-width="200">
          <template #default="{ row }">
            <a
              v-if="row.post"
              :href="`${frontendBaseUrl}/post/${row.post.id}`"
              target="_blank"
              class="post-link"
            >
              {{ row.post.title }}
            </a>
            <span v-else>帖子已删除</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="deleteReply(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page"
        :total="total"
        :page-size="limit"
        layout="prev, pager, next"
        @current-change="fetchReplies"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import { getReplies } from '@/api/reply'
import { useTypingFireworks } from '@/composables/useTypingFireworks'
const { fireworksHandler } = useTypingFireworks()

const replies = ref([])
const page = ref(1)
const limit = 20
const total = ref(0)
const keyword = ref('')
const frontendBaseUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5174'

const fetchReplies = async () => {
  try {
    const res = await getReplies({ page: page.value, limit, keyword: keyword.value })
    replies.value = res.data || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取回复列表失败', error)
    ElMessage.error('获取回复列表失败')
  }
}
const searchReplies = () => {
  page.value = 1
  fetchReplies()
}
const resetSearch = () => {
  keyword.value = ''
  searchReplies()
}

const deleteReply = async (reply) => {
  await ElMessageBox.confirm('确定删除该回复吗？', '提示', { type: 'warning' })
  try {
    await request.delete(`/admin/replies/${reply.id}`)
    ElMessage.success('删除成功')
    fetchReplies()
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '删除失败')
  }
}

onMounted(fetchReplies)
</script>

<style scoped>
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-bar {
  display: flex;
  gap: 10px;
}
.post-link {
  color: #409eff;
  text-decoration: none;
}
.post-link:hover {
  text-decoration: underline;
}
.pagination {
  margin-top: 20px;
  text-align: center;
}
</style>