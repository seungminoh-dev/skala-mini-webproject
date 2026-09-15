<script setup>
import { useRoute, useRouter } from 'vue-router'
import AppBar from '@/components/AppBar.vue'

const route = useRoute()
const router = useRouter()
const id = route.params.id
</script>

<template>
  <AppBar title="접수 완료" />

  <main class="screen narrow">
    <div style="text-align: center; padding: 30px 0 20px">
      <div
        class="icon"
        style="width: 62px; height: 62px; border-radius: 50%; background: var(--green-weak); color: var(--green); display: grid; place-items: center; font-size: 30px; margin: 0 auto 16px"
      >
        ✓
      </div>
      <h2 style="font-size: 19px; margin: 0 0 6px">민원이 접수되었습니다</h2>
      <p class="hint">처리 현황은 민원 번호로 언제든 확인할 수 있습니다.</p>
    </div>

    <div class="idbox">
      <div class="k">민원 번호</div>
      <div class="v">{{ id }}</div>
    </div>

    <p class="notice warn" style="margin-top: 14px">
      민원 번호를 저장해 주세요. 별도 로그인이 없으므로 이 번호로 조회·수정·취소합니다.
    </p>

    <button class="btn" style="margin-top: 18px" @click="router.replace({ name: 'complaint', params: { id } })">
      상세 내역 보기
    </button>
    <button class="btn ghost" @click="router.replace('/')">홈으로</button>
  </main>
</template>
