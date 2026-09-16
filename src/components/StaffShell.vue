<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/stores/auth'
import { TERMS } from '@/utils/labels'
import { categoryName } from '@/mock/constants'

defineProps({
  title: { type: String, required: true },
  sub: { type: String, default: '' }
})

const route = useRoute()
const router = useRouter()

const NAV = {
  WORKER: [
    { to: '/worker', label: TERMS.unassignedList },
    { to: '/worker/tasks', label: TERMS.myTasks }
  ],
  ADMIN: [
    { to: '/admin', label: TERMS.dashboard },
    { to: '/admin/complaints', label: TERMS.allComplaints },
    { to: '/admin/stats', label: TERMS.stats }
  ]
}
const nav = computed(() => NAV[auth.state.user?.role] ?? [])
const roleName = computed(() => (auth.state.user?.role === 'ADMIN' ? TERMS.admin : TERMS.worker))

// 담당 설비를 레일에 적어 둔다 — 목록마다 "· 는 내 담당" 범례를 다는 것보다 한 번에 읽힌다 (WX-20).
const myCategories = computed(() => {
  const cats = auth.state.user?.categories ?? []
  if (auth.state.user?.role !== 'WORKER') return ''
  if (!cats.length || cats.length >= 6) return '전 설비'
  return cats.map(categoryName).join(' · ')
})

const isActive = (to) => (to === '/worker' || to === '/admin' ? route.path === to : route.path.startsWith(to))

// 행동 피드백 — 이동한 화면 상단에 한 줄. 주소에서 플래그는 바로 지운다 (WX-21).
const DONE_MSG = {
  claimed: '맡았습니다. 내 작업에서 확인할 수 있습니다.',
  completed: '처리 결과를 남겼습니다. 신고자에게 그대로 보입니다.',
  released: '미배정 목록으로 돌려보냈습니다.',
  rejected: '반려했습니다. 신고자에게 사유가 보입니다.'
}
const doneMsg = ref('')
onMounted(() => {
  const msg = DONE_MSG[route.query.done]
  if (!msg) return
  doneMsg.value = msg
  const query = { ...route.query }
  delete query.done
  router.replace({ path: route.path, query })
})

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
        {{ roleName }}<template v-if="myCategories"> · {{ myCategories }}</template>
        <div style="margin-top: 8px">
          <button class="btn line" style="padding: 4px 10px; font-size: 12px" @click="signOut">로그아웃</button>
        </div>
      </div>
    </aside>

    <main class="work">
      <header class="pagehead">
        <div style="min-width: 0">
          <h1>{{ title }}</h1>
          <p v-if="sub" class="sub">{{ sub }}</p>
          <div v-else-if="$slots.sub" class="sub"><slot name="sub" /></div>
        </div>
        <span class="grow" />
        <slot name="actions" />
      </header>
      <slot name="toolbar" />
      <p v-if="doneMsg" class="note shell-note">{{ doneMsg }}</p>
      <slot />
    </main>
  </div>
</template>
