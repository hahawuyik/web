import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ,
  timeout: 60000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    // 2xx 状态码进入这里
    const res = response.data;
    // 如果后端有自定义业务状态码（如 code !== 200）也视为错误
    if (res.code && res.code !== 200) {
      ElMessage.error(res.msg || '请求失败');
      return Promise.reject(new Error(res.msg));
    }
    return res;
  },
  error => {
    // 非 2xx 状态码（400, 401, 500 等）进入这里
    const response = error.response;
    if (response) {
      const msg = response.data?.msg || `请求失败 (${response.status})`;
      ElMessage.error(msg);
    } else if (error.request) {
      ElMessage.error('网络错误，请检查后端服务');
    } else {
      ElMessage.error(error.message);
    }
    return Promise.reject(error);
  }
);

export default request