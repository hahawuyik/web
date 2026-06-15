import request from '@/utils/request'

export const login = (data) => {
  return request.post('/auth/login', data)
}

export const changePassword = (data) => {
  return request.post('/auth/change-password', data)
}