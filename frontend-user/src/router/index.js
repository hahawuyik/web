import { createRouter, createWebHistory } from 'vue-router'
import Intro from '@/views/Intro.vue'
import Encounter from '@/views/Encounter.vue'

const routes = [
  {path: '/intro', name: 'Intro', component: Intro},
  { path: '/', name: 'Home', component: () => import('@/views/Home.vue') },
  { path: '/forum/:id', name: 'Forum', component: () => import('@/views/Forum.vue') },
  { path: '/post/:id', name: 'PostDetail', component: () => import('@/views/PostDetail.vue') },
  { path: '/post/create', name: 'PostCreate', component: () => import('@/views/PostCreate.vue'), meta: { requiresAuth: true } },
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { guest: true } },
  { path: '/register', name: 'Register', component: () => import('@/views/Register.vue'), meta: { guest: true } },
  { path: '/reset-password', name: 'ResetPassword', component: () => import('@/views/ResetPassword.vue'), meta: { guest: true } },
  { path: '/profile', name: 'Profile', component: () => import('@/views/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/profile/edit', name: 'ProfileEdit', component: () => import('@/views/ProfileEdit.vue'), meta: { requiresAuth: true } },
  { path: '/my-posts', name: 'MyPosts', component: () => import('@/views/MyPosts.vue'), meta: { requiresAuth: true } },
  { path: '/my-replies', name: 'MyReplies', component: () => import('@/views/MyReplies.vue'), meta: { requiresAuth: true } },
  { path: '/my-favorites', name: 'MyFavorites', component: () => import('@/views/MyFavorites.vue'), meta: { requiresAuth: true } },
  { path: '/notifications', name: 'Notifications', component: () => import('@/views/Notifications.vue'), meta: { requiresAuth: true } },
  { path: '/search', name: 'Search', component: () => import('@/views/Search.vue') },
  { path: '/weekly-report', name: 'WeeklyReport', component: () => import('@/views/WeeklyReport.vue'), meta: {requiresAuth: true} },
  {path: '/encounter',name: 'Encounter',component: Encounter},
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// frontend-user/src/router/index.js
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')

  // 未登录访问首页 -> Intro
  if (to.path === '/' && !token) {
    return '/intro'
  }

  // 登录后访问 Intro -> Home
  if (to.path === '/intro' && token) {
    return '/'
  }

  if (to.meta.requiresAuth && !token) {
    return '/login'
  }

  if (to.meta.guest && token) {
    return '/'
  }

  return true
})

export default router