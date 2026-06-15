<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-container">
          <el-button type="primary" @click="showAddDialog">新增版块</el-button>
          <div class="search-bar">
            <el-input
              v-model="keyword"
              placeholder="版块名称"
              clearable
              style="width: 200px"
              @keyup.enter="keyword = ''"
              @input="fireworksHandler"
            />
            <el-button @click="keyword = ''">重置</el-button>
          </div>
        </div>
      </template>
      <el-table :data="filteredForums" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="版块名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="sort_order" label="排序" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="editForum(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteForumHandler(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="封面图">
          <el-upload
            action="/api/admin/upload/cover"
            :headers="uploadHeaders"
            name="cover"
            :on-success="handleCoverSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :show-file-list="false"
          >
            <el-button type="primary">点击上传封面</el-button>
          </el-upload>
          <div v-if="form.cover_image" class="cover-preview">
            <img :src="form.cover_image" />
            <el-button type="text" @click="removeCover">移除</el-button>
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" />
        </el-form-item>
        <el-form-item label="版主ID">
          <el-input v-model="form.moderator_id" placeholder="用户ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveForum">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getForums, createForum, updateForum, deleteForum } from '@/api/forum'
import { useUserStore } from '@/stores/user'

import { useTypingFireworks } from '@/composables/useTypingFireworks'
const { fireworksHandler } = useTypingFireworks()

const userStore = useUserStore()
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}))
const forums = ref([])
const keyword = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('')
const form = ref({ name: '', description: '', cover_image: '', sort_order: 0, moderator_id: null })
const isEdit = ref(false)

const filteredForums = computed(() => {
  if (!keyword.value) return forums.value
  return forums.value.filter(f => f.name.includes(keyword.value))
})

const fetchForums = async () => {
  const res = await getForums()
  forums.value = res
}

const showAddDialog = () => {
  isEdit.value = false
  dialogTitle.value = '新增版块'
  form.value = { name: '', description: '', cover_image: '', sort_order: 0, moderator_id: null }
  dialogVisible.value = true
}

const editForum = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑版块'
  form.value = { ...row }
  dialogVisible.value = true
}

const saveForum = async () => {
  if (isEdit.value) {
    await updateForum(form.value.id, form.value)
    ElMessage.success('更新成功')
  } else {
    await createForum(form.value)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  fetchForums()
}

const deleteForumHandler = async (row) => {
  await ElMessageBox.confirm(`确定删除版块“${row.name}”吗？`, '提示', { type: 'warning' })
  await deleteForum(row.id)
  ElMessage.success('删除成功')
  fetchForums()
}

const handleCoverSuccess = (response) => {
  form.value.cover_image = response.url
  ElMessage.success('封面上传成功')
}
const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) ElMessage.error('只能上传图片文件')
  if (!isLt5M) ElMessage.error('图片大小不能超过 5MB')
  return isImage && isLt5M
}
const removeCover = () => {
  form.value.cover_image = ''
}

onMounted(() => {
  fetchForums()
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
.cover-preview {
  margin-top: 10px;
}
.cover-preview img {
  max-width: 120px;
  max-height: 120px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>