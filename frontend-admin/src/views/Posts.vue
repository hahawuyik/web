<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-container">
          <span>帖子管理</span>
          <div class="search-bar">
            <el-input
              v-model="keyword"
              placeholder="标题/内容"
              clearable
              style="width: 200px"
              @keyup.enter="searchPosts"
              @input="fireworksHandler"
            />
            <el-button type="primary" @click="searchPosts">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </div>
      </template>
      <el-table :data="posts" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="标题" min-width="200">
          <template #default="{ row }">
            <a
              :href="`${frontendBaseUrl}/post/${row.id}`"
              target="_blank"
              class="post-link"
            >
              {{ row.title }}
            </a>
          </template>
        </el-table-column>
        <el-table-column prop="author.username" label="作者" />
        <el-table-column label="置顶" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.is_top" @change="manage(row, 'top', $event)" />
          </template>
        </el-table-column>
        <el-table-column label="加精" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.is_essence" @change="manage(row, 'essence', $event)" />
          </template>
        </el-table-column>
        <el-table-column label="锁定" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.is_locked" @change="manage(row, 'lock', $event)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="deletePost(row)">删除</el-button>
            <el-button size="small" @click="movePost(row)">移动版块</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page"
        :total="total"
        :page-size="limit"
        layout="prev, pager, next"
        @current-change="fetchPosts"
        class="pagination"
      />
    </el-card>

    <!-- 移动版块对话框 -->
    <el-dialog v-model="moveDialogVisible" title="移动帖子">
      <el-select v-model="targetForumId" placeholder="选择版块">
        <el-option v-for="f in forums" :key="f.id" :label="f.name" :value="f.id" />
      </el-select>
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMove">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminPosts, managePost } from '@/api/post'
import { getForums } from '@/api/forum'

import { useTypingFireworks } from '@/composables/useTypingFireworks'
const { fireworksHandler } = useTypingFireworks()

const posts = ref([])
const page = ref(1)
const total = ref(0)
const keyword = ref('')
const limit = 10
const forums = ref([])
const moveDialogVisible = ref(false)
const currentPost = ref(null)
const targetForumId = ref(null)
const frontendBaseUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5174'

const fetchPosts = async () => {
  try {
    const res = await getAdminPosts({ page: page.value, limit, keyword: keyword.value })
    posts.value = res.data || []
    total.value = res.total || 0
  } catch (error) {
    ElMessage.error('获取帖子列表失败')
  }
}
const searchPosts = () => {
  page.value = 1
  fetchPosts()
}
const resetSearch = () => {
  keyword.value = ''
  searchPosts()
}

const manage = async (post, action, value) => {
  await managePost({ postId: post.id, action, value })
  ElMessage.success('操作成功')
  if (action === 'delete' || action === 'move') fetchPosts()
}
const deletePost = async (post) => {
  await ElMessageBox.confirm('确定删除该帖子吗？', '提示', { type: 'warning' })
  await managePost({ postId: post.id, action: 'delete', value: true })
  ElMessage.success('已删除')
  fetchPosts()
}
const movePost = (post) => {
  currentPost.value = post
  moveDialogVisible.value = true
}
const confirmMove = async () => {
  await managePost({ postId: currentPost.value.id, action: 'move', value: targetForumId.value })
  ElMessage.success('已移动')
  moveDialogVisible.value = false
  fetchPosts()
}
const loadForums = async () => {
  const res = await getForums()
  forums.value = res
}

onMounted(() => {
  loadForums()
  fetchPosts()
})
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