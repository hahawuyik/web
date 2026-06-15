<template>
  <div class="container">
    <el-card v-loading="loading" class="flower-border">
      <div v-if="post">
        <div class="post-header">
          <h1>{{ post.title }}</h1>
          <div class="post-meta">
            <span>作者：{{ post.author?.username }}</span>
            <span>发布时间：{{ formatTime(post.created_at) }}</span>
            <span>阅读：{{ post.view_count }}</span>
            <span>回复：{{ post.reply_count }}</span>
            <span v-if="post.emotion_log?.category" class="category-label">
              归类：<el-tag size="small" :type="categoryTagType(post.emotion_log.category)">
               {{ post.emotion_log.category }}
             </el-tag>
             </span>
          </div>
          <div class="post-actions" v-if="userStore.userInfo">
            <el-button :type="isFavorited ? 'danger' : 'default'" @click="handleToggleFavorite">
              {{ isFavorited ? '取消收藏' : '收藏' }}
            </el-button>
            <el-button @click="reportDialogVisible = true">举报</el-button>
            <el-button v-if="canEdit" @click="editPost">编辑</el-button>
            <el-button v-if="canDelete" type="danger" @click="deletePost">删除</el-button>
            <el-button @click="$router.back()">返回</el-button>
          </div>
        </div>
        <el-divider />
        <MarkdownViewer :content="post.content" />
        <el-divider />
        <div class="like-section">
          <el-button :type="userVote === 'like' ? 'primary' : 'default'" @click="handleVote('like')">
            👍 点赞 ({{ post.like_count }})
          </el-button>
          <el-button :type="userVote === 'dislike' ? 'danger' : 'default'" @click="handleVote('dislike')">
            👎 点踩 ({{ post.dislike_count || 0 }})
          </el-button>
        </div>

        <div class="reply-section">
          <h3>回复</h3>

          <!-- 回复输入框区域 - 添加花边框 -->
          <div class="reply-input-wrapper flower-border">
            <!-- 新增：正在回复提示条 -->
            <div v-if="replyingTo" class="replying-to-bar">
              正在回复：<strong>{{ replyingTo.author?.username || replyingTo.assistant?.name || '用户' }}</strong>
              <el-button link type="danger" @click="clearReplyTo">取消回复</el-button>
            </div>

            <div v-if="userStore.userInfo && !post.is_locked">
              <el-input
                type="textarea"
                v-model="replyContent"
                placeholder="输入回复内容，可召唤 AI 助手"
                :rows="3"
                @input="onReplyInput"
                @compositionstart="isComposing = true"
                @compositionend="isComposing = false"
                ref="replyTextareaRef"
              />
              <!-- AI 助手下拉菜单（@ 触发） -->
              <div
                v-if="showAssistantMenu && filteredAssistants.length"
                class="assistant-dropdown"
                :style="{ top: assistantMenuTop + 'px', left: assistantMenuLeft + 'px' }"
              >
                <div
                  v-for="ass in filteredAssistants"
                  :key="ass.id"
                  class="assistant-item"
                  @click="selectAssistant(ass)"
                >
                  <el-avatar :size="24" :src="ass.avatar" />
                  <span>{{ ass.name }}</span>
                </div>
              </div>
              <div class="reply-tools">
                <!-- 新增召唤助手按钮 -->
                <el-button size="default" @click="openAssistantPicker" class="assistant-btn">
                  🤖 召唤助手
                </el-button>
                <el-button type="primary" @click="submitReply" :loading="replyLoading">发表回复</el-button>
              </div>
            </div>
            <div v-else-if="post.is_locked" class="locked-tip">帖子已锁定，无法回复</div>
            <div v-else class="login-tip">请登录后回复</div>
          </div>

          <div class="reply-list">
            <div v-for="top in post.replyTree" :key="top.id">
              <!-- 一级回复 - ReplyItem 组件内部会应用花边框 -->
              <ReplyItem
                :reply="top"
                @reply-click="quoteReply"
                @vote="handleReplyVote"
              />
              <!-- 二级回复（缩进显示） -->
              <div v-if="top.children && top.children.length" class="reply-children">
                <ReplyItem
                  v-for="child in top.children"
                  :key="child.id"
                  :reply="child"
                  @reply-click="quoteReply"
                  @vote="handleReplyVote"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 举报对话框 -->
    <el-dialog v-model="reportDialogVisible" title="举报">
      <el-input type="textarea" v-model="reportReason" placeholder="请填写举报原因" />
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReport">提交</el-button>
      </template>
    </el-dialog>

    <!-- 新增：AI 助手选择对话框 -->
    <el-dialog v-model="showAssistantPicker" title="选择 AI 助手" width="400px">
      <div v-if="assistants.length === 0" class="empty-assistant">
        暂无可用助手，请联系管理员
      </div>
      <div
        v-for="ass in assistants"
        :key="ass.id"
        class="assistant-picker-item"
        @click="insertAssistantMention(ass)"
      >
        <el-avatar :size="32" :src="ass.avatar" />
        <div class="assistant-info">
          <div class="assistant-name">{{ ass.name }}</div>
          <div class="assistant-desc">{{ ass.personality || 'AI 助手' }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { useUserStore } from '@/stores/user'
import { getPostDetail, deletePost as deletePostApi } from '@/api/post'
import { createReply } from '@/api/reply'
import { vote as voteApi, getVoteStatus } from '@/api/vote'
import { toggleFavorite as toggleFavoriteApi, getFavorites } from '@/api/favorite'
import { createReport } from '@/api/report'
import MarkdownViewer from '@/components/MarkdownViewer.vue'
import ReplyItem from '@/components/ReplyItem.vue'
import { getAiAssistants } from '@/api/aiAssistant'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const postId = route.params.id

const post = ref(null)
const loading = ref(false)
const replyContent = ref('')
const replyLoading = ref(false)
const isFavorited = ref(false)
const userVote = ref(null)
const reportDialogVisible = ref(false)
const reportReason = ref('')
const replyingTo = ref(null)

const replyTextareaRef = ref(null)
const assistants = ref([])
const showAssistantMenu = ref(false)
const assistantMenuTop = ref(0)
const assistantMenuLeft = ref(0)
const atStartPos = ref(-1)
const currentAtText = ref('')
// 中文输入法组合状态
const isComposing = ref(false)

// 新增：控制助手选择对话框
const showAssistantPicker = ref(false)

const fetchAssistants = async() => {
  try {
    const res = await getAiAssistants()
    assistants.value = res
    console.log('AI助手加载成功:', res)
  } catch (error) {
    console.error('获取失败 AI assistants:', error)
  }
}

const filteredAssistants = computed(() => {
  if (!currentAtText.value) return assistants.value
  return assistants.value.filter(a => a.name.includes(currentAtText.value))
})

// 改进 @ 检测逻辑
const onReplyInput = () => {
  if (isComposing.value) return

  let textareaEl = replyTextareaRef.value?.$el?.querySelector('textarea')
  if (!textareaEl && replyTextareaRef.value) {
    textareaEl = replyTextareaRef.value;
  }
  if (!textareaEl) {
    console.warn('无法获取 textarea 元素');
    return;
  }

  const cursorPos = textareaEl.selectionStart
  const text = textareaEl.value

  let atIdx = -1
  for (let i = cursorPos - 1; i >= 0; i--) {
    if (text[i] === '@') {
      if (i === 0 || !/[\w\u4e00-\u9fa5]/.test(text[i-1])) {
        atIdx = i
        break
      }
    }
  }

  if (atIdx !== -1) {
    const afterAt = text.substring(atIdx + 1, cursorPos)
    if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
      atStartPos.value = atIdx
      currentAtText.value = afterAt
      const rect = textareaEl.getBoundingClientRect()
      assistantMenuTop.value = rect.bottom + window.scrollY + 5
      assistantMenuLeft.value = rect.left + window.scrollX
      showAssistantMenu.value = true
      return
    }
  }
  showAssistantMenu.value = false
}

