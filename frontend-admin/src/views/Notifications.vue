<template>
  <div>
    <el-card>
      <template #header>发布系统公告</template>
      <el-form label-width="100px">
        <el-form-item label="公告标题">
          <el-input v-model="announcement.title" />
        </el-form-item>
        <el-form-item label="公告内容">
          <el-input type="textarea" v-model="announcement.content" rows="5" />
        </el-form-item>
        <el-form-item label="发送给">
          <el-select v-model="announcement.target" placeholder="选择用户群">
            <el-option label="所有用户" value="all" />
            <el-option label="仅活跃用户" value="active" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="sendAnnouncement">发布公告</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card style="margin-top: 20px">
      <template #header>批量站内信</template>
      <el-form label-width="100px">
        <el-form-item label="接收用户">
          <el-input v-model="batchMessage.userIds" placeholder="用户ID，用逗号分隔" />
        </el-form-item>
        <el-form-item label="消息内容">
          <el-input type="textarea" v-model="batchMessage.content" rows="3" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="sendBatchMessage">发送站内信</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const announcement = reactive({ title: '', content: '', target: 'all' })
const batchMessage = reactive({ userIds: '', content: '' })

const sendAnnouncement = async () => {
  if (!announcement.title || !announcement.content) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  try {
    await request.post('/admin/announcement', {
      title: announcement.title,
      content: announcement.content,
      target: announcement.target
    })
    ElMessage.success('公告发布成功')
    // 清空表单
    announcement.title = ''
    announcement.content = ''
    announcement.target = 'all'
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '发布失败')
  }
}

const sendBatchMessage = async () => {
  if (!batchMessage.userIds || !batchMessage.content) {
    ElMessage.warning('请填写用户ID和消息内容')
    return
  }
  try {
    await request.post('/admin/messages', {
      userIds: batchMessage.userIds.split(',').map(id => parseInt(id.trim())),
      content: batchMessage.content
    })
    ElMessage.success('站内信发送成功')
    batchMessage.userIds = ''
    batchMessage.content = ''
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '发送失败')
  }
}
</script>