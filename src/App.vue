<script setup>
import DevBar from '@/components/DevBar.vue'

// 목 데이터 전환용 도구. ?capture=1 이면 숨긴다 — 문서용 화면 캡처에 찍히지 않도록.
const isDev = import.meta.env.DEV && !new URLSearchParams(location.search).has('capture')
</script>

<template>
  <router-view />
  <DevBar v-if="isDev" />
</template>
