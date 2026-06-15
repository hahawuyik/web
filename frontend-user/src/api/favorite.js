import request from '@/utils/request'

export const toggleFavorite = (postId) => request.post(`/favorites/${postId}`)
export const getFavorites = (params) => request.get('/favorites', { params })  // 支持分页
export const removeFavorite = (favoriteId) => request.delete(`/favorites/${favoriteId}`)