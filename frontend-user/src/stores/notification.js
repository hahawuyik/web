import { defineStore } from 'pinia'
import { getNotifications } from '@/api/user'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    unreadCount: 0
  }),
  actions: {
    async fetchUnreadCount() {
      const res = await getNotifications({ page: 1, limit: 1 })
      this.unreadCount = res.count
    }
  }
})