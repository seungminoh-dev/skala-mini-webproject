<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import { getComplaint, listComplaints, rejectComplaint } from '@/mock/api'
import { REJECT_REASONS, categoryName } from '@/mock/constants'
import { auth } from '@/stores/auth'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const c = ref(null); const loading = ref(true)
const reasonType = ref('DUPLICATE'); const reason = ref('')
const keyword = ref(''); const candidates = ref([]); const original = ref(null)
const busy = ref(false); const error = ref('')

onMounted(async () => {
  try { c.value = await getComplaint(id); keyword.value = c.value.title.slice(0, 6); await search() }
  finally { loading.value = false }
})
const needOriginal = computed(() => reasonType.value === 'DUPLICATE')
const valid = computed(() => reason.value.trim() && (!needOriginal.value || original.value))
async function search() {
  const list = await listComplaints({ keyword: keyword.value.trim() || null })
  candidates.value = list.filter((x) => x.id !== id && ['RECEIVED', 'IN_PROGRESS', 'COMPLETED'].includes(x.status))
}
watch(reasonType, (v) => { if (v !== 'DUPLICATE') original.value = null })
async function submit() {
  if (!valid.value || busy.value) return
  busy.value = true; error.value = ''
  try {
    await rejectComplaint(id, { reasonType: reasonType.value, reason: reason.value, originalComplaintId: original.value?.id ?? null }, auth.state.user.name)
    router.replace({ name: 'admin-complaint', params: { id } })
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
</script>

<template>
  <StaffShell title="민원 반려" sub="처리하지 않는 이유를 신고자가 볼 수 있게 남깁니다">
    <template #actions>
      <button class="btn line" @click="router.back()">그만두기</button>
      <button class="btn warn" :disabled="!valid || busy" @click="submit">
        {{ needOriginal ? '원본에 연결해 반려' : '반려하기' }}
      </button>
    </template>

    <div class="page">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <template v-else-if="c">
        <div style="display: flex; align-items: center; gap: 12px">
          <StatusMark :status="c.status" />
          <span class="mono hint">{{ c.id }}</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 700; color: var(--ink); margin: 8px 0 24px">{{ c.title }}</h2>

        <div style="display: grid; grid-template-columns: 1fr 1.1fr; gap: 40px; align-items: start; max-width: 1040px">
          <section>
            <p class="sect">왜 처리하지 않나요</p>
            <div class="filters">
              <button v-for="r in REJECT_REASONS" :key="r.code" class="ftog" :class="{ on: reasonType === r.code }"
                @click="reasonType = r.code">{{ r.name }}</button>
            </div>
            <div class="field" style="margin-top: 16px">
              <label class="label">신고자에게 보일 설명</label>
              <textarea v-model="reason" class="textarea" placeholder="예) 같은 자리 누수가 이미 접수되어 처리 중입니다." />
            </div>
            <p v-if="error" class="note warn" style="margin-top: 14px">{{ error }}</p>
          </section>

          <section v-if="needOriginal">
            <p class="sect">어떤 요청과 같은 건인가요</p>
            <div class="note" style="margin-bottom: 12px">
              중복으로 반려할 때는 원본을 반드시 연결합니다. 신고자는 원본 쪽에서 진행 상황을 봅니다.
            </div>

            <div v-if="original" class="tbl-wrap">
              <table class="tbl"><tbody><tr class="sel">
                <td><div class="title">{{ original.title }}</div><div class="num">{{ original.id }}</div></td>
                <td class="right" style="width: 90px"><button class="btn line" @click="original = null">해제</button></td>
              </tr></tbody></table>
            </div>

            <template v-else>
              <div style="display: flex; gap: 8px; margin-bottom: 10px">
                <input v-model="keyword" class="input" placeholder="제목 또는 민원 번호" @keyup.enter="search" />
                <button class="btn line" @click="search">검색</button>
              </div>
              <p v-if="!candidates.length" class="hint">검색 결과가 없습니다.</p>
              <div v-else class="tbl-wrap">
                <table class="tbl"><tbody>
                  <tr v-for="x in candidates.slice(0, 6)" :key="x.id" style="cursor: pointer" @click="original = x">
                    <td style="width: 100px"><StatusMark :status="x.status" /></td>
                    <td><div class="title">{{ x.title }}</div><div class="num">{{ x.id }} · {{ categoryName(x.categoryCode) }}</div></td>
                  </tr>
                </tbody></table>
              </div>
            </template>
          </section>
        </div>
      </template>
    </div>
  </StaffShell>
</template>
