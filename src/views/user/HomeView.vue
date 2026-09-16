<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PubShell from '@/components/PubShell.vue'

const router = useRouter()
const code = ref('')
const go = () => { const id = code.value.trim().toUpperCase(); if (id) router.push({ name: 'complaint', params: { id } }) }
</script>

<template>
  <PubShell>
    <!-- 급한 상황은 시스템보다 전화가 빠르다 — 접수 경로보다 먼저 보여준다 -->
    <div class="note warn" style="margin-top: 28px; display: flex; align-items: baseline; gap: 8px 18px; flex-wrap: wrap; padding: 13px 16px">
      <strong style="font-size: 13.5px">누수 · 정전 · 승강기 갇힘 같은 긴급 상황은 전화가 빠릅니다.</strong>
      <span style="margin-left: auto">긴급 직통
        <span class="mono" style="font-weight: 700; font-size: 15.5px; color: var(--alert)">02-3456-7899</span></span>
      <span>관리실
        <span class="mono" style="font-weight: 700; font-size: 15.5px; color: var(--ink)">02-3456-7800</span></span>
    </div>

    <div class="entry" style="margin-top: 14px">
      <button class="entry-card" @click="router.push('/report')">
        <span class="ec-t">민원 등록</span>
        <span class="ec-d">위치와 증상을 알려주시면 민원 번호가 발급됩니다</span>
        <span class="ec-go">등록 시작 →</span>
      </button>

      <div class="entry-card is-form">
        <span class="ec-t">접수 내역 조회</span>
        <span class="ec-d">발급받은 민원 번호를 입력하세요 — 비밀번호는 필요 없습니다</span>
        <input v-model="code" class="input mono" placeholder="M-260915-A7K2Q9" @keyup.enter="go" />
        <button class="btn line wide" style="margin-top: 8px" @click="go">조회</button>
      </div>
    </div>
  </PubShell>
</template>
