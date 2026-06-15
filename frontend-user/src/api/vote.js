import request from '@/utils/request'

export const vote = (data) => request.post('/votes', data)
export const getVoteStatus = (targetType, targetId) => request.get('/votes/status', { params: { targetType, targetId } })