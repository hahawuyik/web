<template>
  <div class="container">
    <el-card class="glass-card">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>📊 我的情绪周报</span>
          <el-button type="primary" size="small" @click="generateReport" :loading="generating">
            生成本周报告
          </el-button>
        </div>
      </template>
      <div v-if="loading">加载中...</div>
      <div v-else-if="reports.length === 0" class="empty">
        暂无周报，下周再来看看吧~
      </div>
      <div v-else>
        <div ref="chartRef" style="height: 300px; margin-bottom: 20px;"></div>
        <div v-for="report in reports" :key="report.id" class="report-item">
          <h3>{{ report.week_start }} 至 {{ report.week_end }}</h3>
          <p><strong>情绪趋势</strong>：{{ report.summary }}</p>
          <p><strong>AI鼓励语</strong>：{{ report.encouragement }}</p>
          <el-divider />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { getMyWeeklyReports } from '@/api/weeklyReport';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';

const reports = ref([]);
const loading = ref(true);
const generating = ref(false);
const chartRef = ref(null);
let chartInstance = null;

const fetchAndDrawChart = async (startDate, endDate) => {
  if (!startDate || !endDate) return;
  await nextTick();
  if (!chartRef.value) {
    console.warn('图表容器尚未就绪');
    return;
  }
  try {
    const res = await request.get('/users/emotion-timeline', {
      params: { startDate, endDate }
    });
    const data = res.data || res;
    const dates = data.map(d => d.date);
    const positiveCounts = data.map(d => d.positive);
    const negativeCounts = data.map(d => d.negative);
    const neutralCounts = data.map(d => d.neutral);
    const avgScores = data.map(d => d.avgScore);

    if (chartInstance) chartInstance.dispose();
    chartInstance = echarts.init(chartRef.value);
    chartInstance.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['积极', '消极', '中性', '平均情绪分'] },
      xAxis: { type: 'category', data: dates },
      yAxis: [{ type: 'value', name: '帖子数' }, { type: 'value', name: '情绪分', min: 0, max: 1 }],
      series: [
        { name: '积极', type: 'bar', data: positiveCounts, barWidth: '20%' },
        { name: '消极', type: 'bar', data: negativeCounts },
        { name: '中性', type: 'bar', data: neutralCounts },
        { name: '平均情绪分', type: 'line', yAxisIndex: 1, data: avgScores, smooth: true }
      ]
    });
  } catch (err) {
    console.error('加载图表失败', err);
  }
};

const generateReport = async () => {
  generating.value = true;
  try {
    await request.post('/weekly-report/generate');
    ElMessage.success('周报生成成功');
    const res = await getMyWeeklyReports();
    reports.value = res.data || res || [];
  } catch (err) {
    const msg = err.response?.data?.msg || '生成失败';
    ElMessage.error(msg);
  } finally {
    generating.value = false;
  }
};

// 监听 reports 变化，自动绘制图表
watch(reports, async (newReports) => {
  if (newReports.length > 0) {
    const latest = newReports[0];
    await nextTick();
    if (!chartRef.value) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    await fetchAndDrawChart(latest.week_start, latest.week_end);
  }
}, { immediate: true });

onMounted(async () => {
  try {
    const res = await getMyWeeklyReports();
    reports.value = res.data || res || [];
  } catch (err) {
    ElMessage.error('获取周报失败');
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
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
  -webkit-backdrop-filter: blur(12px);
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 28px !important;
  box-shadow:
    0 0 20px rgba(255, 255, 255, 0.5),
    0 0 40px rgba(255, 182, 193, 0.35),
    0 8px 32px rgba(0, 0, 0, 0.12) !important;
  overflow: hidden;
}

:deep(.el-card__body) {
  background: transparent !important;
}

.report-item {
  margin-bottom: 20px;
}
.empty {
  text-align: center;
  color: #999;
}
</style>