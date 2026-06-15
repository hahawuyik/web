<template>
  <div class="container">
    <el-card v-loading="loading">
      <h2>编辑帖子</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <MarkdownEditor v-model="form.content" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit" :loading="submitting">保存</el-button>
          <el-button @click="$router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPostDetail, updatePost } from '@/api/post'
import MarkdownEditor from '@/components/MarkdownEditor.vue'

const route = useRoute()
const router = useRouter()
const postId = route.params.id
const formRef = ref()
const submitting = ref(false)
const loading = ref(false)

const form = reactive({ title: '', content: '' })
const rules = {
  title: [{ required: true, message: '请输入标题' }],
  content: [{ required: true, message: '请输入内容' }]
}

const loadPost = async () => {
  loading.value = true
  try {
    const post = await getPostDetail(postId)
    form.title = post.title
    form.content = post.content
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    await updatePost(postId, form)
    ElMessage.success('更新成功')
    router.push(`/post/${postId}`)
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '更新失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadPost()
})
</script>