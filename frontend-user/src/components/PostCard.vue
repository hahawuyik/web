<template>
  <div class="post-card" @click="goToDetail">
    <div class="post-title">
      <el-tag 
        v-if="post.emotion_log?.category" 
        size="small" 
        :style="tagStyle"
        class="category-tag"
      >
        {{ post.emotion_log.category }}
      </el-tag>
      <span v-if="post.is_top" class="top-tag">置顶</span>
      <span v-if="post.is_essence" class="essence-tag">精华</span>
      <router-link :to="`/post/${post.id}`">{{ post.title }}</router-link>
    </div>
    <div class="post-meta">
      <span>作者：{{ post.author?.username }}</span>
      <span>回复：{{ post.reply_count }}</span>
      <span>阅读：{{ post.view_count }}</span>
      <span>发布于：{{ formatTime(post.created_at) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'

const props = defineProps(['post'])
const router = useRouter()

const goToDetail = () => {
  router.push(`/post/${props.post.id}`)
}

// 根据分类获取标签颜色
const tagStyle = computed(() => {
  const category = props.post.emotion_log?.category
  const colorMap = {
    '情感倾诉': '#eedeab',
    '学业压力': '#ffd6a5',
    '职场焦虑': '#ffadad',
    '人际关系': '#caffbf',
    '生活琐事': '#9bf6ff',
    '积极分享': '#a0c4ff'
  }
  const bgColor = colorMap[category] || '#cbabd1'
  return {
    backgroundColor: bgColor,
    borderColor: bgColor,
    color: '#fff'
  }
})

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
</script>

<style scoped>
/* 样式保持不变 */
.post-card {
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
}
.post-card:hover {
  background-color: #ffe5ec8b;
}
.post-title {
  font-size: 16px;
  margin-bottom: 8px;
}
.top-tag, .essence-tag {
  display: inline-block;
  padding: 2px 6px;
  font-size: 12px;
  border-radius: 3px;
  margin-right: 8px;
}
.top-tag {
  background-color: #f56c6c;
  color: #fff;
}
.essence-tag {
  background-color: #e6a23c;
  color: #fff;
}
.post-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 15px;
}
.category-tag {
  margin-left: 10px;
  vertical-align: middle;
}
</style>