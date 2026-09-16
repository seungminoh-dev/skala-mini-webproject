<script setup>
defineProps({ narrow: { type: Boolean, default: false } })
</script>

<template>
  <div class="app">
    <header class="pub-top">
      <router-link to="/" class="wordmark">FMS</router-link>
      <span class="bld">판교 오피스 B동</span>
      <span class="grow" />
      <span class="bld" style="border: 0; padding: 0">관리실 <b class="mono" style="color: #fff">02-3456-7800</b></span>
      <router-link to="/">처음으로</router-link>
      <router-link to="/staff/login">직원 로그인</router-link>
    </header>
    <div class="pub">
      <div class="pub-inner" :class="{ 'pub-narrow': narrow }">
        <slot />
      </div>
    </div>
    <footer class="pub-foot">
      <div class="pub-inner">
        <span>관리실 <b class="mono">02-3456-7800</b></span>
        <span>긴급 — 승강기 갇힘 · 정전 · 누전 <b class="mono">02-3456-7899</b></span>
        <span class="grow" />
        <span>평일 09:00 – 18:00 · 그 외 시간 접수분은 다음 근무일 처리</span>
      </div>
    </footer>
  </div>
</template>
