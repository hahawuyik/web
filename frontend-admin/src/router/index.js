import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true, role: ['admin', 'moderator'] },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', role: ['admin'] }
      },
      {
        path: 'posts',
        name: 'Posts',
        component: () => import('@/views/Posts.vue'),
        meta: { title: '帖子管理' }
      },
      {
        path: 'replies',
        name: 'Replies',
        component: () => import('@/views/Replies.vue'),
        meta: { title: '回复管理' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/Reports.vue'),
        meta: { title: '举报处理' }
      },
      {
        path: 'forums',
        name: 'Forums',
        component: () => import('@/views/Forums.vue'),
        meta: { title: '版块管理' }
      },
      {
        path: 'ai-assistants',
        name: 'AiAssistants',
        component: () => import('@/views/AiAssistants.vue'),
        meta: { title: 'AI助手管理', role: ['admin'] }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '系统设置', role: ['admin'] }
      },
      {
        path: 'notifications',
        name: 'Notifications',
        component: () => import('@/views/Notifications.vue'),
        meta: { title: '公告通知', role: ['admin'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  const userInfo = JSON.parse(localStorage.getItem('admin_info') || '{}')
  
  if (to.meta.requiresAuth !== false) {
    if (!token) {
      next('/login')
    } else {
      // 检查角色权限
      if (to.meta.role && !to.meta.role.includes(userInfo.role)) {
        next('/dashboard')
      } else {
        next()
      }
    }
  } else {
    if (to.path === '/login' && token) {
      next('/')
    } else {
      next()
    }
  }
})

export default router