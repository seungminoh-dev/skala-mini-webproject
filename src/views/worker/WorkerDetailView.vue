<script setup>
// W-03 민원 상세 — 맡기 전에는 판단 근거, 맡은 뒤에는 작업 지시서, 끝난 뒤에는 기록.
// 하나의 화면을 상태별로 재사용한다 (WORKER 개편 기획 6.2, P-E)
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import AppDialog from '@/components/AppDialog.vue'
import { claimComplaint, getWorkerComplaint, listWorkers, releaseComplaint } from '@/mock/api'
import { categoryName, priorityName } from '@/mock/constants'
import { TERMS, statusLabel } from '@/utils/labels'
import { actionLabel, durationLabel, formatDateTime, minutesBetween } from '@/utils/format'
import { auth } from '@/stores/auth'
import { devModal } from '@/utils/devModal'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const c = ref(null); const loading = ref(true)
const warn = ref(false); const taken = ref(false); const busy = ref(false)
const askRelease = ref(false); const releaseNote = ref(''); const error = ref('')
const owners = ref([])

// 담당 외 설비일 때 정책을 설명하는 대신, 그 설비를 맡고 있는 기사를 보여준다.
const ownerNames = computed(() => owners.value.map((w) => w.name).join(' · '))
// 기타·모름처럼 담당 기사가 없는 설비도 있다 — 없는 것을 '없음입니다'로 말하지 않는다.
const offCategoryMsg = computed(() => {
  const cat = categoryName(c.value.categoryCode)
  return ownerNames.value
    ? `${cat} 담당은 ${ownerNames.value}입니다. 내 담당이 아니어도 맡을 수 있습니다.`
    : `${cat}은 담당 기사가 정해져 있지 않습니다. 내 담당이 아니어도 맡을 수 있습니다.`
})

const mine = computed(() => c.value?.assigneeId === auth.state.user?.id)
const canClaim = computed(() => c.value?.status === 'RECEIVED')
const working = computed(() => c.value?.status === 'IN_PROGRESS' && mine.value)
const done = computed(() => c.value?.status === 'COMPLETED')

const offCategory = computed(() => {
  const cats = auth.state.user?.categories ?? []
  return c.value && cats.length > 0 && !cats.includes(c.value.categoryCode)
})

// 어디서 들어왔는지로 돌아갈 곳을 정한다. 직접 주소로 들어온 경우는 상태로 판단한다.
const fromTasks = computed(() => route.query.from === 'tasks' || (!route.query.from && (working.value || done.value)))
const backTo = computed(() => (fromTasks.value ? '/worker/tasks' : '/worker'))
const backLabel = computed(() => (fromTasks.value ? TERMS.myTasks : TERMS.unassignedList))

// 서브타이틀은 설명문이 아니라 상태 사실만 말한다 (WX-10)
const sub = computed(() => {
  if (!c.value) return ''
  if (c.value.status === 'RECEIVED') return c.value.delayed ? '미배정 · 지연' : '미배정'
  if (c.value.status === 'IN_PROGRESS') {
    return mine.value ? '작업 중 · 내가 맡음' : `작업 중 · ${c.value.assigneeName} ${TERMS.worker}`
  }
  if (c.value.status === 'COMPLETED') return `완료 · ${formatDateTime(c.value.completedAt)}`
  return statusLabel(c.value.status)
})

// 같은 자리 작업은 담당자가 누구인지에 따라 할 말이 다르다 (WX-09)
const relatedByOther = computed(() =>
  (c.value?.relatedActive ?? []).some((r) => r.assigneeId && r.assigneeId !== auth.state.user?.id))
const relatedOwner = (r) => {
  if (!r.assigneeId) return TERMS.unassigned
  return r.assigneeId === auth.state.user?.id ? '내가 맡고 있음' : r.assigneeName
}

