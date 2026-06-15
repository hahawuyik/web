<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-container">
          <el-radio-group v-model="status" @change="fetchReports">
            <el-radio-button label="pending">待处理</el-radio-button>
            <el-radio-button label="approved">已通过</el-radio-button>
            <el-radio-button label="rejected">已驳回</el-radio-button>
          </el-radio-group>
          <div class="search-bar">
            <el-input
              v-model="keyword"
              placeholder="举报原因"
              clearable
              style="width: 200px"
              @keyup.enter="searchReports"
              @input="fireworksHandler"
            />
            <el-button type="primary" @click="searchReports">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </div>
      </template>
      <el-table :data="reports" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="target_type" label="类型" />
        <el-table-column prop="target_id" label="目标ID" />
        <el-table-column prop="reason" label="举报原因" />
        <el-table-column label="被举报内容" min-width="200">
          <template #default="{ row }">
            <span v-if="row.target_type === 'post'">
              <a :href="`${frontendBaseUrl}/post/${row.target_id}`" target="_blank">{{ row.target_content }}</a>
            </span>
            <span v-else>{{ row.target_content }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reporter.username" label="举报人" />
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column label="操作" width="180" v-if="status === 'pending'">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="handle(row, 'approve')">通过并删除</el-button>
            <el-button size="small" type="info" @click="handle(row, 'reject')">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getReports, handleReport } from '@/api/report'
import { useTypingFireworks } from '@/composables/useTypingFireworks'
const { fireworksHandler } = useTypingFireworks()

const status = ref('pending')
const reports = ref([])
const keyword = ref('')
const frontendBaseUrl = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5174'

const fetchReports = async () => {
  const res = await getReports({ status: status.value, keyword: keyword.value })
  reports.value = res.data || []
}
const searchReports = () => fetchReports()
const resetSearch = () => {
  keyword.value = ''
  fetchReports()
}

const handle = async (report, action) => {
  await handleReport({ reportId: report.id, action })
  ElMessage.success('处理成功')
  fetchReports()
}

onMounted(fetchReports)
</script>

<style scoped>
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.search-bar {
  display: flex;
  gap: 10px;
}
</style>