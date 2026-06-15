import request from '@/utils/request'

export const getPosts = (params) => {
  // 实际后台可能需要分页，这里简单调用 admin 的帖子管理接口（可扩展）
  return request.get('/admin/posts', { params })
}

export const managePost = (data) => {
  return request.post('/admin/posts/manage', data)
}

export const deleteReply = (replyId) => {
  return request.delete(`/admin/replies/${replyId}`)
}

export const getAdminPosts = (params) => {
  return request.get('/admin/posts', { params });
};

// 获取全站最新帖子（支持排序、分页）
export const getLatestPosts = (params) => {
  return request.get('/posts/latest', { params });
};