onMounted(load)
async function load() {
  loading.value = true
  try {
    c.value = await getWorkerComplaint(id)
    const all = await listWorkers()
    owners.value = all.filter((w) => w.categories.includes(c.value.categoryCode) && w.id !== auth.state.user?.id)
  } finally { loading.value = false }
  if (devModal('offcat')) warn.value = true
  if (devModal('conflict')) taken.value = true
  if (devModal('release')) askRelease.value = true
}

function onTake() { offCategory.value ? (warn.value = true) : doTake() }
async function doTake() {
  busy.value = true; warn.value = false
  try { await claimComplaint(id, auth.state.user.id); router.replace('/worker/tasks?done=claimed') }
  catch (e) { if (e.status === 409) taken.value = true; else error.value = e.message } finally { busy.value = false }
}
async function doRelease() {
  busy.value = true
  try {
    await releaseComplaint(id, auth.state.user.id, releaseNote.value.trim() || null)
    router.replace('/worker?done=released')
  } catch (e) { error.value = e.message; askRelease.value = false } finally { busy.value = false }
}
</script>

<template>
  <StaffShell title="민원 상세" :sub="sub">
    <template #actions>
      <template v-if="c">
        <button v-if="canClaim" class="btn" :disabled="busy" @click="onTake">
          {{ busy ? '처리 중…' : TERMS.claim }}
        </button>
        <template v-if="working">
          <button class="btn line" @click="askRelease = true">{{ TERMS.release }}</button>
          <button class="btn" @click="router.push({ name: 'worker-complete', params: { id } })">처리 결과 남기기</button>
        </template>
      </template>
    </template>

    <div class="page page-narrow">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <template v-else-if="c">
        <router-link :to="backTo" class="backlink">← {{ backLabel }}</router-link>

        <div class="whead">
          <div style="display: flex; align-items: center; gap: 10px; margin-top: 14px">
            <StatusMark :status="c.status" :late="c.delayed" />
            <span v-if="c.delayed && c.status === 'RECEIVED'" class="hint">
              {{ priorityName(c.priority) }} 기준 시간을 넘겼습니다
            </span>
          </div>
          <h2 class="wt">{{ c.title }}</h2>
          <!-- 한 줄 메타. 균등 4칸 흰 박스를 쓰지 않는다 (WX-06) -->
          <p class="wmeta">
            <span class="place">{{ c.floor }} {{ c.space }}</span>
            <span class="sep">·</span><span>{{ categoryName(c.categoryCode) }}</span>
            <span class="sep">·</span><span :class="{ urgent: c.priority === 'URGENT' }">{{ priorityName(c.priority) }}</span>
            <span class="sep">·</span><span>{{ c.elapsed }} 접수</span>
            <template v-if="c.status === 'IN_PROGRESS' && !mine">
              <span class="sep">·</span><span>담당 {{ c.assigneeName }} {{ TERMS.worker }}</span>
            </template>
            <span class="sep">·</span><span class="mono">{{ c.id }}</span>
          </p>
        </div>

        <p v-if="error" class="note warn" style="margin-top: 16px">{{ error }}</p>

        <!-- 담당 외 안내는 사실 한 줄. 확인은 맡기 직전 대화상자에서 한 번만 한다 (WX-08) -->
        <p v-if="canClaim && offCategory" class="note" style="margin-top: 18px">{{ offCategoryMsg }}</p>

        <div class="wcols" style="margin-top: 26px">
          <section>
            <!-- 완료된 건은 조치 결과가 신고 원문보다 먼저 읽힌다 (WX-14) -->
            <template v-if="done && c.resolution">
              <p class="sect">조치 결과</p>
              <p style="font-size: 14.5px; line-height: 1.75; white-space: pre-wrap">{{ c.resolution.content }}</p>
              <p class="hint" style="margin-top: 8px">
                처리 시간 {{ durationLabel(minutesBetween(c.createdAt, c.completedAt)) }} (접수 → 완료) · {{ formatDateTime(c.completedAt) }} 완료
              </p>
              <div v-if="c.resolution.photos?.length" class="filelist" style="max-width: 420px">
                <div v-for="(p, i) in c.resolution.photos" :key="i" class="f"><span class="mono">{{ p }}</span></div>
              </div>
            </template>

            <p class="sect" :style="done && c.resolution ? 'margin-top: 30px' : ''">신고 내용</p>
            <p style="font-size: 14.5px; line-height: 1.75; white-space: pre-wrap">{{ c.content }}</p>

            <!-- 사진은 MOCK 이므로 파일명만 보여준다. 없다는 사실도 현장에서는 정보다 (WX-07) -->
            <p class="sect" style="margin-top: 30px">첨부 사진</p>
            <div v-if="c.photos?.length" class="filelist" style="max-width: 420px">
              <div v-for="(p, i) in c.photos" :key="i" class="f"><span class="mono">{{ p.fileUrl ?? p }}</span></div>
            </div>
            <p v-else class="hint">첨부 사진 없음</p>

            <template v-if="c.relatedActive?.length">
              <p class="sect" style="margin-top: 30px">같은 위치에서 진행 중인 작업</p>
              <div v-if="relatedByOther" class="note warn" style="margin-bottom: 10px">
                같은 자리에 다른 작업이 잡혀 있습니다. 같은 건이면 관리소장에게 알려 정리하세요.
              </div>
              <div class="tbl-wrap">
                <table class="tbl">
                  <tbody>
                    <tr v-for="r in c.relatedActive" :key="r.id" style="cursor: pointer"
                      @click="router.push({ name: 'worker-complaint', params: { id: r.id } })">
                      <td style="width: 104px"><StatusMark :status="r.status" /></td>
                      <td><div class="title">{{ r.title }}</div><div class="num">{{ r.id }}</div></td>
                      <td class="right nowrap" style="width: 110px">{{ relatedOwner(r) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
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
    </div>

    <!-- W-04 담당 외 확인 — 상세의 안내 문장을 되풀이하지 않고 결과만 말한다 (WX-08) -->
    <AppDialog v-if="warn" title="내 담당 설비가 아닙니다"
      message="맡으면 내 작업 목록으로 들어옵니다. 이력에 담당 외 선점으로 기록됩니다." @close="warn = false">
      <template #actions>
        <button class="btn line" @click="warn = false">돌아가기</button>
        <button class="btn" :disabled="busy" data-autofocus @click="doTake">맡기</button>
      </template>
    </AppDialog>

    <!-- E-04 반납 확인 -->
    <AppDialog v-if="askRelease" title="이 민원을 반납할까요?"
      message="이 민원은 미배정 목록으로 돌아가 다른 기사가 맡을 수 있게 됩니다." @close="askRelease = false">
      <template #body>
        <label class="label" for="rel-note">반납 사유 <span class="hint" style="font-weight: 400">(선택)</span></label>
        <input id="rel-note" v-model="releaseNote" class="input" maxlength="60"
          placeholder="예) 부품이 없어 오늘 처리 불가" />
        <p class="hint" style="margin-top: 6px">적어 두면 관리소장이 재배정할 때 참고합니다.</p>
      </template>
      <template #actions>
        <button class="btn line" data-autofocus @click="askRelease = false">계속 하기</button>
        <button class="btn" :disabled="busy" @click="doRelease">{{ TERMS.release }}</button>
      </template>
    </AppDialog>

    <!-- E-01 선점 충돌 -->
    <AppDialog v-if="taken" title="다른 기사가 먼저 맡았습니다"
      message="거의 동시에 같은 작업을 선택했습니다. 목록을 새로 불러옵니다." @close="router.replace('/worker')">
      <template #actions>
        <button class="btn" @click="router.replace('/worker')">목록으로</button>
      </template>
    </AppDialog>
  </StaffShell>
</template>