const selectAssistant = (assistant) => {
  if (atStartPos.value === -1) return
  const before = replyContent.value.substring(0, atStartPos.value)
  const after = replyContent.value.substring(atStartPos.value + 1 + currentAtText.value.length)
  replyContent.value = before + `@${assistant.name} ` + after
  showAssistantMenu.value = false
  nextTick(() => {
    const textarea = replyTextareaRef.value?.$el?.querySelector('textarea')
    if (textarea) {
      const newCursor = before.length + assistant.name.length + 2
      textarea.selectionStart = newCursor
      textarea.selectionEnd = newCursor
      textarea.focus()
    }
  })
}

// 新增：打开助手选择对话框
const openAssistantPicker = () => {
  if (assistants.value.length === 0) {
    ElMessage.warning('暂无可用的 AI 助手，请联系管理员添加')
    return
  }
  showAssistantPicker.value = true
}

// 新增：从对话框选择助手并插入 @ 标记
const insertAssistantMention = (assistant) => {
  // 如果当前有回复目标（正在回复某人），建议直接追加到内容末尾
  // 这里采用追加到现有内容的末尾，并自动添加一个空格
  const mention = `@${assistant.name} `
  replyContent.value = replyContent.value + mention
  showAssistantPicker.value = false

  // 聚焦到输入框并定位光标到末尾
  nextTick(() => {
    const textarea = replyTextareaRef.value?.$el?.querySelector('textarea')
    if (textarea) {
      textarea.focus()
      textarea.selectionStart = textarea.value.length
      textarea.selectionEnd = textarea.value.length
    }
  })
  ElMessage.success(`已添加 ${assistant.name} 的召唤标记，发布回复后将自动收到 AI 回复`)
}

