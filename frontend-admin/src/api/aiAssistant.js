import request from '@/utils/request';
export const getAssistants = () => request.get('/ai-assistants');
export const createAssistant = (data) => request.post('/ai-assistants', data);
export const updateAssistant = (id, data) => request.put(`/ai-assistants/${id}`, data);
export const deleteAssistant = (id) => request.delete(`/ai-assistants/${id}`);