import request from '@/utils/request'

export const getTestQuestions = (testType) => request.get(`/psychological-tests/questions/${testType}`)
export const submitTest = (data) => request.post('/psychological-tests/submit', data)
export const getTestHistory = (params) => request.get('/psychological-tests/history', { params })