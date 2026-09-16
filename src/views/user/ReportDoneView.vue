<script setup>
import { useRoute, useRouter } from 'vue-router'
import PubShell from '@/components/PubShell.vue'

const route = useRoute(); const router = useRouter()
const id = route.params.id
</script>

<template>
  <PubShell narrow>
    <div style="padding: 56px 0 30px">
      <p class="eyebrow">접수 완료</p>
      <h1 class="display" style="font-size: 30px; margin-top: 10px">접수됐습니다</h1>
      <p class="lede" style="font-size: 14px; margin-top: 8px">담당 기사가 배정되면 상태가 바뀝니다.</p>
    </div>

    <div style="border-top: 1px solid var(--line-2); border-bottom: 1px solid var(--line-2); padding: 26px 0">
      <p class="sect" style="border: 0; padding: 0; margin-bottom: 8px">민원 번호</p>
      <div class="mono" style="font-size: 30px; font-weight: 700; color: var(--ink); letter-spacing: 0.02em">{{ id }}</div>
    </div>

    <p class="note warn" style="margin-top: 20px">
      <strong>번호를 저장해 주세요.</strong><br />
      신고자 정보를 따로 받지 않기 때문에, 번호를 잃으면 접수 내역을 찾을 방법이 없습니다.
    </p>

    <div class="btn-row" style="margin-top: 26px">
      <button class="btn" @click="router.replace({ name: 'complaint', params: { id } })">처리 상황 보기</button>
      <button class="btn line" @click="router.replace('/')">홈으로</button>
    </div>
  </PubShell>
</template>
