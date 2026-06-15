import request from '@/utils/request'

export const getForums = () => {
  return request.get('/forums')
}

export const createForum = (data) => {
  return request.post('/admin/forums', data)
}

export const updateForum = (id, data) => {
  return request.put(`/admin/forums/${id}`, data)
}

export const deleteForum = (id) => {
  return request.delete(`/admin/forums/${id}`)
}