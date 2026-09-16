<script setup>
// U-03 접수 완료 — 접수증과 조회 수단 보관 (개편 기획 6.3)
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PubShell from '@/components/PubShell.vue'
import { getComplaint } from '@/mock/api'
import { categoryName } from '@/mock/constants'
import { formatDateTime } from '@/utils/format'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const c = ref(null); const loading = ref(true); const failed = ref(false)
const copied = ref('') // 'no' | 'link' | 'fail'

onMounted(async () => {
  try { c.value = await getComplaint(id) } catch { failed.value = true } finally { loading.value = false }
})

const detailUrl = () => new URL(router.resolve({ name: 'complaint', params: { id } }).href, location.origin).href

async function copy(kind) {
  const text = kind === 'no' ? id : detailUrl()
  try {
    await navigator.clipboard.writeText(text)
    copied.value = kind
  } catch { copied.value = 'fail' }
}
</script>

<template>
  <PubShell narrow>
    <p v-if="loading" class="empty">불러오는 중…</p>

    <template v-else-if="failed">
      <div style="padding: 20px 0 26px">
        <h1 class="display" style="font-size: 28px">접수 내역을 찾을 수 없습니다</h1>
        <p class="lede" style="font-size: 14.5px; margin-top: 8px">주소가 잘못됐을 수 있습니다. 민원 번호로 다시 조회해 주세요.</p>
      </div>
      <div class="btn-row">
        <button class="btn" @click="router.replace({ name: 'lookup', query: { no: id } })">번호로 조회하기</button>
        <button class="btn line" @click="router.replace('/')">처음으로</button>
      </div>
    </template>

    <template v-else-if="c">
      <div style="padding: 20px 0 24px">
        <p class="eyebrow">접수 완료</p>
        <h1 class="display" style="font-size: 30px; margin-top: 10px">접수됐습니다</h1>
        <p class="lede" style="font-size: 14.5px; margin-top: 8px">담당 기사가 배정되면 처리 상황에서 확인할 수 있습니다.</p>
      </div>

      <div class="receipt">
        <p style="font-size: 16.5px; font-weight: 700; color: var(--ink)">{{ c.title }}</p>
        <p class="hint" style="margin-top: 5px">{{ c.floor }} {{ c.space }} · {{ categoryName(c.categoryCode) }} · {{ formatDateTime(c.createdAt) }} 접수</p>

        <div style="border-top: 1px solid var(--line); margin-top: 18px; padding-top: 16px">
          <p class="rk">민원 번호</p>
          <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 6px">
            <span class="mono" style="font-size: 26px; font-weight: 700; color: var(--ink); letter-spacing: 0.02em">{{ id }}</span>
            <button class="btn line sm" @click="copy('no')">번호 복사</button>
            <button class="btn line sm" @click="copy('link')">조회 링크 복사</button>
          </div>
          <p v-if="copied === 'no'" class="hint" style="color: var(--blue); margin-top: 7px">민원 번호를 복사했습니다.</p>
          <p v-else-if="copied === 'link'" class="hint" style="color: var(--blue); margin-top: 7px">조회 링크를 복사했습니다.</p>
          <p v-else-if="copied === 'fail'" class="ferr" style="margin-top: 7px">
            복사하지 못했습니다. 위 번호를 직접 선택해 복사해 주세요.
          </p>
        </div>
      </div>

      <p class="hint" style="margin-top: 14px">
        다시 확인할 수 있도록 번호나 조회 링크를 보관해 주세요.
        신고자 정보를 따로 받지 않아, 번호를 잃으면 접수 내역을 찾을 방법이 없습니다.
      </p>

      <div class="btn-row" style="margin-top: 26px">
        <button class="btn lg" @click="router.replace({ name: 'complaint', params: { id } })">처리 상황 보기</button>
        <router-link to="/" class="backlink" style="align-self: center">처음으로</router-link>
      </div>
    </template>
  </PubShell>
</template>
