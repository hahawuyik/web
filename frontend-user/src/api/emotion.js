// src/api/emotion.js
import request from '@/utils/request'

// 获取今日情绪统计
export const getTodayEmotionStats = () => request.get('/emotion/today-stats')

// 获取一周情绪趋势
export const getWeeklyTrend = () => request.get('/emotion/weekly-trend')

// 获取情绪分类统计
export const getCategoryStats = () => request.get('/emotion/category')

// 获取全局情绪统计（所有帖子）
export const getGlobalEmotionStats = () => request.get('/emotion/global-stats')