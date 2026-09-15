// 직원(ADMIN/WORKER) 세션. USER는 비인증이므로 여기에 포함되지 않는다.
import { reactive, computed } from 'vue'

const KEY = 'ofc-auth-v1'

function load() {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

const state = reactive({ user: load() })

export const auth = {
  state,
  user: computed(() => state.user),
  isStaff: computed(() => !!state.user),
  isAdmin: computed(() => state.user?.role === 'ADMIN'),
  isWorker: computed(() => state.user?.role === 'WORKER'),
  setUser(u) {
    state.user = u
    try {
      sessionStorage.setItem(KEY, JSON.stringify(u))
    } catch (e) { /* 무시 */ }
  },
  logout() {
    state.user = null
    try {
      sessionStorage.removeItem(KEY)
    } catch (e) { /* 무시 */ }
  }
}
