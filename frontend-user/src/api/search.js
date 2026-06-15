import request from '@/utils/request'

export const search = (params) => request.get('/search', { params })  // 需后端实现搜索接口