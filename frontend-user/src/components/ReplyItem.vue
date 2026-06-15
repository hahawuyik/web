<template>
  <div class="reply-item">
    <div class="reply-avatar">
      <el-avatar :size="40" :src="avatarUrl">
        <!-- 如果 avatar 为空且是 AI 回复，显示机器人图标 -->
        <template #default v-if="!avatarUrl && isAIReply">
          🤖
        </template>
      </el-avatar>
    </div>
    <div class="reply-content">
      <div class="reply-header">
        <span class="username">{{ displayName }}</span>
        <span v-if="isAIReply" class="ai-badge">{{ assistantBadge}}</span>
        <span class="time">{{ formatTime(reply.created_at) }}</span>
      </div>
      <div class="reply-body">
        <div v-if="reply.quote_reply_id" class="quote">
          <blockquote>引用内容...</blockquote>
        </div>
        <MarkdownViewer :content="reply.content" />
      </div>
      <div class="reply-actions">
        <!-- 如果是 AI 回复，禁止回复和投票 -->
        <el-button size="small" text @click="$emit('reply-click', reply)">回复</el-button>
        <el-button size="small" text @click="vote('like')">
          👍 {{ reply.like_count }}
        </el-button>
        <el-button size="small" text @click="vote('dislike')">
          👎 {{ reply.dislike_count || 0 }}
        </el-button>
        <el-button size="small" text type="warning" @click="reportReply">举报</el-button>
        <el-button v-if="canDelete" size="small" type="danger" text @click="deleteReply">删除</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { deleteReply } from '@/api/reply'
import MarkdownViewer from './MarkdownViewer.vue'
import { createReport } from '@/api/report'

const props = defineProps(['reply'])
const emit = defineEmits(['reply-click', 'vote'])
const userStore = useUserStore()

// 判断是否为 AI 回复
const isAIReply = computed(() => {
  return props.reply.is_ai_reply === true || props.reply.assistant_id !== null
})

// 获取关联的助手信息
const assistant = computed(() => props.reply.assistant)

// 头像 URL（优先使用助手头像，否则使用作者头像）
const avatarUrl = computed(() => {
  if (assistant.value && assistant.value.avatar) return assistant.value.avatar
  if (props.reply.author?.avatar) return props.reply.author.avatar
  return null
})

// 显示的名称
const displayName = computed(() => {
  if (assistant.value) return assistant.value.name
  if (props.reply.author) return props.reply.author.username
  return '匿名用户'
})

// 助手标识文字
const assistantBadge = computed(() => {
  if (assistant.value) return `${assistant.value.name}助手`
  return 'AI暖心助手'
})

const canDelete = computed(() => {
  return userStore.userInfo && (userStore.userInfo.id === props.reply.user_id || ['admin', 'moderator'].includes(userStore.userInfo.role))
})

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

const vote = (type) => {
  emit('vote', props.reply.id, type)
}

const deleteReplyHandler = async () => {
  await ElMessageBox.confirm('确定删除该回复？', '提示', { type: 'warning' })
  await deleteReply(props.reply.id)
  ElMessage.success('已删除')
  location.reload()
}

const reportReply = async () => {
  if (!userStore.userInfo) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const { value } = await ElMessageBox.prompt('请输入举报原因', '举报回复', {
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputPlaceholder: '请填写举报原因（必填）',
      inputValidator: (val) => !!val.trim() || '原因不能为空'
    })
    await createReport({
      targetType: 'reply',
      targetId: props.reply.id,
      reason: value
    })
    ElMessage.success('举报已提交，管理员会尽快处理')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('举报失败，请稍后重试')
    }
  }
}


</script>

<style scoped>
/* 原有样式保持不变，增加以下样式 */
.ai-badge {
  background-color: #e6f7e6;
  color: #52c41a;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 12px;
  margin-left: 8px;
}

.reply-item {
  display: flex;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}
.reply-content {
  flex: 1;
}
.reply-header {
  margin-bottom: 8px;
}
.username {
  font-weight: bold;
  margin-right: 10px;
}
.time {
  font-size: 12px;
  color: #999;
}
.reply-actions {
  margin-top: 10px;
}
.quote {
  background-color: #f5f5f5;
  padding: 8px;
  border-left: 3px solid #409EFF;
  margin-bottom: 10px;
}
</style>