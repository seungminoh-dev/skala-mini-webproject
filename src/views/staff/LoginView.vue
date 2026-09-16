<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '@/mock/api'
import { auth } from '@/stores/auth'

const route = useRoute(); const router = useRouter()
const employeeNo = ref(''); const password = ref(''); const busy = ref(false); const error = ref('')

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
  <div style="min-height: 100dvh; display: grid; grid-template-columns: 1.15fr 1fr">
    <div style="background: var(--navy); color: #fff; padding: 56px 56px 44px; display: flex; flex-direction: column">
      <div style="font-size: 15px; font-weight: 700; letter-spacing: 0.16em">FMS</div>
      <div style="margin-top: auto">
        <h1 style="font-size: 34px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.25">
          접수부터 완료까지<br />기록으로 남깁니다
        </h1>
        <p style="color: var(--on-navy-dim); font-size: 14px; margin-top: 16px; max-width: 380px; line-height: 1.7">
          판교 오피스 B동 시설관리. 대기 중인 작업을 직접 맡고, 처리 결과를 남기면 다음 정비의 근거가 됩니다.
        </p>
      </div>
      <p style="color: rgba(159,179,208,.6); font-size: 11.5px; margin-top: 40px">관리소장 · 시설기사 전용</p>
    </div>

    <div style="display: flex; align-items: center; padding: 40px">
      <div style="width: 100%; max-width: 330px; margin: 0 auto">
        <h2 style="font-size: 20px; font-weight: 700; color: var(--ink)">직원 로그인</h2>
        <p class="hint" style="margin-top: 5px">사번으로 들어갑니다.</p>

        <div class="field" style="margin-top: 26px">
          <label class="label">사번</label>
          <input v-model="employeeNo" class="input mono" placeholder="W001" @keyup.enter="submit" />
        </div>
        <div class="field">
          <label class="label">비밀번호</label>
          <input v-model="password" type="password" class="input" @keyup.enter="submit" />
        </div>

        <p v-if="error" class="note warn" style="margin-top: 14px">{{ error }}</p>
        <button class="btn wide lg" style="margin-top: 18px" :disabled="busy" @click="submit">
          {{ busy ? '확인 중…' : '로그인' }}
        </button>

        <div style="margin-top: 26px; padding-top: 16px; border-top: 1px solid var(--line)">
          <p class="hint" style="margin-bottom: 7px">시연 계정 · 비밀번호 1234</p>
          <div class="filters">
            <button class="ftog" @click="fill('S001')">S001 정영배</button>
            <button class="ftog" @click="fill('W001')">W001 김도현</button>
            <button class="ftog" @click="fill('W005')">W005 정민수</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
