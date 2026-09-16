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
    <div class="entry">
      <button class="entry-card" @click="router.push('/report')">
        <span class="ec-k">01</span>
        <span class="ec-t">민원 신고</span>
        <span class="ec-d">위치와 증상을 입력하면 민원 번호가 발급됩니다</span>
        <span class="ec-go">신고 시작 →</span>
      </button>

      <div class="entry-card is-form">
        <span class="ec-k">02</span>
        <span class="ec-t">접수 내역 조회</span>
        <span class="ec-d">발급받은 민원 번호를 입력하세요</span>
        <input v-model="code" class="input mono" placeholder="M-260915-A7K2Q9" @keyup.enter="go" />
        <button class="btn line wide" style="margin-top: 8px" @click="go">조회</button>
      </div>
    </div>
  </PubShell>
</template>
