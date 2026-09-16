<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PubShell from '@/components/PubShell.vue'

const router = useRouter(); const code = ref('')
const go = () => { const id = code.value.trim().toUpperCase(); if (id) router.push({ name: 'complaint', params: { id } }) }
</script>

<template>
  <PubShell narrow>
    <div style="padding: 64px 0 28px">
      <p class="eyebrow">접수 내역 조회</p>
      <h1 class="display" style="font-size: 30px; margin-top: 10px">민원 번호를 입력하세요</h1>
    </div>

    <input v-model="code" class="input mono" style="font-size: 17px; padding: 13px" placeholder="M-260915-A7K2Q9" @keyup.enter="go" />
    <button class="btn lg wide" style="margin-top: 10px" @click="go">조회하기</button>

    <div class="note" style="margin-top: 22px">
      <strong>비밀번호 없이 볼 수 있습니다.</strong><br />
      처리 상황을 확인하려는 사람에게 다시 관문을 두지 않기 위해서입니다.
      신고자 이름·연락처 같은 개인 정보는 처음부터 수집하지 않습니다.
    </div>
  </PubShell>
</template>
