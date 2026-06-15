import request from '@/utils/request'

export const getStats = () => {
  return request.get('/admin/dashboard/stats')
}