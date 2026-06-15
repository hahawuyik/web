<template>
  <div>
    <el-card>
      <template #header>
        <el-button type="primary" @click="openDialog()">新增助手</el-button>
      </template>
      <el-table :data="list" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="model_type" label="模型" />
        <el-table-column prop="is_default" label="默认">
          <template #default="{ row }">
            <el-tag :type="row.is_default ? 'success' : 'info'">{{ row.is_default ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-switch v-model="row.status" @change="updateStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="del(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑助手' : '新增助手'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="模型类型" prop="model_type">
          <el-select v-model="form.model_type">
            <el-option label="通义千问" value="qwen" />
            <el-option label="豆包" value="doubao" />
            <el-option label="文心一言" value="wenxin" />
          </el-select>
        </el-form-item>
        <el-form-item label="系统提示词" prop="system_prompt">
          <el-input type="textarea" v-model="form.system_prompt" rows="5" />
        </el-form-item>
        <el-form-item label="人格简介" prop="personality">
          <el-input type="textarea" v-model="form.personality" rows="2" />
        </el-form-item>
        <el-form-item label="知识库(JSON)" prop="knowledge_base">
          <el-input type="textarea" v-model="knowledgeBaseJson" rows="3" placeholder='{"common":["话术1","话术2"]}' />
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="form.is_default" />
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            action="/api/admin/upload/cover"
            :headers="uploadHeaders"
            name="cover"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeUpload"
            :show-file-list="false"
          >
            <el-button type="primary">点击上传头像</el-button>
          </el-upload>
          <div v-if="form.avatar" class="avatar-preview">
            <img :src="form.avatar" />
            <el-button type="text" @click="form.avatar = ''">移除</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAssistants, createAssistant, updateAssistant, deleteAssistant } from '@/api/aiAssistant'

const list = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({ name: '', model_type: 'qwen', system_prompt: '', personality: '', knowledge_base: {}, is_default: false, avatar: '' })
const knowledgeBaseJson = computed({
  get: () => JSON.stringify(form.value.knowledge_base || {}, null, 2),
  set: (val) => {
    try { form.value.knowledge_base = JSON.parse(val) } catch(e) { form.value.knowledge_base = {} }
  }
})


import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}))
const handleAvatarSuccess = (response) => {
  form.value.avatar = response.url
  ElMessage.success('头像上传成功')
}
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) ElMessage.error('只能上传图片文件')
  if (!isLt5M) ElMessage.error('图片大小不能超过 5MB')
  return isImage && isLt5M
}


const fetchList = async () => {
  const res = await getAssistants()
  list.value = res
}
const openDialog = (row = null) => {
  if (row) {
    isEdit.value = true
    form.value = { ...row }
  } else {
    isEdit.value = false
    form.value = { name: '', model_type: 'qwen', system_prompt: '', personality: '', knowledge_base: {}, is_default: false, avatar: '' }
  }
  dialogVisible.value = true
}
const save = async () => {
  if (isEdit.value) {
    await updateAssistant(form.value.id, form.value)
    ElMessage.success('更新成功')
  } else {
    await createAssistant(form.value)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  fetchList()
}
const del = async (row) => {
  await ElMessageBox.confirm('确定删除该助手吗？', '提示', { type: 'warning' })
  await deleteAssistant(row.id)
  ElMessage.success('删除成功')
  fetchList()
}
const updateStatus = async (row) => {
  await updateAssistant(row.id, { status: row.status ? 1 : 0 })
}
onMounted(fetchList)
</script>

<style scoped>
.avatar-preview {
  margin-top: 10px;
}
.avatar-preview img {
  max-width: 50px;
  max-height: 50px;
  border-radius: 50%;
  object-fit: cover;
}
</style>