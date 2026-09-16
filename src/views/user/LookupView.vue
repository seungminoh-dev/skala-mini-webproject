<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PubShell from '@/components/PubShell.vue'
import { COMPLAINT_NO_EXAMPLE, lookupComplaint } from '@/utils/lookup'

const route = useRoute(); const router = useRouter()
// 상세 직접 진입에 실패해 넘어온 경우 그 번호를 미리 채운다
const code = ref(String(route.query.no ?? ''))
const err = ref('')
const busy = ref(false)

async function go() {
  if (busy.value) return
  busy.value = true; err.value = ''
  const r = await lookupComplaint(code.value)
  busy.value = false
  if (r.ok) router.push({ name: 'complaint', params: { id: r.id } })
  else err.value = r.message
}
</script>

<template>
  <PubShell narrow>
    <router-link to="/" class="backlink">← 처음으로</router-link>
    <div style="padding: 18px 0 26px">
      <h1 class="display" style="font-size: 30px">접수 내역 조회</h1>
      <p class="lede" style="font-size: 14.5px; margin-top: 8px">민원 번호만 있으면 비밀번호 없이 확인할 수 있습니다.</p>
    </div>

    <label class="label" for="lk-no">민원 번호</label>
    <div class="lookup-row">
      <input id="lk-no" v-model="code" class="input mono" :class="{ invalid: err }" style="font-size: 17px"
        :placeholder="COMPLAINT_NO_EXAMPLE" @keyup.enter="go" @input="err = ''" />
      <button class="btn lg" :disabled="busy" @click="go">{{ busy ? '확인 중…' : '조회' }}</button>
    </div>
    <p v-if="err" class="ferr">{{ err }}</p>

    <p class="hint" style="margin-top: 22px">
      번호를 잃어버린 경우 이름·연락처로는 찾을 수 없습니다 — 개인 정보를 수집하지 않기 때문입니다.
      급한 건은 관리실 <a href="tel:0234567800" class="mono" style="font-weight: 700; color: var(--ink)">02-3456-7800</a>으로 문의해 주세요.
    </p>
  </PubShell>
</template>
