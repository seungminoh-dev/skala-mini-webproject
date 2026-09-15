<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const props = defineProps({ role: { type: String, required: true } })
const route = useRoute()

const TABS = {
  USER: [
    { to: '/', glyph: '⌂', label: '홈' },
    { to: '/report', glyph: '＋', label: '신고' },
    { to: '/lookup', glyph: '⌕', label: '조회' }
  ],
  WORKER: [
    { to: '/worker', glyph: '☰', label: '미배정' },
    { to: '/worker/tasks', glyph: '✓', label: '내 작업' },
    { to: '/staff/login', glyph: '◎', label: '계정' }
  ],
  ADMIN: [
    { to: '/admin', glyph: '▦', label: '현황' },
    { to: '/admin/complaints', glyph: '☰', label: '민원' },
    { to: '/admin/stats', glyph: '◫', label: '통계' }
  ]
}

const tabs = computed(() => TABS[props.role] ?? [])
const isActive = (to) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>

<template>
  <nav class="tabbar">
    <router-link v-for="t in tabs" :key="t.to" :to="t.to" :class="{ active: isActive(t.to) }">
      <span class="glyph">{{ t.glyph }}</span>
      <span>{{ t.label }}</span>
    </router-link>
  </nav>
</template>
