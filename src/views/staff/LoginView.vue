<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBar from '@/components/AppBar.vue'
import { login } from '@/mock/api'
import { auth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()

const employeeNo = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const user = await login(employeeNo.value.trim().toUpperCase(), password.value)
    auth.setUser(user)
    const redirect = route.query.redirect
    // FR-001: 역할에 따라 진입 화면을 분기한다.
    if (redirect) router.replace(String(redirect))
    else router.replace(user.role === 'ADMIN' ? '/admin' : '/worker')
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

function fill(no) {
  employeeNo.value = no
  password.value = '1234'
}
</script>

<template>
  <AppBar title="직원 로그인" :back="{ path: '/' }" />

  <main class="screen narrow">
    <div style="text-align: center; padding: 26px 0 22px">
      <div
        style="width: 54px; height: 54px; border-radius: 14px; background: var(--blue-weak); color: var(--blue); display: grid; place-items: center; font-size: 22px; margin: 0 auto 14px"
      >
        ▦
      </div>
      <h2 style="font-size: 19px; margin: 0 0 6px">직원 로그인</h2>
      <p class="hint">관리소장과 작업자만 업무 화면에 접근할 수 있습니다.</p>
    </div>

    <div class="field">
      <label class="label">사번</label>
      <input v-model="employeeNo" class="input" placeholder="사번 입력" @keyup.enter="submit" />
    </div>

    <div class="field">
      <label class="label">비밀번호</label>
      <input v-model="password" type="password" class="input" placeholder="비밀번호 입력" @keyup.enter="submit" />
    </div>

    <p v-if="error" class="notice error" style="margin-top: 12px">{{ error }}</p>

    <button class="btn" style="margin-top: 16px" :disabled="busy" @click="submit">
      {{ busy ? '확인 중…' : '로그인' }}
    </button>

    <div class="notice info" style="margin-top: 18px">
      <strong>목 계정</strong> (비밀번호 모두 1234)<br />
      <span style="cursor: pointer; text-decoration: underline" @click="fill('S001')">S001 정소장 · 관리소장</span><br />
      <span style="cursor: pointer; text-decoration: underline" @click="fill('W001')">W001 김작업 · 급배수·위생</span><br />
      <span style="cursor: pointer; text-decoration: underline" @click="fill('W005')">W005 이다목 · 전 카테고리</span>
    </div>
  </main>
</template>
