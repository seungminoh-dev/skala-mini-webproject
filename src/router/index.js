import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/stores/auth'

const routes = [
  // USER — 비인증
  { path: '/', name: 'home', component: () => import('@/views/user/HomeView.vue') },
  { path: '/report', name: 'report', component: () => import('@/views/user/ReportView.vue') },
  { path: '/report/:id/done', name: 'report-done', component: () => import('@/views/user/ReportDoneView.vue') },
  { path: '/lookup', name: 'lookup', component: () => import('@/views/user/LookupView.vue') },
  { path: '/complaints/:id', name: 'complaint', component: () => import('@/views/user/ComplaintDetailView.vue') },
  { path: '/complaints/:id/edit', name: 'complaint-edit', component: () => import('@/views/user/ComplaintEditView.vue') },

  // 직원 공통
  { path: '/staff/login', name: 'login', component: () => import('@/views/staff/LoginView.vue') },

  // WORKER
  { path: '/worker', name: 'worker-unassigned', component: () => import('@/views/worker/UnassignedView.vue'), meta: { role: 'WORKER' } },
  { path: '/worker/tasks', name: 'worker-tasks', component: () => import('@/views/worker/MyTasksView.vue'), meta: { role: 'WORKER' } },
  { path: '/worker/complaints/:id', name: 'worker-complaint', component: () => import('@/views/worker/WorkerDetailView.vue'), meta: { role: 'WORKER' } },
  { path: '/worker/complaints/:id/complete', name: 'worker-complete', component: () => import('@/views/worker/CompleteView.vue'), meta: { role: 'WORKER' } },

  // ADMIN
  { path: '/admin', name: 'admin-dashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { role: 'ADMIN' } },
  { path: '/admin/complaints', name: 'admin-complaints', component: () => import('@/views/admin/ComplaintsView.vue'), meta: { role: 'ADMIN' } },
  { path: '/admin/complaints/:id', name: 'admin-complaint', component: () => import('@/views/admin/AdminDetailView.vue'), meta: { role: 'ADMIN' } },
  { path: '/admin/complaints/:id/reject', name: 'admin-reject', component: () => import('@/views/admin/RejectView.vue'), meta: { role: 'ADMIN' } },
  { path: '/admin/stats', name: 'admin-stats', component: () => import('@/views/admin/StatsView.vue'), meta: { role: 'ADMIN' } },

  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({ history: createWebHistory(), routes })

// 역할 기반 인가. USER 경로는 인증을 요구하지 않는다.
router.beforeEach((to) => {
  const need = to.meta.role
  if (!need) return true
  const u = auth.state.user
  if (!u) return { name: 'login', query: { redirect: to.fullPath } }
  if (u.role !== need) return u.role === 'ADMIN' ? { name: 'admin-dashboard' } : { name: 'worker-unassigned' }
  return true
})

export default router