// 清除回复目标
const clearReplyTo = () => {
  replyingTo.value = null
  replyContent.value = ''
  ElMessage.info('已取消回复，现在发表的是新评论')
}

// 引用回复时滚动到输入框并聚焦
const quoteReply = (reply) => {
  replyingTo.value = reply
  const name = reply.author?.username || reply.assistant?.name || '用户'
  replyContent.value = `@${name} `
  nextTick(() => {
    const textarea = replyTextareaRef.value?.$el?.querySelector('textarea')
    if (textarea) {
      textarea.focus()
      textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

const canEdit = computed(() => {
  return userStore.userInfo && (userStore.userInfo.id === post.value?.user_id || userStore.userInfo.role === 'admin')
})
const canDelete = computed(() => {
  return userStore.userInfo && (userStore.userInfo.id === post.value?.user_id || ['admin', 'moderator'].includes(userStore.userInfo.role))
})

const formatTime = (time) => dayjs(time).format('YYYY-MM-DD HH:mm')

const fetchPost = async () => {
  loading.value = true
  try {
    const res = await getPostDetail(postId, { t: Date.now()})
    post.value = res
  } finally {
    loading.value = false
  }
}

const fetchFavoriteStatus = async () => {
  const res = await getFavorites()
  const favorites = res.data || []
  isFavorited.value = favorites.some(f => f.post_id === parseInt(postId))
}

const fetchVoteStatus = async () => {
  const res = await getVoteStatus('post', postId)
  if (res.voted) userVote.value = res.voteType
}

const handleToggleFavorite = async () => {
  const res = await toggleFavoriteApi(postId)
  isFavorited.value = res.isFavorited
  ElMessage.success(res.msg)
}

let voting = false
const handleVote = async (type) => {
  if (voting) return
  voting = true

  const originalLike = post.value.like_count
  const originalDislike = post.value.dislike_count
  const originalVote = userVote.value

  try {
    if (originalVote === type) {
      userVote.value = null
      if (type === 'like') post.value.like_count--
      else post.value.dislike_count--
    } else {
      if (originalVote === 'like') post.value.like_count--
      if (originalVote === 'dislike') post.value.dislike_count--
      userVote.value = type
      if (type === 'like') post.value.like_count++
      else post.value.dislike_count++
    }

    const res = await voteApi({
      targetType: 'post',
      targetId: postId,
      voteType: type
    })

    if (res.like_count !== undefined) post.value.like_count = res.like_count
    if (res.dislike_count !== undefined) post.value.dislike_count = res.dislike_count

    ElMessage.success('投票成功')
  } catch (error) {
    post.value.like_count = originalLike
    post.value.dislike_count = originalDislike
    userVote.value = originalVote

    const errorMsg = error.response?.data?.msg || '投票失败'
    ElMessage.error(errorMsg)
  } finally {
    voting = false
  }
}

const submitReply = async () => {
  if (!replyContent.value.trim()) return ElMessage.warning('请输入内容')
  replyLoading.value = true

  let parentReplyId = null
  if (replyingTo.value) {
    parentReplyId = replyingTo.value.parent_reply_id || replyingTo.value.id
  }

  const tempId = -Date.now()
  const optimisticReply = {
    id: tempId,
    content: replyContent.value,
    created_at: new Date().toISOString(),
    author: userStore.userInfo,
    like_count: 0,
    user_vote: null,
    quote_reply_id: null,
    parent_reply_id: parentReplyId,
    children: []
  }

  if (!parentReplyId) {
    if (!post.value.replyTree) post.value.replyTree = []
    post.value.replyTree.unshift(optimisticReply)
  } else {
    const parent = findReplyById(post.value.replyTree, parentReplyId)
    if (parent) {
      if (!parent.children) parent.children = []
      parent.children.unshift(optimisticReply)
    } else {
      if (!post.value.replyTree) post.value.replyTree = []
      post.value.replyTree.unshift(optimisticReply)
    }
  }
  post.value.reply_count++

  const originalContent = replyContent.value
  replyContent.value = ''
  const replyingToBackup = replyingTo.value
  replyingTo.value = null

  try {
    const realReply = await createReply(postId, {
      content: optimisticReply.content,
      quoteReplyId: null,
      parentReplyId: parentReplyId
    })
    if (!parentReplyId) {
      const index = post.value.replyTree.findIndex(r => r.id === tempId)
      if (index !== -1) {
        const oldChildren = post.value.replyTree[index].children || []
        post.value.replyTree[index] = { ...realReply, children: oldChildren }
      }
    } else {
      const parent = findReplyById(post.value.replyTree, parentReplyId)
      if (parent) {
        const childIndex = parent.children.findIndex(c => c.id === tempId)
        if (childIndex !== -1) {
          const oldChildren = parent.children[childIndex].children || []
          parent.children[childIndex] = { ...realReply, children: oldChildren }
        }
      }
    }
    ElMessage.success('回复成功')
  } catch (error) {
    if (!parentReplyId) {
      const index = post.value.replyTree.findIndex(r => r.id === tempId)
      if (index !== -1) post.value.replyTree.splice(index, 1)
    } else {
      const parent = findReplyById(post.value.replyTree, parentReplyId)
      if (parent) {
        const childIndex = parent.children.findIndex(c => c.id === tempId)
        if (childIndex !== -1) parent.children.splice(childIndex, 1)
      }
    }
    post.value.reply_count--
    replyContent.value = originalContent
    replyingTo.value = replyingToBackup
    ElMessage.error(error.response?.data?.msg || '回复失败，请重试')
  } finally {
    replyLoading.value = false
  }
}

function findReplyById(tree, id) {
  for (const reply of tree) {
    if (reply.id === id) return reply
    if (reply.children && reply.children.length) {
      const found = findReplyById(reply.children, id)
      if (found) return found
    }
  }
  return null
}

function updateReplyInTree(tree, replyId, updater) {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === replyId) {
      updater(tree[i])
      return true
    }
    if (tree[i].children && tree[i].children.length) {
      if (updateReplyInTree(tree[i].children, replyId, updater)) return true
    }
  }
  return false
}

let replyVoting = false

const handleReplyVote = async (replyId, type) => {
  if (replyVoting) return
  replyVoting = true

  let targetReply = null
  updateReplyInTree(post.value.replyTree, replyId, (reply) => { targetReply = reply })

  if (!targetReply) {
    replyVoting = false
    return
  }

  const currentVote = targetReply.user_vote
  const originalLike = targetReply.like_count
  const originalDislike = targetReply.dislike_count

  if (currentVote === type) {
    targetReply.user_vote = null
    if (type === 'like') targetReply.like_count--
    else targetReply.dislike_count--
  } else {
    if (currentVote === 'like') targetReply.like_count--
    if (currentVote === 'dislike') targetReply.dislike_count--
    targetReply.user_vote = type
    if (type === 'like') targetReply.like_count++
    else targetReply.dislike_count++
  }

  try {
    const res = await voteApi({ targetType: 'reply', targetId: replyId, voteType: type })
    if (res.like_count !== undefined) targetReply.like_count = res.like_count
    if (res.dislike_count !== undefined) targetReply.dislike_count = res.dislike_count
    ElMessage.success('投票成功')
  } catch (error) {
    targetReply.user_vote = currentVote
    targetReply.like_count = originalLike
    targetReply.dislike_count = originalDislike
    ElMessage.error(error.response?.data?.msg || '投票失败')
  } finally {
    replyVoting = false
  }
}

const submitReport = async () => {
  if (!reportReason.value) return ElMessage.warning('请填写举报原因')
  await createReport({ targetType: 'post', targetId: postId, reason: reportReason.value })
  ElMessage.success('举报已提交')
  reportDialogVisible.value = false
  reportReason.value = ''
}

const editPost = () => {
  router.push(`/post/edit/${postId}`)
}

const deletePost = async () => {
  await ElMessageBox.confirm('确定删除该帖子吗？', '提示', { type: 'warning' })
  await deletePostApi(postId)
  ElMessage.success('已删除')
  router.push('/')
}

onMounted(async () => {
  await fetchPost()
  if (userStore.userInfo) {
    await fetchFavoriteStatus()
    await fetchVoteStatus()
  }
  await fetchAssistants()
  window.addEventListener('click', (e) => {
    if (!showAssistantMenu.value) return
    const menu = document.querySelector('.assistant-dropdown')
    if (menu && !menu.contains(e.target)) {
      showAssistantMenu.value = false
    }
  })
})
</script>

<style scoped>


.reply-tools {
  margin-top: 10px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.assistant-btn {
  background: #f0f7ff;
  border-color: #b3d8ff;
  color: #409eff;
}
.assistant-btn:hover {
  background: #e6f2ff;
}

/* 助手选择对话框样式 */
.assistant-picker-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}
.assistant-picker-item:hover {
  background-color: #f5f7fa;
}
.assistant-info {
  flex: 1;
}
.assistant-name {
  font-weight: bold;
  margin-bottom: 4px;
}
.assistant-desc {
  font-size: 12px;
  color: #909399;
}
.empty-assistant {
  padding: 30px;
  text-align: center;
  color: #999;
}

.container {
  min-height: 100vh;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.post-header {
  margin-bottom: 20px;
}
.post-meta {
  color: #999;
  font-size: 12px;
  margin: 10px 0;
  display: flex;
  gap: 15px;
}
.post-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}
.like-section {
  margin: 20px 0;
  text-align: center;
}
.reply-section {
  margin-top: 30px;
}
.reply-tools {
  margin-top: 10px;
  text-align: right;
}
.locked-tip {
  background-color: #fef0f0;
  padding: 10px;
  color: #f56c6c;
  text-align: center;
}
.login-tip {
  background-color: #f0f9ff;
  padding: 10px;
  color: #409eff;
  text-align: center;
}
.reply-children {
  margin-left: 50px;
  padding-left: 15px;
  border-left: 2px solid #e9ecef;
}
.assistant-dropdown {
  position: fixed;
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
  min-width: 150px;
}
.assistant-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
}
.assistant-item:hover {
  background-color: #f5f7fa;
}

/* ========== 整张花边框样式 ========== */
.flower-border {
  background-image: url('@/assets/biankuang_flower.png');
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: center;
  background-color: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  padding: 28px;
  border-radius: 0;
  transition: all 0.3s;
}
.el-card.flower-border {
  background-color: transparent;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}
.el-card.flower-border :deep(.el-card__body) {
  background-color: transparent;
  padding: 0;
}
.reply-input-wrapper.flower-border {
  margin: 20px 0;
  background-color: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
}
:deep(.reply-item) {
  background-image: url('@/assets/biankuang_flower.png');
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-color: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  padding: 20px;
  margin-bottom: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}
:deep(.reply-item:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.reply-children :deep(.reply-item) {
  padding: 16px;
}
@media (max-width: 768px) {
  .flower-border {
    padding: 16px;
  }
  :deep(.reply-item) {
    padding: 12px;
  }
}

/* 新增：正在回复提示条样式 */
.replying-to-bar {
  background-color: #f0f9ff;
  padding: 8px 12px;
  margin-bottom: 12px;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>