<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBar from '@/components/AppBar.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ModalSheet from '@/components/ModalSheet.vue'
import { cancelComplaint, getComplaint, verifyPassword } from '@/mock/api'
import { categoryName, priorityName, rejectReasonName } from '@/mock/constants'
import { actionLabel, durationLabel, formatDateTime } from '@/utils/format'
import { verifyStore } from '@/stores/verify'
import { devModal } from '@/utils/devModal'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const complaint = ref(null)
const loading = ref(true)
const loadError = ref('')

const mode = ref(null) // 'edit' | 'cancel'
const pw = ref('')
const pwError = ref('')
const pwBusy = ref(false)
const confirmCancel = ref(false)
const cancelBusy = ref(false)

onMounted(load)

async function load() {
  loading.value = true
  try {
    complaint.value = await getComplaint(id)
  } catch (e) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
  if (devModal('pw')) mode.value = 'edit'
  if (devModal('cancel')) { verifyStore.set(id, '0000'); confirmCancel.value = true }
}

const editable = () => complaint.value?.status === 'RECEIVED'

function openPassword(next) {
  mode.value = next
  pw.value = ''
  pwError.value = ''
}

async function submitPassword() {
  if (pw.value.length !== 4 || pwBusy.value) return
  pwBusy.value = true
  pwError.value = ''
  try {
    await verifyPassword(id, pw.value)
    verifyStore.set(id, pw.value)
    if (mode.value === 'edit') {
      mode.value = null
      router.push({ name: 'complaint-edit', params: { id } })
    } else {
      mode.value = null
      confirmCancel.value = true
    }
  } catch (e) {
    pwError.value = e.message
  } finally {
    pwBusy.value = false
  }
}

async function doCancel() {
  cancelBusy.value = true
  try {
    await cancelComplaint(id, verifyStore.get(id))
    verifyStore.clear(id)
    confirmCancel.value = false
    await load()
  } catch (e) {
    loadError.value = e.message
    confirmCancel.value = false
  } finally {
    cancelBusy.value = false
  }
}
</script>

<template>
  <AppBar title="민원 상세" :back="{ path: '/' }" />

  <main class="screen narrow">
    <p v-if="loading" class="empty">불러오는 중…</p>

    <div v-else-if="loadError" class="notice error">{{ loadError }}</div>

    <template v-else-if="complaint">
      <div style="display: flex; align-items: center; justify-content: space-between">
        <StatusBadge :status="complaint.status" />
        <span style="font-size: 11.5px; color: var(--text-3)">{{ complaint.id }}</span>
      </div>

      <h2 style="font-size: 18px; margin: 10px 0 14px; line-height: 1.4">{{ complaint.title }}</h2>

      <div class="card">
        <div class="kv">
          <div>
            <div class="k">위치</div>
            <div class="v">{{ complaint.floor }} · {{ complaint.space }}</div>
          </div>
          <div>
            <div class="k">설비 카테고리</div>
            <div class="v">{{ categoryName(complaint.categoryCode) }}</div>
          </div>
          <div>
            <div class="k">우선순위</div>
            <div class="v">{{ priorityName(complaint.priority) }}</div>
          </div>
          <div>
            <div class="k">담당자</div>
            <div class="v">{{ complaint.assigneeName ?? '미배정' }}</div>
          </div>
        </div>
      </div>

      <div class="section-title">신고 내용</div>
      <div class="card">
        <p style="font-size: 13.5px; line-height: 1.6; margin: 0; white-space: pre-wrap">{{ complaint.content }}</p>
        <div v-if="complaint.photos?.length" class="chips" style="margin-top: 10px">
          <span v-for="(p, i) in complaint.photos" :key="i" class="chip">{{ p }}</span>
        </div>
      </div>

      <template v-if="complaint.resolution">
        <div class="section-title">조치 결과</div>
        <div class="card">
          <p style="font-size: 13.5px; line-height: 1.6; margin: 0 0 8px">{{ complaint.resolution.content }}</p>
          <div class="hint">소요 시간 {{ durationLabel(complaint.resolution.durationMinutes) }}</div>
        </div>
      </template>

      <template v-if="complaint.reject">
        <div class="section-title">반려 사유</div>
        <div class="card">
          <div style="font-weight: 700; font-size: 13.5px; margin-bottom: 4px">
            {{ rejectReasonName(complaint.reject.reasonType) }}
          </div>
          <p style="font-size: 13px; line-height: 1.6; margin: 0; color: var(--text-2)">
            {{ complaint.reject.reason }}
          </p>
          <router-link
            v-if="complaint.originalComplaint"
            class="notice info"
            style="display: block; margin-top: 10px"
            :to="{ name: 'complaint', params: { id: complaint.originalComplaint.id } }"
          >
            원본 민원 {{ complaint.originalComplaint.id }} ›<br />
            {{ complaint.originalComplaint.title }}
          </router-link>
        </div>
      </template>

      <div class="section-title">처리 이력</div>
      <div class="card">
        <div class="timeline">
          <div v-for="(h, i) in complaint.history" :key="i" class="node">
            <div class="act">{{ actionLabel(h.action) }}</div>
            <div class="at">{{ formatDateTime(h.at) }} · {{ h.actorName }}{{ h.note ? ` · ${h.note}` : '' }}</div>
          </div>
        </div>
      </div>

      <!-- E-02: 배정 이후에는 수정·취소가 불가능함을 화면에서 먼저 알린다 -->
      <div v-if="!editable()" class="notice warn" style="margin-top: 16px">
        <strong>수정·취소할 수 없습니다</strong><br />
        이미 배정되었거나 종료된 민원입니다. 추가 사항은 새로 신고해 주세요.
      </div>

      <div class="btn-row" style="margin-top: 12px">
        <button class="btn ghost" :disabled="!editable()" @click="openPassword('edit')">수정</button>
        <button class="btn danger-ghost" :disabled="!editable()" @click="openPassword('cancel')">취소</button>
      </div>
    </template>
  </main>

  <!-- U-06 비밀번호 확인 -->
  <ModalSheet v-if="mode" @close="mode = null">
    <h2 style="text-align: left">4자리 비밀번호 확인</h2>
    <p style="text-align: left">
      {{ mode === 'edit' ? '수정하려면' : '취소하려면' }} 접수 시 입력한 비밀번호가 필요합니다.
    </p>
    <label class="label">비밀번호</label>
    <input
      v-model="pw"
      class="input"
      inputmode="numeric"
      maxlength="4"
      placeholder="●●●●"
      :style="pwError ? 'border-color: var(--red)' : ''"
      @keyup.enter="submitPassword"
    />
    <p v-if="pwError" class="hint" style="color: var(--red); margin-top: 6px">{{ pwError }}</p>
    <button class="btn" style="margin-top: 14px" :disabled="pw.length !== 4 || pwBusy" @click="submitPassword">
      {{ pwBusy ? '확인 중…' : '확인' }}
    </button>
    <button class="btn ghost" @click="mode = null">닫기</button>
  </ModalSheet>

  <!-- E-03 민원 취소 확인 -->
  <ModalSheet
    v-if="confirmCancel"
    center
    icon="!"
    icon-tone="red"
    title="민원을 취소하시겠습니까?"
    message="취소한 민원은 되돌릴 수 없으며 상태가 취소됨으로 변경됩니다."
    @close="confirmCancel = false"
  >
    <button class="btn danger" :disabled="cancelBusy" @click="doCancel">
      {{ cancelBusy ? '처리 중…' : '민원 취소' }}
    </button>
    <button class="btn ghost" @click="confirmCancel = false">계속 유지</button>
  </ModalSheet>
</template>
