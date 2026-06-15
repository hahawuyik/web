import request from '@/utils/request'

export const getProfile = () => request.get('/users/profile')
export const updateProfile = (data) => request.put('/users/profile', data)
export const updateAvatar = (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return request.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export const getNotifications = (params) => request.get('/users/notifications', { params })
export const markNotificationRead = (id) => request.put(`/users/notifications/${id}`)
// export const getMyPosts = () => request.get('/users/my-posts')
// export const getMyReplies = () => request.get('/users/my-replies')
export const getMyFavorites = () => request.get('/favorites')

// 获取我的帖子统计数据
export const getMyPostsStats = () => request.get('/users/my-posts/stats')

// 获取我的帖子列表（支持分页、筛选）
export const getMyPosts = (params) => request.get('/users/my-posts', { params })

// 获取我的回复列表（支持分页、关键词）
export const getMyReplies = (params) => request.get('/users/my-replies', { params })

// 修改密码
export const updatePassword = (data) => request.post('/users/change-password', data)