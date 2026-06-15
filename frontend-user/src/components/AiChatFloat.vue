<template>
  <div class="ai-float">
    <!-- 悬浮球 -->
    <div class="float-toggle" @click="toggleFloat">
      <img :src="youtongIcon" class="toggle-icon" />
      <span v-if="unreadCount" class="badge">{{ unreadCount }}</span>
    </div>

    <!-- 全屏遮罩层（虚化背景）+ 弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="expanded" class="modal-overlay" @click.self="expanded = false">
          <div class="float-panel" @click.stop>
            <!-- 毛玻璃背景层 -->
            <div class="glass-bg"></div>
            <div class="panel-content">
              <div class="panel-header">
                <span>树洞 🍃</span>
                <el-icon @click="expanded = false"><Close /></el-icon>
              </div>

              <el-tabs v-model="activeTab" class="panel-tabs" stretch>
                <!-- 烦恼倾诉 -->
                <el-tab-pane label="烦恼倾诉" name="chat">
                  <div class="chat-layout">
                    <div class="assistant-sidebar">
                      <div
                        v-for="ass in assistants"
                        :key="ass.id"
                        :class="['assistant-item', { active: currentAssistant?.id === ass.id }]"
                        @click="selectAssistant(ass)"
                      >
                        <el-avatar :size="36" :src="ass.avatar" />
                        <div class="ass-name">{{ ass.name }}</div>
                      </div>
                    </div>
                    <div class="chat-main">
                      <div class="messages" ref="messagesContainer">
                        <div v-for="msg in messages" :key="msg.id" :class="['message', msg.role]">
                          <div class="bubble">{{ msg.content }}</div>
                        </div>
                        <div v-if="loading" class="loading">AI 正在思考...</div>
                      </div>
                      <div class="input-area">
                        <el-input
                          v-model="inputMsg"
                          type="textarea"
                          :rows="2"
                          placeholder="输入消息，按 Enter 发送"
                          @keyup.enter="sendMessage"
                          :disabled="!currentAssistant"
                        />
                        <el-button type="primary" @click="sendMessage" :loading="sending" :disabled="!currentAssistant">
                          发送
                        </el-button>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="感恩练习" name="gratitude">
                  <GratitudePractice />
                </el-tab-pane>

                <el-tab-pane label="心理测试" name="test">
                  <PsychologicalTest />
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
import { getAiAssistants } from '@/api/aiAssistant'
import { getConversations, getMessages, sendMessage as apiSendMessage } from '@/api/aiChat'
import GratitudePractice from './GratitudePractice.vue'
import PsychologicalTest from './PsychologicalTest.vue'
import youtongIcon from '@/assets/youtong.png'

const expanded = ref(false)
const activeTab = ref('chat')
const unreadCount = ref(0)

// 烦恼倾诉相关
const assistants = ref([])
const currentAssistant = ref(null)
const messages = ref([])
const inputMsg = ref('')
const sending = ref(false)
const loading = ref(false)
const conversations = ref({})
const messagesContainer = ref(null)

const toggleFloat = () => {
  expanded.value = !expanded.value
  if (expanded.value && assistants.value.length === 0) {
    loadAssistants()
  }
}

const loadAssistants = async () => {
  try {
    assistants.value = await getAiAssistants()
    const convs = await getConversations()
    convs.forEach(c => {
      conversations.value[c.assistant_id] = c.id
    })
    if (assistants.value.length > 0 && !currentAssistant.value) {
      selectAssistant(assistants.value[0])
    }
  } catch (err) {
    console.error('加载AI助手失败', err)
  }
}

const selectAssistant = async (ass) => {
  currentAssistant.value = ass
  const convId = conversations.value[ass.id]
  if (convId) {
    loading.value = true
    try {
      const msgs = await getMessages(convId)
      messages.value = msgs
    } catch (err) {
      ElMessage.error('加载聊天记录失败')
    } finally {
      loading.value = false
    }
  } else {
    messages.value = []
  }
  scrollToBottom()
}

