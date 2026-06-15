import request from '@/utils/request'

// 上传帖子/评论图片
export const uploadPostImage = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  return request.post('/upload/post-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}