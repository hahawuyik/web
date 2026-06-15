<template>
  <div class="test-container">
    <!-- 阶段1：选择测试类型 -->
    <div v-if="step === 'select'" class="test-select">
      <div class="test-card" @click="selectTest('SAS')">
        <h3>SAS 焦虑自评量表</h3>
        <p>评估近期你可能经历的焦虑症状</p>
        <span>20个问题 · 约需5分钟</span>
      </div>
      <div class="test-card" @click="selectTest('SDS')">
        <h3>SDS 抑郁自评量表</h3>
        <p>评估近期你可能经历的抑郁症状</p>
        <span>20个问题 · 约需5分钟</span>
      </div>
      <el-button type="text" @click="showHistory = !showHistory" style="margin-top:12px">
        {{ showHistory ? '隐藏历史记录' : '查看历史记录' }}
      </el-button>
    </div>

    <!-- 阶段2：答题 -->
    <div v-else-if="step === 'testing'" class="testing">
      <div class="test-header">
        <span>{{ testType === 'SAS' ? 'SAS 焦虑自评' : 'SDS 抑郁自评' }}</span>
        <el-button type="text" @click="step = 'select'">取消</el-button>
      </div>
      <div class="question-list">
        <div v-for="(q, idx) in questions" :key="q.id" class="question-item">
          <div class="question-text">{{ idx+1 }}. {{ q.question_text }}</div>
          <el-radio-group v-model="answers[q.question_number]" @change="saveAnswer(q.question_number, $event)">
            <el-radio value="A">很少</el-radio>
            <el-radio value="B">有时</el-radio>
            <el-radio value="C">经常</el-radio>
            <el-radio value="D">总是</el-radio>
          </el-radio-group>
        </div>
        <el-button type="primary" @click="submitTest" :disabled="!allAnswered" style="width:100%; margin-top:20px">
          提交测试
        </el-button>
      </div>
    </div>

    <!-- 阶段3：结果 -->
    <div v-else-if="step === 'result'" class="result">
      <div class="result-card">
        <h3>{{ testType === 'SAS' ? 'SAS焦虑自评' : 'SDS抑郁自评' }} 结果</h3>
        <p>你的标准分：<strong>{{ result.standardScore }}</strong></p>
        <p>结果解释：<strong :class="resultClass">{{ result.resultLevel }}</strong></p>
        <p class="disclaimer">注意：这个测试结果仅供参考，不能替代专业医生的诊断。如果你感到困扰，请寻求专业帮助。</p>
        <el-button type="primary" @click="finishTest">完成</el-button>
      </div>
    </div>

    <!-- 历史记录抽屉（可选） -->
    <el-drawer v-model="showHistory" title="测试历史记录" direction="btt" size="60%">
      <div class="history-drawer">
        <el-radio-group v-model="historyFilter" size="small" style="margin-bottom:12px">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="SAS">SAS</el-radio-button>
          <el-radio-button label="SDS">SDS</el-radio-button>
        </el-radio-group>
        <div v-for="item in filteredHistory" :key="item.id" class="history-record">
          <div class="record-header">
            <strong>{{ item.test_type }}</strong>
            <span>{{ formatDate(item.created_at) }}</span>
          </div>
          <div>标准分：{{ item.standard_score }}</div>
          <div>{{ item.result_level }}</div>
        </div>
        <div v-if="filteredHistory.length === 0" class="empty-tip">暂无记录</div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTestQuestions, submitTest as apiSubmitTest, getTestHistory } from '@/api/psychologicalTest'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const step = ref('select')   // select, testing, result
const testType = ref(null)
const questions = ref([])
const answers = ref({})
const result = ref(null)
const showHistory = ref(false)
const history = ref([])
const historyFilter = ref('all')

const allAnswered = computed(() => {
  return questions.value.length === 20 && Object.keys(answers.value).length === 20
})

const resultClass = computed(() => {
  const level = result.value?.resultLevel || ''
  if (level.includes('正常')) return 'level-normal'
  if (level.includes('轻度')) return 'level-mild'
  if (level.includes('中度')) return 'level-moderate'
  return 'level-severe'
})

const filteredHistory = computed(() => {
  if (historyFilter.value === 'all') return history.value
  return history.value.filter(h => h.test_type === historyFilter.value)
})

const formatDate = (t) => dayjs(t).format('YYYY年M月D日 HH:mm')

const selectTest = async (type) => {
  testType.value = type
  try {
    const res = await getTestQuestions(type)
    questions.value = res
    answers.value = {}
    step.value = 'testing'
  } catch (err) {
    ElMessage.error('加载题目失败')
  }
}

const saveAnswer = (qid, val) => {
  answers.value[qid] = val
}

const submitTest = async () => {
  const answerList = Object.entries(answers.value).map(([qnum, opt]) => ({
    questionNumber: parseInt(qnum),
    optionKey: opt
  }))
  try {
    const res = await apiSubmitTest({
      testType: testType.value,
      answers: answerList
    })
    result.value = res
    step.value = 'result'
    await loadHistory()
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '提交失败')
  }
}

const finishTest = () => {
  step.value = 'select'
  testType.value = null
  questions.value = []
  answers.value = {}
  result.value = null
}

const loadHistory = async () => {
  try {
    const res = await getTestHistory({})
    history.value = res
  } catch (err) {
    console.error('加载历史失败', err)
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.test-container {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}
.test-select {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.test-card {
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  border-radius: 28px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #b5ea8c;
}
.test-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  background: rgba(181, 234, 140, 0.85);
}
.test-card h3 {
  margin: 0 0 8px;
  color: #2c3e50;
}
.test-card p {
  margin: 0 0 8px;
  color: #5a6e7a;
}
.test-card span {
  font-size: 12px;
  color: #8a9aa8;
}
.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: bold;
}
.question-item {
  background: rgba(250,250,250,0.8);
  border-radius: 20px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.question-text {
  font-weight: 500;
  margin-bottom: 10px;
}
.result-card {
  background: #f0f9f0;
  border-left: 4px solid #67c23a;
  padding: 16px;
  border-radius: 20px;
}
.level-normal { color: #67c23a; }
.level-mild { color: #e6a23c; }
.level-moderate { color: #f56c6c; }
.level-severe { color: #d9534f; }
.disclaimer {
  font-size: 12px;
  color: #888;
  margin-top: 12px;
}
.history-drawer {
  padding: 12px;
}
.history-record {
  background: #f5f7fa;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}
.record-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.empty-tip {
  text-align: center;
  padding: 30px;
  color: #aaa;
}
</style>