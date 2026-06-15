import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        ElMessage.error('登录已过期，请重新登录')
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_info')
        router.push('/login')
      } else if (status === 403) {
        ElMessage.error(data.msg || '权限不足')
      } else {
        ElMessage.error(data.msg || '请求失败')
      }
    } else {
      ElMessage.error('网络错误')
    }
    return Promise.reject(error)
  }
)

export default request