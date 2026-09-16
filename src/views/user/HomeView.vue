<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PubShell from '@/components/PubShell.vue'
import { COMPLAINT_NO_EXAMPLE, lookupComplaint } from '@/utils/lookup'

const router = useRouter()
const code = ref('')
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
  <PubShell>
    <p class="eyebrow">판교 오피스 B동</p>
    <h1 class="display" style="font-size: 31px; margin-top: 8px">시설 민원 접수</h1>
    <p class="lede" style="margin-top: 8px">시설 이용 중 불편한 점을 알려주세요.</p>

    <div class="home-grid">
      <div class="hcol">
        <p class="ht">새 민원을 등록하시나요?</p>
        <p class="hd">위치와 증상을 남겨주세요.</p>
        <button class="btn lg" style="margin-top: 18px" @click="router.push('/report')">민원 등록하기</button>
      </div>

      <div class="hcol">
        <p class="ht">접수한 민원을 확인하시나요?</p>
        <label class="label" for="home-no" style="margin-top: 14px">민원 번호</label>
        <div class="lookup-row">
          <input id="home-no" v-model="code" class="input mono" :class="{ invalid: err }"
            :placeholder="COMPLAINT_NO_EXAMPLE" @keyup.enter="go" @input="err = ''" />
          <button class="btn line" :disabled="busy" @click="go">{{ busy ? '확인 중…' : '조회' }}</button>
        </div>
        <p v-if="err" class="ferr">{{ err }}</p>
        <p v-else class="hint" style="margin-top: 6px">비밀번호 없이 확인할 수 있습니다.</p>
      </div>
    </div>

    <!-- 위험한 상황은 시스템보다 전화가 빠르다 -->
    <div class="note warn" style="margin-top: 40px; display: flex; align-items: baseline; gap: 8px 18px; flex-wrap: wrap; padding: 13px 16px">
      <strong style="font-size: 13.5px">누수 · 정전 · 승강기 갇힘 같은 긴급 상황은 전화가 빠릅니다.</strong>
      <span style="margin-left: auto">긴급 직통
        <a href="tel:0234567899" class="mono" style="font-weight: 700; font-size: 15.5px; color: var(--alert)">02-3456-7899</a></span>
      <span>관리실
        <a href="tel:0234567800" class="mono" style="font-weight: 700; font-size: 15.5px; color: var(--ink)">02-3456-7800</a></span>
    </div>
  </PubShell>
</template>
