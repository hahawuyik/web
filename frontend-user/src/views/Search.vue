<template>
  <div class="container">
    <el-card class="glass-card">
      <template #header>
        <el-form inline @submit.prevent="doSearch">
          <el-form-item>
            <el-input v-model="keyword" placeholder="搜索标题、作者、内容" style="width: 300px" @input="fireworksHandler" />
          </el-form-item>
          <el-form-item label="版块">
            <el-select v-model="forumId" clearable placeholder="全部">
              <el-option v-for="f in forums" :key="f.id" :label="f.name" :value="f.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="doSearch">搜索</el-button>
          </el-form-item>
        </el-form>
      </template>
      <PostCard v-for="post in results" :key="post.id" :post="post" />
      <el-empty v-if="results.length === 0 && searched" description="没有找到相关内容" />
      <el-pagination v-if="total > limit" v-model:current-page="page" :total="total" :page-size="limit" layout="prev, pager, next" @current-change="doSearch" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { search } from '@/api/search'
import { getForums } from '@/api/forum'
import PostCard from '@/components/PostCard.vue'
import { useTypingFireworks } from '@/composables/useTypingFireworks'

const { fireworksHandler } = useTypingFireworks()
const route = useRoute()
const router = useRouter()
const keyword = ref(route.query.q || '')
const forumId = ref(route.query.forumId || '')
const dateRange = ref([])
const results = ref([])
const page = ref(1)
const limit = 20
const total = ref(0)
const searched = ref(false)
const forums = ref([])

const doSearch = async () => {
  const params = {
    q: keyword.value,
    forumId: forumId.value,
    startDate: dateRange.value?.[0] ? dateRange.value[0].toISOString() : undefined,
    endDate: dateRange.value?.[1] ? dateRange.value[1].toISOString() : undefined,
    page: page.value,
    limit
  }
  const res = await search(params)
  results.value = res.rows
  total.value = res.count
  searched.value = true
  router.replace({ query: { q: keyword.value, forumId: forumId.value } })
}

onMounted(async () => {
  forums.value = await getForums()
  if (route.query.q) {
    keyword.value = route.query.q
    doSearch()
  }
})
</script>

<style scoped>
.container {
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.glass-card {
  min-height: 500px;
  background: rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(12px) !important;
  border: 2px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 28px !important;
  box-shadow:
    0 0 20px rgba(255, 255, 255, 0.5),
    0 0 40px rgba(255, 182, 193, 0.35),
    0 8px 32px rgba(0, 0, 0, 0.12) !important;
}

.glass-card :deep(.el-card__header) {
  background: transparent !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
}

.glass-card :deep(.el-card__body) {
  background: transparent !important;
}
</style>