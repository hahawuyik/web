import request from '@/utils/request'

export const getPostsByForum = (forumId, params) => request.get(`/posts/forum/${forumId}`, { params })
export const getPostDetail = (id) => request.get(`/posts/${id}`)
export const createPost = (data) => request.post('/posts', data)
export const updatePost = (id, data) => request.put(`/posts/${id}`, data)
export const deletePost = (id) => request.delete(`/posts/${id}`)
export const getLatestPosts = (params) => request.get('/posts/latest', { params })

// 获取随机帖子
export const getRandomPost = () => request.get('/posts/random')