import request from '@/utils/request'

// export const getReports = (status = 'pending') => {
//   return request.get('/admin/reports', { params: { status } })
// }

export const getReports = (params) => request.get('/admin/reports', { params });

export const handleReport = (data) => {
  return request.post('/admin/reports/handle', data)
}