<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PubShell from '@/components/PubShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import AppDialog from '@/components/AppDialog.vue'
import { cancelComplaint, getComplaint, verifyPassword } from '@/mock/api'
import { categoryName, priorityName, rejectReasonName } from '@/mock/constants'
import { actionLabel, durationLabel, formatDateTime } from '@/utils/format'
import { verifyStore } from '@/stores/verify'
import { devModal } from '@/utils/devModal'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const c = ref(null); const loading = ref(true); const loadError = ref('')
const mode = ref(null); const pw = ref(''); const pwError = ref(''); const pwBusy = ref(false)
const confirmCancel = ref(false); const cancelBusy = ref(false)

onMounted(load)
async function load() {
  loading.value = true
  try { c.value = await getComplaint(id) } catch (e) { loadError.value = e.message } finally { loading.value = false }
  if (devModal('pw')) mode.value = 'edit'
  if (devModal('cancel')) { verifyStore.set(id, '0000'); confirmCancel.value = true }
}
const open = () => c.value?.status === 'RECEIVED'
function ask(next) { mode.value = next; pw.value = ''; pwError.value = '' }
async function submitPw() {
  if (pw.value.length !== 4 || pwBusy.value) return
  pwBusy.value = true; pwError.value = ''
  try {
    await verifyPassword(id, pw.value)
    verifyStore.set(id, pw.value)
    const m = mode.value; mode.value = null
    if (m === 'edit') router.push({ name: 'complaint-edit', params: { id } })
    else confirmCancel.value = true
  } catch (e) { pwError.value = e.message } finally { pwBusy.value = false }
}
async function doCancel() {
  cancelBusy.value = true
  try { await cancelComplaint(id, verifyStore.get(id)); verifyStore.clear(id); confirmCancel.value = false; await load() }
  catch (e) { loadError.value = e.message; confirmCancel.value = false } finally { cancelBusy.value = false }
}
</script>

<template>
  <PubShell>
    <p v-if="loading" class="empty">불러오는 중…</p>
    <p v-else-if="loadError" class="note warn" style="margin-top: 40px">{{ loadError }}</p>

    <template v-else-if="c">
      <div style="padding: 40px 0 24px; border-bottom: 1px solid var(--line-2); display: flex; align-items: flex-start; gap: 20px">
        <div style="flex: 1; min-width: 0">
          <div style="display: flex; align-items: center; gap: 12px">
            <StatusMark :status="c.status" who="user" :late="c.delayed" />
            <span class="mono hint">{{ c.id }}</span>
          </div>
          <h1 class="display" style="font-size: 28px; margin-top: 12px">{{ c.title }}</h1>
        </div>
        <div v-if="open()" class="btn-row">
          <button class="btn line" @click="ask('edit')">내용 고치기</button>
          <button class="btn warn-line" @click="ask('cancel')">신고 취소</button>
        </div>
      </div>

      <div class="defs" style="margin-top: 24px">
        <div><dt>위치</dt><dd>{{ c.floor }} · {{ c.space }}</dd></div>
        <div><dt>설비</dt><dd>{{ categoryName(c.categoryCode) }}</dd></div>
        <div><dt>긴급도</dt><dd>{{ priorityName(c.priority) }}</dd></div>
        <div><dt>담당 기사</dt><dd>{{ c.assigneeName ?? '배정 전' }}</dd></div>
      </div>

      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 44px; margin-top: 34px; align-items: start">
        <section>
          <p class="sect">신고 내용</p>
          <p style="font-size: 14.5px; line-height: 1.75; white-space: pre-wrap">{{ c.content }}</p>
          <p v-if="c.photos?.length" class="hint mono" style="margin-top: 10px">{{ c.photos.map((p) => p.fileUrl ?? p).join(', ') }}</p>

          <template v-if="c.resolution">
            <p class="sect" style="margin-top: 30px">조치 결과</p>
            <p style="font-size: 14.5px; line-height: 1.75">{{ c.resolution.content }}</p>
            <p class="hint" style="margin-top: 8px">소요 시간 {{ durationLabel(c.resolution.durationMinutes) }}</p>
          </template>

          <template v-if="c.reject">
            <p class="sect" style="margin-top: 30px">반려 사유</p>
            <p style="font-size: 14px; font-weight: 700; color: var(--ink)">{{ rejectReasonName(c.reject.reasonType) }}</p>
            <p style="font-size: 14px; line-height: 1.7; margin-top: 4px">{{ c.reject.reason }}</p>
            <router-link v-if="c.originalComplaint" class="note" style="display: block; margin-top: 12px"
              :to="{ name: 'complaint', params: { id: c.originalComplaint.id } }">
              같은 건이 이미 접수돼 있습니다 — <span class="mono">{{ c.originalComplaint.id }}</span><br />
              <strong>{{ c.originalComplaint.title }}</strong>
            </router-link>
          </template>

          <div v-if="!open()" class="note warn" style="margin-top: 30px">
            <strong>지금은 고치거나 취소할 수 없습니다.</strong><br />
            담당 기사가 배정된 뒤에는 신고 내용을 바꿀 수 없습니다. 추가로 알릴 내용이 있으면 새로 신고해 주세요.
          </div>
        </section>

        <section>
          <p class="sect">처리 이력</p>
          <div class="timeline">
            <div v-for="(h, i) in c.history" :key="i" class="ev">
              <div class="act">{{ actionLabel(h.action) }}</div>
              <div class="at">{{ formatDateTime(h.at) }} · {{ h.actorName }}{{ h.note ? ` · ${h.note}` : '' }}</div>
            </div>
          </div>
        </section>
      </div>
    </template>

    <AppDialog v-if="mode" title="4자리 비밀번호"
      :message="mode === 'edit' ? '신고할 때 입력한 비밀번호를 넣어주세요.' : '취소하려면 비밀번호가 필요합니다.'"
      @close="mode = null">
      <template #body>
        <input v-model="pw" class="input mono" inputmode="numeric" maxlength="4" placeholder="0000"
          :style="pwError ? 'border-color: var(--alert)' : ''" @keyup.enter="submitPw" />
        <p v-if="pwError" class="hint" style="color: var(--alert); margin-top: 6px">{{ pwError }}</p>
      </template>
      <template #actions>
        <button class="btn line" @click="mode = null">닫기</button>
        <button class="btn" :disabled="pw.length !== 4 || pwBusy" @click="submitPw">{{ pwBusy ? '확인 중…' : '확인' }}</button>
      </template>
    </AppDialog>

    <AppDialog v-if="confirmCancel" danger title="신고를 취소할까요?"
      message="취소하면 되돌릴 수 없습니다. 같은 내용을 다시 알리려면 새로 신고해야 합니다."
      @close="confirmCancel = false">
      <template #actions>
        <button class="btn line" @click="confirmCancel = false">그대로 두기</button>
        <button class="btn warn" :disabled="cancelBusy" @click="doCancel">{{ cancelBusy ? '처리 중…' : '신고 취소' }}</button>
      </template>
    </AppDialog>
  </PubShell>
</template>
