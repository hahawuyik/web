import request from '@/utils/request'

export const getUsers = (params) => request.get('/admin/users', { params });

export const updateUserRole = (data) => {
  return request.put('/admin/users/role', data)
}

export const banUser = (userId) => {
  return request.put(`/admin/users/ban/${userId}`)
}