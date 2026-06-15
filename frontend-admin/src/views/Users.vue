<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-container">
          <span>用户列表</span>
          <div class="search-bar">
            <el-input
              v-model="keyword"
              placeholder="用户名/邮箱/手机号"
              clearable
              style="width: 200px"
              @keyup.enter="searchUsers"
              @input="fireworksHandler"
            />
            <el-button type="primary" @click="searchUsers">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </div>
      </template>
      <el-table :data="users" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="mobile" label="手机号" />
        <el-table-column prop="role" label="角色">
          <template #default="{ row }">
            <el-tag
              :type="row.role === 'admin' ? 'danger' : row.role === 'moderator' ? 'warning' : 'info'"
            >
              {{ row.role === 'admin' ? '超级管理员' : row.role === 'moderator' ? '版主' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '封禁' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-select
              v-model="row.role"
              size="small"
              @change="changeRole(row)"
              placeholder="修改角色"
              style="width: 100px; margin-right: 8px"
            >
              <el-option label="普通用户" value="user" />
              <el-option label="版主" value="moderator" />
              <el-option label="超级管理员" value="admin" />
            </el-select>
            <el-button
              size="small"
              :type="row.status === 'active' ? 'danger' : 'success'"
              @click="toggleBan(row)"
            >
              {{ row.status === 'active' ? '封禁' : '解封' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUsers, updateUserRole, banUser } from '@/api/user'

import { useTypingFireworks } from '@/composables/useTypingFireworks'
const { fireworksHandler } = useTypingFireworks()

const users = ref([])
const keyword = ref('')

const fetchUsers = async () => {
  const res = await getUsers({ keyword: keyword.value })
  users.value = res
}
const searchUsers = () => fetchUsers()
const resetSearch = () => {
  keyword.value = ''
  fetchUsers()
}

const changeRole = async (user) => {
  await updateUserRole({ userId: user.id, role: user.role })
  ElMessage.success('角色已更新')
}
const toggleBan = async (user) => {
  const action = user.status === 'active' ? '封禁' : '解封'
  await ElMessageBox.confirm(`确定要${action}用户 ${user.username} 吗？`, '提示', { type: 'warning' })
  await banUser(user.id)
  ElMessage.success(`${action}成功`)
  fetchUsers()
}

onMounted(fetchUsers)
</script>

<style scoped>
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search-bar {
  display: flex;
  gap: 10px;
}
</style>