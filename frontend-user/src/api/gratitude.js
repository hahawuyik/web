import request from '@/utils/request'

export const getCategories = () => request.get('/gratitude/categories')
export const submitPractice = (data) => request.post('/gratitude/submit', data)
export const getPracticeHistory = () => request.get('/gratitude/history')