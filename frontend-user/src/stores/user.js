import { defineStore } from 'pinia'
import { login, register } from '@/api/auth'
import { getProfile } from '@/api/user'
import router from '@/router'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('user') || 'null')
  }),
  actions: {
    async login(account, password) {
      const res = await login({ account, password })
      if (res.token) {
        this.token = res.token
        this.userInfo = res.user
        localStorage.setItem('token', res.token)
        localStorage.setItem('user', JSON.stringify(res.user))
        return true
      }
      return false
    },
    async register(data) {
      return await register(data)
    },
    async fetchProfile() {
      const res = await getProfile()
      this.userInfo = res
      localStorage.setItem('user', JSON.stringify(res))
    },
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      router.push('/login')
    }
  }
})