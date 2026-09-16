<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/stores/auth'
import { TERMS } from '@/utils/labels'

defineProps({
  title: { type: String, required: true },
  sub: { type: String, default: '' }
})

const route = useRoute()
const router = useRouter()

const NAV = {
  WORKER: [
    { to: '/worker', label: TERMS.waitingList },
    { to: '/worker/tasks', label: '내 작업' }
  ],
  ADMIN: [
    { to: '/admin', label: '운영 현황' },
    { to: '/admin/complaints', label: '민원 전체' },
    { to: '/admin/stats', label: '통계' }
  ]
}
const nav = computed(() => NAV[auth.state.user?.role] ?? [])
const roleName = computed(() => (auth.state.user?.role === 'ADMIN' ? TERMS.admin : TERMS.worker))
const isActive = (to) => (to === '/worker' || to === '/admin' ? route.path === to : route.path.startsWith(to))

function signOut() {
  auth.logout()
  router.push('/staff/login')
}
</script>

<template>
  <div class="shell">
    <aside class="rail">
      <div class="wordmark">
        FMS
        <small>판교 오피스 B동 시설관리</small>
      </div>
      <div class="rail-label">업무</div>
      <nav>
        <router-link v-for="n in nav" :key="n.to" :to="n.to" :class="{ active: isActive(n.to) }">
          {{ n.label }}
        </router-link>
      </nav>
      <div class="rail-foot">
        <strong>{{ auth.state.user?.name }}</strong>
        {{ roleName }}
        <div style="margin-top: 8px">
          <button class="btn line" style="padding: 4px 10px; font-size: 12px" @click="signOut">로그아웃</button>
        </div>
      </div>
    </aside>

    <main class="work">
      <header class="pagehead">
        <div>
          <h1>{{ title }}</h1>
          <p v-if="sub" class="sub">{{ sub }}</p>
        </div>
        <span class="grow" />
        <slot name="actions" />
      </header>
      <slot name="toolbar" />
      <slot />
    </main>
  </div>
</template>
