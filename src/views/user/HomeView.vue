<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBar from '@/components/AppBar.vue'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const code = ref('')

function lookup() {
  const id = code.value.trim().toUpperCase()
  if (!id) return
  router.push({ name: 'complaint', params: { id } })
}
</script>

<template>
  <AppBar title="시설 민원">
    <template #right>
      <button class="iconbtn" aria-label="도움말">?</button>
    </template>
  </AppBar>

  <main class="screen narrow">
    <p class="hint" style="margin: 4px 0 2px">판교 오피스 B동</p>
    <h2 style="font-size: 23px; line-height: 1.35; margin: 0 0 8px">
      시설 불편을<br />바로 알려주세요
    </h2>
    <p class="hint" style="margin-bottom: 16px">가입 없이 접수하고 처리 상태를 확인할 수 있습니다.</p>

    <div class="card" style="background: var(--blue-weak); border-color: var(--blue-border)">
      <div style="font-weight: 700; font-size: 14.5px">새 민원 신고</div>
      <p class="hint" style="margin: 5px 0 12px">위치와 불편 내용을 입력하면 민원 번호가 발급됩니다.</p>
      <button class="btn" @click="router.push('/report')">민원 신고하기</button>
    </div>

    <div class="card">
      <div style="font-weight: 700; font-size: 14.5px">접수 내역 조회</div>
      <p class="hint" style="margin: 5px 0 12px">민원 번호만으로 상태와 처리 이력을 확인합니다.</p>
      <input
        v-model="code"
        class="input"
        placeholder="민원 번호 입력"
        style="margin-bottom: 8px"
        @keyup.enter="lookup"
      />
      <button class="btn ghost" @click="lookup">조회하기</button>
    </div>

    <p class="hint" style="margin-top: 14px; text-align: center">
      직원은 <router-link to="/staff/login" style="color: var(--blue); font-weight: 700">직원 로그인</router-link>에서
      업무 화면으로 이동합니다.
    </p>
  </main>

  <TabBar role="USER" />
</template>
