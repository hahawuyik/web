import request from '@/utils/request'

export const getConversations = () => request.get('/ai-chat/conversations')
export const getMessages = (conversationId) => request.get(`/ai-chat/messages/${conversationId}`)
export const sendMessage = (data) => request.post('/ai-chat/send', data)