<template>
  <div>
    <el-card>
      <template #header>系统设置</template>
      <el-form :model="settings" label-width="120px">
        <el-form-item label="网站名称">
          <el-input v-model="settings.siteName" />
        </el-form-item>
        <el-form-item label="注册开关">
          <el-switch v-model="settings.registerEnabled" />
        </el-form-item>
        <el-form-item label="发帖审核">
          <el-switch v-model="settings.postReview" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const settings = ref({
  siteName: '我的论坛',
  registerEnabled: true,
  postReview: false
})

const fetchSettings = async () => {
  // 从后端获取设置（需实现 /admin/settings GET）
  // 临时模拟
}

const saveSettings = async () => {
  // 调用 /admin/settings PUT
  ElMessage.success('保存成功（演示）')
}

onMounted(() => {
  fetchSettings()
})
</script>