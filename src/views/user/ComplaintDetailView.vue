<script setup>
// U-05 민원 상세 — 상태별 정보 위계 (개편 기획 6.5, 6.6)
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PubShell from '@/components/PubShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import AppDialog from '@/components/AppDialog.vue'
import { cancelComplaint, getComplaint, verifyPassword } from '@/mock/api'
import { categoryName, priorityName, rejectReasonName } from '@/mock/constants'
import { statusMark } from '@/utils/labels'
import { actionLabel, durationLabel, formatDateTime, minutesBetween } from '@/utils/format'
import { COMPLAINT_NO_EXAMPLE, lookupComplaint } from '@/utils/lookup'
import { verifyStore } from '@/stores/verify'
import { devModal } from '@/utils/devModal'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const c = ref(null); const loading = ref(true); const loadError = ref('')
const loadedAt = ref(null); const refreshing = ref(false)
const mode = ref(null); const pw = ref(''); const pwError = ref(''); const pwBusy = ref(false)
const confirmCancel = ref(false); const cancelBusy = ref(false)
const raceMsg = ref('')     // 배정 경합 안내
const updatedMsg = ref(false) // 수정 직후 안내
const copied = ref('')
const retryNo = ref(String(id ?? ''))
const retryErr = ref('')

onMounted(async () => {
  await load()
  if (route.query.updated) {
    updatedMsg.value = true
    router.replace({ name: 'complaint', params: { id } }) // 주소에서 플래그 제거
  }
  if (devModal('pw')) mode.value = 'edit'
  if (devModal('cancel')) { verifyStore.set(id, '0000'); confirmCancel.value = true }
})

async function load() {
  try {
    c.value = await getComplaint(id)
    loadedAt.value = new Date()
    loadError.value = ''
  } catch (e) { loadError.value = e.message } finally { loading.value = false }
}
async function refresh() {
  if (refreshing.value) return
  refreshing.value = true
  await load()
  refreshing.value = false
}

const open = () => c.value?.status === 'RECEIVED'
const isDup = computed(() => c.value?.reject?.reasonType === 'DUPLICATE')

// 상태명과 설명은 분리해서 말한다
const heroName = computed(() => {
  if (!c.value) return ''
  if (c.value.status === 'REJECTED') return isDup.value ? '중복 접수' : '접수 반려'
  return { RECEIVED: '접수 완료', IN_PROGRESS: '작업 중', COMPLETED: '처리 완료', CANCELED: '접수 취소' }[c.value.status] ?? c.value.status
})
const heroDesc = computed(() => {
  if (!c.value) return ''
  switch (c.value.status) {
    case 'RECEIVED': return '담당 기사 배정을 기다리고 있습니다.'
    case 'IN_PROGRESS': return c.value.assigneeName ? `${c.value.assigneeName} 시설기사가 맡고 있습니다.` : '담당 기사가 작업 중입니다.'
    case 'COMPLETED': return c.value.completedAt ? `${formatDateTime(c.value.completedAt)}에 처리가 완료됐습니다.` : '처리가 완료됐습니다.'
    case 'REJECTED': return isDup.value
      ? '같은 문제가 이미 접수되어 있습니다. 기존 민원에서 처리 상황을 확인해 주세요.'
      : '접수를 처리하지 않기로 했습니다. 아래 사유를 확인해 주세요.'
    case 'CANCELED': return '신고자가 접수를 철회한 민원입니다.'
    default: return ''
  }
})

const detailUrl = () => new URL(router.resolve({ name: 'complaint', params: { id } }).href, location.origin).href
async function copy(kind) {
  try {
    await navigator.clipboard.writeText(kind === 'no' ? id : detailUrl())
    copied.value = kind
  } catch { copied.value = 'fail' }
}

function ask(next) { mode.value = next; pw.value = ''; pwError.value = ''; raceMsg.value = '' }
async function submitPw() {
  if (pw.value.length !== 4 || pwBusy.value) return
  pwBusy.value = true; pwError.value = ''
  try {
    await verifyPassword(id, pw.value)
    verifyStore.set(id, pw.value)
    const m = mode.value; mode.value = null
    if (m === 'edit') router.push({ name: 'complaint-edit', params: { id } })
    else confirmCancel.value = true
  } catch (e) {
    // 비밀번호 오류와 상태 변경(배정 경합)을 구분한다
    if (e.code === 'NOT_EDITABLE') {
      mode.value = null
      raceMsg.value = '담당 기사가 배정되어 지금은 수정하거나 취소할 수 없습니다.'
      await load()
    } else pwError.value = e.message
  } finally { pwBusy.value = false }
}
async function doCancel() {
  if (cancelBusy.value) return
  cancelBusy.value = true
  try { await cancelComplaint(id, verifyStore.get(id)); verifyStore.clear(id); confirmCancel.value = false; await load() }
  catch (e) {
    confirmCancel.value = false
    if (e.code === 'NOT_CANCELABLE' || e.code === 'NOT_EDITABLE') {
      raceMsg.value = '담당 기사가 배정되어 지금은 수정하거나 취소할 수 없습니다.'
      await load()
    } else loadError.value = e.message
  } finally { cancelBusy.value = false }
}

