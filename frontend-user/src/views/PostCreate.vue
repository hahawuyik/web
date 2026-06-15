<!-- frontend-user/src/views/PostCreate.vue -->
<template>
  <div class="container">
    <!-- 花边卡片外层包裹 -->
    <div class="flower-card-wrapper">
      <el-card class="flower-card">
        <h2>发布新帖子</h2>

        <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" maxlength="200" show-word-limit />
          </el-form-item>

          <el-form-item label="AI助手">
            <el-select v-model="form.ai_assistant_id" clearable placeholder="不选择（系统将自动兜底）">
              <el-option
                v-for="ass in assistants"
                :key="ass.id"
                :label="ass.name"
                :value="ass.id"
              >
                <div style="display: flex; align-items: center">
                  <el-avatar :size="24" :src="ass.avatar" style="margin-right: 8px" />
                  <span>{{ ass.name }}</span>
                </div>
              </el-option>
            </el-select>
            <div class="tip">选择助手后，发帖成功时它将立即为你回复一条温暖评论</div>
          </el-form-item>

          <el-form-item label="匿名发帖">
            <el-checkbox v-model="form.is_anonymous">匿名（不显示用户名）</el-checkbox>
          </el-form-item>

          <el-form-item label="内容" prop="content">
            <!-- 已改造的 MarkdownEditor 支持图片上传 -->
            <MarkdownEditor v-model="form.content" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="submit" :loading="submitting">发布</el-button>
            <el-button @click="$router.back()">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 花瓣飘落动画 -->
    <FlowerBloom v-if="showFlowerBloom" @close="onCloseAnimation" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createPost } from '@/api/post'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import { getAiAssistants } from '@/api/aiAssistant'
import FlowerBloom from '@/components/FlowerBloom.vue'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)
const assistants = ref([])

// 动画控制
const showFlowerBloom = ref(false)
// 存储发布成功的帖子ID
let createdPostId = null

const form = reactive({
  title: '',
  content: '',
  ai_assistant_id: null,
  is_anonymous: false
})

onMounted(async () => {
  try {
    const res = await getAiAssistants()
    assistants.value = res
  } catch (err) {
    console.error('获取AI助手列表失败', err)
  }
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

// 关闭动画后的回调
const onCloseAnimation = () => {
  showFlowerBloom.value = false
  if (createdPostId) {
    router.push(`/post/${createdPostId}`)
  } else {
    router.back()
  }
}

const submit = async () => {
  await formRef.value.validate()

  createdPostId = null
  showFlowerBloom.value = true
  submitting.value = true

  try {
    const res = await createPost(form)
    createdPostId = res.id
    ElMessage.success('发布成功，点击关闭按钮查看帖子')
  } catch (err) {
    console.error('发布错误', err)
    showFlowerBloom.value = false
    router.back()
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 20px;
}

/* 花边卡片外层包裹 */
.flower-card-wrapper {
  background-image: url('@/assets/biankuang2.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  padding: 35px;
}

/* el-card 去默认边框和阴影，让花边透出来 */
.flower-card {
  border: none;
  box-shadow: none;
  background: transparent;
}

.tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>