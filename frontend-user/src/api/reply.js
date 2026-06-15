import request from '@/utils/request'

export const createReply = (postId, data) => request.post(`/replies/${postId}`, data)
export const deleteReply = (id) => request.delete(`/replies/${id}`)