import request from '@/utils/request'

// 获取回复列表（管理员）
export const getReplies = (params) => {
  return request.get('/admin/replies', { params })
}

export const deleteReply = (id) => {
  return request.delete(`/admin/replies/${id}`)
}