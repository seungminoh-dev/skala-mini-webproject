<script setup>
// 시연 편의용 컨트롤. 실제 서비스에는 포함되지 않는다.
import { useRouter } from 'vue-router'
import { auth } from '@/stores/auth'
import { resetDb } from '@/mock/api'

const router = useRouter()

function reset() {
  resetDb()
  auth.logout()
  router.push('/')
  setTimeout(() => window.location.reload(), 50)
}
</script>

<template>
  <div class="devbar">
    <span>MOCK</span>
    <button @click="router.push('/')">USER</button>
    <button @click="router.push('/worker')">WORKER</button>
    <button @click="router.push('/admin')">ADMIN</button>
    <button @click="reset">초기화</button>
  </div>
</template>
