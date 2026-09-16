<script setup>
// 직원 로그인 — 사내 업무 시스템의 로그인 문법을 따른다.
// 홍보 문구·스플릿 레이아웃 없이: 상단 브랜드 밴드 + 중앙 폼 + 관리자 문의 한 줄.
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '@/mock/api'
import { auth } from '@/stores/auth'

const route = useRoute(); const router = useRouter()
const employeeNo = ref(''); const password = ref(''); const busy = ref(false); const error = ref('')
const isCapture = new URLSearchParams(location.search).has('capture')

async function submit() {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    const u = await login(employeeNo.value.trim().toUpperCase(), password.value)
    auth.setUser(u)
    const r = route.query.redirect
    router.replace(r ? String(r) : u.role === 'ADMIN' ? '/admin' : '/worker')
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
const fill = (no) => { employeeNo.value = no; password.value = '1234' }
</script>

<template>
  <div style="min-height: 100dvh; display: flex; flex-direction: column; background: var(--paper)">
    <header class="pub-top">
      <span class="wordmark">FMS</span>
      <span class="bld">판교 오피스 B동 시설관리</span>
      <span class="grow" />
      <router-link to="/">신고자 화면으로</router-link>
    </header>

    <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px 20px">
      <div style="width: 100%; max-width: 360px">
        <div style="background: var(--surface); border: 1px solid var(--line-2); border-radius: var(--r); padding: 30px 28px 26px">
          <h1 style="font-size: 19px; font-weight: 700; color: var(--ink)">직원 로그인</h1>
          <p class="hint" style="margin-top: 4px">관리소장 · 시설기사 전용</p>

          <div class="field" style="margin-top: 22px">
            <label class="label">사번</label>
            <input v-model="employeeNo" class="input mono" placeholder="예) W001" autocomplete="username" @keyup.enter="submit" />
          </div>
          <div class="field">
            <label class="label">비밀번호</label>
            <input v-model="password" type="password" class="input" autocomplete="current-password" @keyup.enter="submit" />
          </div>

          <p v-if="error" class="note warn" style="margin-top: 14px">{{ error }}</p>
          <button class="btn wide lg" style="margin-top: 18px" :disabled="busy" @click="submit">
            {{ busy ? '확인 중…' : '로그인' }}
          </button>

          <p class="hint" style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line)">
            계정·비밀번호 문의 — 관리소장 <span class="mono">02-3456-7800</span>
          </p>
        </div>

        <div v-if="!isCapture" style="margin-top: 14px; padding: 12px 14px; border: 1px dashed var(--line-2); border-radius: var(--r)">
          <p class="hint" style="margin-bottom: 7px">시연 계정 · 비밀번호 1234</p>
          <div class="filters">
            <button class="ftog" @click="fill('S001')">S001 정영배 · 소장</button>
            <button class="ftog" @click="fill('W001')">W001 김도현 · 기사</button>
            <button class="ftog" @click="fill('W005')">W005 정민수 · 기사</button>
          </div>
        </div>
      </div>
    </div>

    <footer style="padding: 14px 32px; border-top: 1px solid var(--line); font-size: 11.5px; color: var(--muted); display: flex; gap: 16px">
      <span>판교 오피스 B동 시설관리</span>
      <span class="mono">v0.1</span>
      <span style="flex: 1" />
      <span>평일 09:00 – 18:00</span>
    </footer>
  </div>
</template>
