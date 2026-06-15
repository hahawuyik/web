import request from '@/utils/request'

export const createReport = (data) => request.post('/reports', data)