const sendMessage = async () => {
  if (!inputMsg.value.trim() || !currentAssistant.value) return
  const userMsg = {
    id: Date.now(),
    role: 'user',
    content: inputMsg.value
  }
  messages.value.push(userMsg)
  inputMsg.value = ''
  scrollToBottom()

  sending.value = true
  try {
    const convId = conversations.value[currentAssistant.value.id] || null
    const res = await apiSendMessage({
      conversationId: convId,
      assistantId: currentAssistant.value.id,
      content: userMsg.content
    })
    if (!conversations.value[currentAssistant.value.id]) {
      conversations.value[currentAssistant.value.id] = res.conversationId
    }
    const aiMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: res.reply
    }
    messages.value.push(aiMsg)
    scrollToBottom()
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '发送失败')
    messages.value.pop()
  } finally {
    sending.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(() => {})
</script>

<style scoped>
.toggle-icon {
  width: 30px;
  height: 40px;
  display: block;
}

.ai-float {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}
.float-toggle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #acdcfa;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
  transition: all 0.3s;
  position: relative;
}
.float-toggle:hover {
  transform: scale(1.05);
}
.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #f56c6c;
  border-radius: 10px;
  padding: 0 5px;
  font-size: 12px;
  line-height: 18px;
  min-width: 18px;
  text-align: center;
}

/* 全屏遮罩：虚化背景 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 弹窗容器 */
.float-panel {
  position: relative;
  width: 560px;
  height: 680px;
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* 毛玻璃背景层（模糊图片） */
.glass-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('@/assets/ai_background1.png'); /* 替换为你的图片路径 */
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(1px);
  transform: scale(1.05);
  z-index: 0;
}

/* 内容层（半透毛玻璃） */
.panel-content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 18px;
  color: #54844a;
  flex-shrink: 0;
}

.panel-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 关键修复 */
}

:deep(.el-tabs__header) {
  margin: 0;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  border-bottom: none;
  padding: 0 16px;
  flex-shrink: 0;
}
:deep(.el-tabs__nav) {
  display: flex;
  width: 100%;
}
:deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
  font-weight: 500;
  color: #3cb33c80;
}
:deep(.el-tabs__item.is-active) {
  color: #a3c93cde;
}
:deep(.el-tabs__active-bar) {
  background-color: #7ce233be;
}
:deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0;
  display: flex;          /* 新增 */
  flex-direction: column; /* 新增 */
}

:deep(.el-tab-pane) {
  flex: 1;                /* 新增 */
  min-height: 0;          /* 新增 */
  overflow: hidden;       /* 新增 */
}

/* 烦恼倾诉布局 */
.chat-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
  min-height: 0; /* 关键修复 */
}
.assistant-sidebar {
  width: 110px;
  border-right: 1px solid rgba(255, 255, 255, 0.4);
  overflow-y: auto;
  background: rgba(250, 250, 250, 0.4);
  backdrop-filter: blur(4px);
  flex-shrink: 0;
}
.assistant-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  cursor: pointer;
  transition: background 0.2s;
  text-align: center;
}
.assistant-item.active {
  background: rgba(64, 158, 255, 0.15);
  border-right: 2px solid #409eff;
}
.ass-name {
  font-size: 12px;
  margin-top: 8px;
  word-break: keep-all;
}
.chat-main {
  flex: 1;
  position: relative;
  background: rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.messages {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 68px;
  overflow-y: auto;
  padding: 16px;
}
.message {
  margin-bottom: 16px;
  display: flex;
}
.message.user {
  justify-content: flex-end;
}
.message.assistant {
  justify-content: flex-start;
}
.bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}
.message.user .bubble {
  background: #409eff;
  color: white;
  border-bottom-right-radius: 4px;
}
.message.assistant .bubble {
  background: rgba(240, 242, 245, 0.9);
  color: #374c3a;
  border-bottom-left-radius: 4px;
}
.loading {
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin: 8px 0;
}
.input-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}
.input-area .el-textarea {
  flex: 1;
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>