async function retry() {
  retryErr.value = ''
  const r = await lookupComplaint(retryNo.value)
  if (r.ok) {
    if (r.id === id) { loading.value = true; await load() }
    else router.push({ name: 'complaint', params: { id: r.id } })
  } else retryErr.value = r.message
}
</script>

<template>
  <PubShell>
    <p v-if="loading" class="empty">불러오는 중…</p>

    <!-- 조회 실패 — 막다른 화면을 만들지 않는다 (UX-05) -->
    <template v-else-if="loadError && !c">
      <router-link to="/" class="backlink">← 처음으로</router-link>
      <div style="max-width: 620px; padding: 18px 0 0">
        <h1 class="display" style="font-size: 27px">민원을 찾을 수 없습니다</h1>
        <p class="lede" style="font-size: 14.5px; margin-top: 8px">번호를 확인하고 다시 조회해 주세요.</p>
        <label class="label" for="re-no" style="margin-top: 22px">민원 번호</label>
        <div class="lookup-row">
          <input id="re-no" v-model="retryNo" class="input mono" :class="{ invalid: retryErr }"
            :placeholder="COMPLAINT_NO_EXAMPLE" @keyup.enter="retry" @input="retryErr = ''" />
          <button class="btn" @click="retry">조회</button>
        </div>
        <p v-if="retryErr" class="ferr">{{ retryErr }}</p>
      </div>
    </template>

    <template v-else-if="c">
      <router-link to="/" class="backlink">← 처음으로</router-link>

      <div style="padding: 16px 0 22px; border-bottom: 1px solid var(--line-2); display: flex; align-items: flex-end; gap: 20px">
        <div style="flex: 1; min-width: 0">
          <div class="shero" :class="statusMark(c.status)">
            <i /><span class="t">{{ heroName }}</span>
          </div>
          <p style="margin-top: 8px; font-size: 15px; color: var(--text)">{{ heroDesc }}</p>
          <h1 style="font-size: 18px; font-weight: 700; color: var(--ink); margin-top: 14px; letter-spacing: -0.01em">{{ c.title }}</h1>
          <p style="margin-top: 8px; font-size: 13.5px; color: var(--muted); display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
            <span>{{ c.floor }} {{ c.space }} · {{ categoryName(c.categoryCode) }} · 긴급도 {{ priorityName(c.priority) }} · {{ formatDateTime(c.createdAt) }} 접수</span>
          </p>
          <p style="margin-top: 7px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
            <span class="mono" style="font-size: 13.5px; color: var(--ink); font-weight: 600">{{ c.id }}</span>
            <button class="btn line sm" @click="copy('no')">번호 복사</button>
            <button class="btn line sm" @click="copy('link')">조회 링크 복사</button>
            <span v-if="copied === 'no'" class="hint" style="color: var(--blue)">민원 번호를 복사했습니다.</span>
            <span v-else-if="copied === 'link'" class="hint" style="color: var(--blue)">조회 링크를 복사했습니다.</span>
            <span v-else-if="copied === 'fail'" class="hint" style="color: var(--alert)">복사하지 못했습니다. 직접 선택해 복사해 주세요.</span>
          </p>
        </div>
        <div v-if="open()" class="btn-row" style="flex: none">
          <button class="btn line" @click="ask('edit')">민원 수정</button>
          <button class="btn warn-line" @click="ask('cancel')">민원 취소</button>
        </div>
      </div>

      <p v-if="updatedMsg" class="note" style="margin-top: 16px"><strong>수정했습니다.</strong> 갱신된 내용은 아래와 처리 이력에서 확인할 수 있습니다.</p>
      <p v-if="raceMsg" class="note warn" style="margin-top: 16px">{{ raceMsg }}</p>

      <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 44px; margin-top: 26px; align-items: start">
        <section>
          <!-- 완료: 조치 결과가 원문보다 먼저 읽힌다 -->
          <template v-if="c.resolution">
            <p class="sect">조치 결과</p>
            <p style="font-size: 15px; line-height: 1.7">{{ c.resolution.content }}</p>
            <p class="hint" style="margin-top: 8px">
              처리 시간 {{ durationLabel(minutesBetween(c.createdAt, c.completedAt)) }} (접수 → 완료){{ c.completedAt ? ` · ${formatDateTime(c.completedAt)} 완료` : '' }}
            </p>
          </template>

          <!-- 중복 반려: 원본의 실제 상태와 연결 (UX-07) -->
          <template v-if="c.reject">
            <template v-if="isDup">
              <p class="sect" :style="c.resolution ? 'margin-top: 30px' : ''">기존 민원</p>
              <router-link v-if="c.originalComplaint" class="note" style="display: block"
                :to="{ name: 'complaint', params: { id: c.originalComplaint.id } }">
                <span style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap">
                  <StatusMark :status="c.originalComplaint.status" who="user" />
                  <strong>{{ c.originalComplaint.title }}</strong>
                  <span class="mono hint">{{ c.originalComplaint.id }}</span>
                </span>
                <span style="display: block; margin-top: 7px; color: var(--blue); font-weight: 600">기존 민원 처리 상황 보기 →</span>
              </router-link>
              <p v-else class="note warn">원본 민원 정보를 불러올 수 없습니다. 관리실 <span class="mono" style="font-weight: 700">02-3456-7800</span>에 문의해 주세요.</p>
            </template>
            <template v-else>
              <p class="sect" :style="c.resolution ? 'margin-top: 30px' : ''">반려 사유</p>
              <p style="font-size: 14.5px; font-weight: 700; color: var(--ink)">{{ rejectReasonName(c.reject.reasonType) }}</p>
              <p style="font-size: 14.5px; line-height: 1.7; margin-top: 4px">{{ c.reject.reason }}</p>
              <p class="hint" style="margin-top: 10px">
                문의는 관리실 <a href="tel:0234567800" class="mono" style="font-weight: 700; color: var(--ink)">02-3456-7800</a>,
                다른 불편 사항은 <router-link to="/report" style="color: var(--blue); font-weight: 600">새 민원 등록</router-link>으로 알려주세요.
              </p>
            </template>
          </template>

          <p class="sect" :style="c.resolution || c.reject ? 'margin-top: 30px' : ''">등록한 내용</p>
          <p style="font-size: 15px; line-height: 1.75; white-space: pre-wrap">{{ c.content }}</p>
          <div v-if="c.photos?.length" class="filelist" style="max-width: 420px">
            <div v-for="(p, i) in c.photos" :key="i" class="f"><span class="mono">{{ p.fileUrl ?? p }}</span></div>
          </div>

          <!-- 작업 중: 강한 경고 대신 필요한 위치의 보조 문장 -->
          <p v-if="c.status === 'IN_PROGRESS'" class="hint" style="margin-top: 22px">
            배정 후에는 내용을 수정할 수 없습니다. 추가로 전달할 내용은 관리실
            <a href="tel:0234567800" class="mono" style="font-weight: 700; color: var(--ink)">02-3456-7800</a>에 문의해 주세요.
          </p>
          <p v-if="c.status === 'CANCELED'" style="margin-top: 22px">
            <router-link to="/report" class="btn line" style="display: inline-block">새 민원 등록</router-link>
          </p>
        </section>

        <section>
          <p class="sect">처리 이력</p>
          <!-- 이력 note 는 내부 운영 정보다. 신고자에게는 보이지 않는다 (P-C) -->
          <div class="timeline">
            <div v-for="(h, i) in c.history" :key="i" class="ev">
              <div class="act">{{ actionLabel(h.action) }}</div>
              <div class="at">{{ formatDateTime(h.at) }} · {{ h.actorName }}</div>
            </div>
          </div>
          <p style="margin-top: 18px; display: flex; align-items: center; gap: 10px">
            <button class="btn line sm" :disabled="refreshing" @click="refresh">{{ refreshing ? '갱신 중…' : '새로고침' }}</button>
            <span v-if="loadedAt" class="hint mono">{{ formatDateTime(loadedAt.toISOString()) }} 확인</span>
          </p>
        </section>
      </div>
    </template>

    <AppDialog v-if="mode"
      :title="mode === 'edit' ? '민원을 수정하려면 비밀번호를 입력해 주세요' : '민원을 취소하려면 비밀번호를 입력해 주세요'"
      message="접수할 때 정한 숫자 4자리를 입력해 주세요."
      @close="mode = null">
      <template #body>
        <input v-model="pw" class="input mono" inputmode="numeric" maxlength="4" placeholder="0000" data-autofocus
          :class="{ invalid: pwError }" @keyup.enter="submitPw" />
        <p v-if="pwError" class="ferr">{{ pwError }}</p>
      </template>
      <template #actions>
        <button class="btn line" @click="mode = null">닫기</button>
        <button class="btn" :disabled="pw.length !== 4 || pwBusy" @click="submitPw">{{ pwBusy ? '확인 중…' : '확인' }}</button>
      </template>
    </AppDialog>

    <AppDialog v-if="confirmCancel" danger title="이 민원을 취소할까요?"
      message="취소한 접수는 되돌릴 수 없습니다. 다시 접수하려면 새 민원을 등록해 주세요."
      @close="confirmCancel = false">
      <template #body>
        <p style="font-size: 14px"><strong style="color: var(--ink)">{{ c?.title }}</strong></p>
        <p class="hint" style="margin-top: 4px">{{ c?.floor }} {{ c?.space }} · <span class="mono">{{ id }}</span></p>
      </template>
      <template #actions>
        <button class="btn line" data-autofocus @click="confirmCancel = false">그대로 두기</button>
        <button class="btn warn" :disabled="cancelBusy" @click="doCancel">{{ cancelBusy ? '처리 중…' : '민원 취소' }}</button>
      </template>
    </AppDialog>
  </PubShell>
</template>
