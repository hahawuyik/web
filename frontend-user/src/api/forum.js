import request from '@/utils/request'

export const getForums = () => request.get('/forums')
export const getForumById = (id) => request.get(`/forums/${id}`)