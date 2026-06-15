<template>
  <div class="gratitude-container">
    <!-- 阶段1：选择感恩类别 -->
    <div v-if="step === 'select'" class="step-select">
      <h3>你想要感恩什么？</h3>
      <div class="category-grid">
        <div
          v-for="cat in categories"
          :key="cat"
          class="category-card"
          @click="selectCategory(cat)"
        >
          {{ cat }}
        </div>
      </div>
    </div>

    <!-- 阶段2：详细描述 + AI 反馈 -->
    <div v-else-if="step === 'describe'" class="step-describe">
      <div class="selected-category">
        <span>感恩类别：</span><strong>{{ selectedCategory }}</strong>
        <el-button type="text" @click="step = 'select'">重新选择</el-button>
      </div>
      <el-input
        type="textarea"
        :rows="4"
        v-model="description"
        placeholder="请详细描述这件感恩的事..."
        maxlength="500"
        show-word-limit
      />
      <el-button type="primary" @click="submitPractice" :loading="submitting" style="margin-top:12px">
        提交感恩
      </el-button>
      <div v-if="feedback" class="feedback-card">
        <div class="feedback-title">✨ AI 回应</div>
        <div class="feedback-content">{{ feedback }}</div>
        <el-button type="success" size="small" @click="complete">完成</el-button>
      </div>
    </div>

    <!-- 历史记录（始终显示在底部） -->
    <div class="history-section">
      <el-divider />
      <h4>📖 我的感恩记录</h4>
      <div v-if="history.length === 0" class="empty-tip">暂无记录，写下第一份感恩吧~</div>
      <div v-for="item in history" :key="item.id" class="history-item">
        <div class="history-header">
          <span class="category">{{ item.category }}</span>
          <span class="time">{{ formatTime(item.created_at) }}</span>
        </div>
        <div class="history-desc">{{ item.description }}</div>
        <div class="history-ai">💬 {{ item.ai_feedback }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCategories, submitPractice as apiSubmitPractice, getPracticeHistory } from '@/api/gratitude'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const step = ref('select')        // 'select' 或 'describe'
const categories = ref([])
const selectedCategory = ref('')
const description = ref('')
const submitting = ref(false)
const feedback = ref('')
const history = ref([])

const formatTime = (t) => dayjs(t).format('YYYY-MM-DD HH:mm')

const loadCategories = async () => {
  const res = await getCategories()
  categories.value = res
}
const loadHistory = async () => {
  const res = await getPracticeHistory()
  history.value = res
}

const selectCategory = (cat) => {
  selectedCategory.value = cat
  step.value = 'describe'
  description.value = ''
  feedback.value = ''
}

const submitPractice = async () => {
  if (!description.value.trim()) {
    return ElMessage.warning('请填写感恩描述')
  }
  submitting.value = true
  try {
    const res = await apiSubmitPractice({
      category: selectedCategory.value,
      description: description.value
    })
    feedback.value = res.aiFeedback
    ElMessage.success('感恩记录已保存')
    await loadHistory()
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '提交失败')
  } finally {
    submitting.value = false
  }
}

const complete = () => {
  // 完成后可重置到选择界面，也可保持当前界面仅清空描述
  step.value = 'select'
  selectedCategory.value = ''
  description.value = ''
  feedback.value = ''
}

onMounted(() => {
  loadCategories()
  loadHistory()
})
</script>

<style scoped>
.gratitude-container {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}
.step-select h3 {
  text-align: center;
  margin-bottom: 20px;
}
.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.category-card {
  background: rgba(255,255,240,0.8);
  backdrop-filter: blur(4px);
  border-radius: 20px;
  padding: 16px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(26, 98, 17, 0.725);
  font-weight: 500;
}
.category-card:hover {
  transform: translateY(-2px);
  background: #b5ea8c;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.step-describe .selected-category {
  margin-bottom: 12px;
  font-size: 14px;
}
.feedback-card {
  margin-top: 20px;
  background: #e8f4f8;
  border-radius: 16px;
  padding: 12px;
}
.feedback-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #2c7da0;
}
.feedback-content {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 12px;
}
.history-section {
  margin-top: 20px;
}
.history-item {
  background: rgba(255,255,255,0.6);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}
.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.category {
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 16px;
  font-size: 12px;
}
.time {
  font-size: 12px;
  color: #888;
}
.history-desc {
  margin: 8px 0;
}
.history-ai {
  background: #fef9e6;
  padding: 8px;
  border-radius: 8px;
  font-size: 13px;
  color: #b27300;
}
.empty-tip {
  text-align: center;
  padding: 20px;
  color: #aaa;
}
</style>