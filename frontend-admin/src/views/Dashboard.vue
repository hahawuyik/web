<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <el-card class="stat-card">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>全站情绪概览</template>
          <div v-loading="emotionLoading" class="emotion-container">
            <div class="dominant">
              主导情绪：
              <el-tag :type="dominantTagType" size="large">{{ dominantEmotion || '暂无' }}</el-tag>
            </div>
            <el-divider />
            <div v-for="(count, sentiment) in emotionStats" :key="sentiment" class="emotion-item">
              <div class="emotion-label">
                <span>{{ sentimentLabel(sentiment) }}</span>
                <span>{{ count }} 条</span>
              </div>
              <el-progress
                :percentage="getPercent(count)"
                :color="emotionColor[sentiment]"
                :stroke-width="12"
              />
            </div>
            <div v-if="Object.keys(emotionStats).length === 0" class="empty-tip">
              暂无情绪数据，快去发帖吧~
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>今日数据对比</template>
          <div ref="chartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import { getStats } from '@/api/dashboard'
import axios from '@/utils/request'

const stats = ref([
  { label: '今日发帖', value: 0 },
  { label: '新增用户', value: 0 },
  { label: '待处理举报', value: 0 },
  { label: '总用户数', value: 0 }
])
const chartRef = ref()
const emotionStats = ref({})
const totalEmotion = ref(0)
const dominantEmotion = ref('neutral')
const emotionLoading = ref(false)

// 情绪标签映射（中文）
const sentimentLabel = (sentiment) => {
  const map = {
    positive: '积极',
    neutral: '中性',
    negative: '消极',
    anxious: '焦虑',
    angry: '愤怒',
    sad: '悲伤'
  }
  return map[sentiment] || sentiment
}

// 情绪对应进度条颜色
const emotionColor = {
  positive: '#67C23A',
  neutral: '#909399',
  negative: '#F56C6C',
  anxious: '#E6A23C',
  angry: '#F56C6C',
  sad: '#409EFF'
}

// 主导情绪标签类型（用于 el-tag）
const dominantTagType = computed(() => {
  const map = {
    positive: 'success',
    neutral: 'info',
    negative: 'danger',
    anxious: 'warning',
    angry: 'danger',
    sad: 'primary'
  }
  return map[dominantEmotion.value] || 'info'
})

// 计算百分比
const getPercent = (count) => {
  if (totalEmotion.value === 0) return 0
  return ((count / totalEmotion.value) * 100).toFixed(0)
}

// 获取全站情绪统计
const fetchEmotionStats = async () => {
  emotionLoading.value = true
  try {
    const res = await axios.get('/emotion/global-stats')
    emotionStats.value = res.stats || {}
    totalEmotion.value = res.total || 0
    dominantEmotion.value = res.dominant || 'neutral'
  } catch (error) {
    console.error('获取情绪统计失败', error)
  } finally {
    emotionLoading.value = false
  }
}

// 获取常规仪表盘统计
const fetchStats = async () => {
  const res = await getStats()
  stats.value[0].value = res.todayPosts
  stats.value[1].value = res.newUsers
  stats.value[2].value = res.pendingReports
  stats.value[3].value = res.totalUsers

  const chart = echarts.init(chartRef.value)
  chart.setOption({
    xAxis: { type: 'category', data: ['今日发帖', '新增用户'] },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: [res.todayPosts, res.newUsers] }]
  })
}

onMounted(() => {
  fetchStats()
  fetchEmotionStats()
})
</script>

<style scoped>
.stat-card {
  text-align: center;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
}
.stat-label {
  margin-top: 10px;
  color: #666;
}
.emotion-container {
  min-height: 260px;
}
.dominant {
  text-align: center;
  margin-bottom: 16px;
  font-size: 16px;
}
.emotion-item {
  margin-bottom: 16px;
}
.emotion-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
}
.empty-tip {
  text-align: center;
  color: #999;
  padding: 20px 0;
}
</style>