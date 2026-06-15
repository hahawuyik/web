import { defineStore } from 'pinia'
import { login } from '@/api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    userInfo: JSON.parse(localStorage.getItem('admin_info') || '{}')
  }),
  actions: {
    async login(account, password) {
      const res = await login({ account, password })
      if (res.token) {
        this.token = res.token
        this.userInfo = res.user
        localStorage.setItem('admin_token', res.token)
        localStorage.setItem('admin_info', JSON.stringify(res.user))
        return true
      }
      return false
    },
    logout() {
      this.token = ''
      this.userInfo = {}
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
    }
  }
})