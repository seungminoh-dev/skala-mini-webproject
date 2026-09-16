<script setup>
// A-03 민원 상세 — 결정 화면. 상태에 따라 할 수 있는 행동만 보이고 근거가 옆에 있다.
// (ADMIN 개편 기획 6.3 · A-04 배정 · 배정 회수 확인)
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import AppDialog from '@/components/AppDialog.vue'
import {
  assignComplaint, getAdminComplaint, listWorkers, revokeAssignment, updateClassification
} from '@/mock/api'
import {
  CATEGORIES, CLASSIFICATION_FIELDS, FLOORS, PRIORITIES, SPACES,
  categoryName, priorityName, rejectReasonName
} from '@/mock/constants'
import { TERMS, statusLabel } from '@/utils/labels'
import { actionLabel, durationLabel, elapsedShort, formatDateTime, minutesBetween } from '@/utils/format'
import { auth } from '@/stores/auth'
import { devModal } from '@/utils/devModal'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const c = ref(null); const loading = ref(true); const busy = ref(false)
const error = ref(''); const note = ref('')
const workers = ref([])

const cls = ref({ floor: '', space: '', categoryCode: '', priority: '' })
const clsOpen = ref(false)

const pick = ref(false); const chosen = ref(''); const pickError = ref('')
const askRevoke = ref(false); const revokeNote = ref('')

const received = computed(() => c.value?.status === 'RECEIVED')
const working = computed(() => c.value?.status === 'IN_PROGRESS')
const completed = computed(() => c.value?.status === 'COMPLETED')
const rejected = computed(() => c.value?.status === 'REJECTED')

// 어디서 들어왔는지로 돌아갈 곳을 정한다. 전체 민원에서 왔으면 걸어둔 조건을 그대로 들고 돌아간다.
const fromDashboard = computed(() => route.query.from === 'dashboard')
const backTo = computed(() =>
  fromDashboard.value ? { path: '/admin' } : { path: '/admin/complaints', query: listQuery.value })
const backLabel = computed(() => (fromDashboard.value ? TERMS.dashboard : TERMS.allComplaints))
const listQuery = computed(() => {
  const q = { ...route.query }
  delete q.from; delete q.modal; delete q.capture; delete q.devrole
  return q
})

// 서브타이틀은 설명문이 아니라 상태 사실만 말한다 (AX-32)
const sub = computed(() => {
  if (!c.value) return ''
  if (received.value) return c.value.delayed ? '미배정 · 지연' : '미배정'
  if (working.value) return `작업 중 · ${c.value.assigneeName} ${TERMS.worker}`
  if (completed.value) return `완료 · ${formatDateTime(c.value.completedAt)}`
  if (rejected.value) return `반려 · ${formatDateTime(c.value.reject.at)}`
  return statusLabel(c.value.status)
})

const assignee = computed(() => workers.value.find((w) => w.id === c.value?.assigneeId) ?? null)
const workerCategories = (w) => (w.categories.length >= 6 ? '전 설비' : w.categories.map(categoryName).join(' · '))

// 배정 모달: 이 민원의 설비를 담당하는 기사 → 보유 적은 순 → 이름순 (AX-20)
const pickList = computed(() => {
  const cat = c.value?.categoryCode
  return [...workers.value].sort((a, b) => {
    const am = a.categories.includes(cat) ? 0 : 1
    const bm = b.categories.includes(cat) ? 0 : 1
    return am - bm || a.holding - b.holding || a.name.localeCompare(b.name)
  })
})
const matches = (w) => w.categories.includes(c.value?.categoryCode)

// 같은 자리 작업은 중복 판단의 근거다 — 관리소장 화면에도 둔다
const relatedOwner = (r) => r.assigneeName ?? TERMS.unassigned

onMounted(load)
async function load() {
  loading.value = true
  try {
    const x = await getAdminComplaint(id)
    c.value = x
    cls.value = { floor: x.floor, space: x.space, categoryCode: x.categoryCode, priority: x.priority }
    workers.value = await listWorkers()
  } catch (e) { error.value = e.message } finally { loading.value = false }
  if (devModal('assign')) pick.value = true
  if (devModal('revoke')) askRevoke.value = true
}

// 안내는 다음 행동을 시작할 때 지운다 — 지난 행동의 안내가 남아 있지 않게 (AX-19)
function begin() { note.value = ''; error.value = '' }

function openPick() { begin(); chosen.value = ''; pickError.value = ''; pick.value = true }
async function doAssign() {
  if (!chosen.value || busy.value) return
  busy.value = true; pickError.value = ''
  const name = workers.value.find((w) => w.id === chosen.value)?.name
  const wasWorking = working.value
  try {
    await assignComplaint(id, chosen.value, auth.state.user.name)
    pick.value = false
    await load()
    note.value = wasWorking
      ? `${name} ${TERMS.worker}에게 재배정했습니다.`
      : `${name} ${TERMS.worker}에게 배정했습니다.`
  } catch (e) {
    pickError.value = e.code === 'INVALID_STATE' ? '이 민원은 지금 배정할 수 없는 상태입니다.' : e.message
  } finally { busy.value = false }
}

function openRevoke() { begin(); revokeNote.value = ''; askRevoke.value = true }
async function doRevoke() {
  busy.value = true
  try {
    await revokeAssignment(id, auth.state.user.name, revokeNote.value.trim() || null)
    askRevoke.value = false
    await load()
    note.value = '배정을 회수했습니다.'
  } catch (e) { error.value = e.message; askRevoke.value = false } finally { busy.value = false }
}

async function saveCls() {
  begin()
  const changed = Object.keys(CLASSIFICATION_FIELDS).filter((f) => cls.value[f] !== c.value[f])
  if (!changed.length) { note.value = '바뀐 항목이 없습니다.'; return }
  busy.value = true
  try {
    await updateClassification(id, cls.value, auth.state.user.name)
    await load()
    note.value = `분류 정보를 수정했습니다 (${changed.map((f) => CLASSIFICATION_FIELDS[f]).join(' · ')}).`
  } catch (e) { error.value = e.message } finally { busy.value = false }
}

function goReject() {
  begin()
  router.push({ name: 'admin-reject', params: { id }, query: listQuery.value })
}
</script>

<template>
  <StaffShell title="민원 상세" :sub="sub">
    <div class="page page-narrow">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <template v-else-if="c">
        <router-link :to="backTo" class="backlink">← {{ backLabel }}</router-link>

        <div class="whead">
          <div class="whead-row">
            <div style="min-width: 0">
              <StatusMark :status="c.status" :late="c.delayed" />
              <h2 class="wt">{{ c.title }}</h2>
              <!-- 한 줄 메타. 균등 4칸 흰 박스를 쓰지 않는다 (AX-13) -->
              <p class="wmeta">
                <span class="place">{{ c.floor }} {{ c.space }}</span>
                <span class="sep">·</span><span>{{ categoryName(c.categoryCode) }}</span>
                <span class="sep">·</span><span :class="{ urgent: c.priority === 'URGENT' }">{{ priorityName(c.priority) }}</span>
                <span class="sep">·</span><span>{{ c.elapsed }} 접수</span>
                <template v-if="working">
                  <span class="sep">·</span><span>담당 {{ c.assigneeName }} {{ TERMS.worker }}</span>
                </template>
                <span class="sep">·</span><span class="mono">{{ c.id }}</span>
              </p>
            </div>
            <!-- 행동은 대상이 있는 컨테이너 안, 제목 블록 우측에 둔다 (AX-14, AX-31) -->
            <div v-if="received || working" class="btn-row" style="flex: none">
              <button class="btn warn-line" :disabled="busy" @click="goReject">{{ TERMS.reject }}</button>
              <button v-if="working" class="btn line" :disabled="busy" @click="openRevoke">{{ TERMS.revoke }}</button>
              <button class="btn" :disabled="busy" @click="openPick">
                {{ working ? TERMS.reassign : TERMS.assign }}
              </button>
            </div>
          </div>
        </div>

        <p v-if="note" class="note" style="margin-top: 16px">{{ note }}</p>
        <p v-if="error" class="note warn" style="margin-top: 16px">{{ error }}</p>

        <div class="wcols" style="margin-top: 26px">
          <section>
            <!-- 완료·반려 건은 그 결과가 신고 원문보다 먼저 읽힌다 (AX-16) -->
            <template v-if="completed && c.resolution">
              <p class="sect">조치 결과</p>
              <p style="font-size: 14.5px; line-height: 1.75; white-space: pre-wrap">{{ c.resolution.content }}</p>
              <p class="hint" style="margin-top: 8px">
                처리 시간 {{ durationLabel(minutesBetween(c.createdAt, c.completedAt)) }} (접수 → 완료)
                · {{ formatDateTime(c.completedAt) }} 완료 · {{ c.assigneeName }} {{ TERMS.worker }}
              </p>
              <div v-if="c.resolution.photos?.length" class="filelist" style="max-width: 420px">
                <div v-for="(p, i) in c.resolution.photos" :key="i" class="f"><span class="mono">{{ p }}</span></div>
              </div>
              <p v-else class="hint" style="margin-top: 8px">조치 사진 없음</p>
            </template>

            <template v-if="rejected && c.reject">
              <p class="sect">반려 사유</p>
              <p style="font-size: 14.5px; font-weight: 700; color: var(--ink)">{{ rejectReasonName(c.reject.reasonType) }}</p>
              <p style="font-size: 14.5px; line-height: 1.75; margin-top: 4px">{{ c.reject.reason }}</p>
              <template v-if="c.reject.originalComplaintId">
                <p class="sect" style="margin-top: 24px">{{ TERMS.originalComplaint }}</p>
                <div v-if="c.originalComplaint" class="tbl-wrap">
                  <table class="tbl">
                    <tbody>
                      <tr style="cursor: pointer"
                        @click="router.push({ name: 'admin-complaint', params: { id: c.originalComplaint.id } })">
                        <td style="width: 104px"><StatusMark :status="c.originalComplaint.status" /></td>
                        <td>
                          <div class="title">{{ c.originalComplaint.title }}</div>
                          <div class="num">{{ c.originalComplaint.id }}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p v-else class="hint mono">{{ c.reject.originalComplaintId }}</p>
              </template>
            </template>

            <p v-if="c.status === 'CANCELED'" class="note" style="margin-bottom: 22px">
              신고자가 접수를 철회했습니다.
            </p>

            <p class="sect" :style="completed || rejected ? 'margin-top: 30px' : ''">신고 내용</p>
            <p style="font-size: 14.5px; line-height: 1.75; white-space: pre-wrap">{{ c.content }}</p>

            <!-- 사진은 MOCK 이므로 파일명만. 없다는 사실도 판단 근거다 (AX-15) -->
            <p class="sect" style="margin-top: 30px">첨부 사진</p>
            <div v-if="c.photos?.length" class="filelist" style="max-width: 420px">
              <div v-for="(p, i) in c.photos" :key="i" class="f"><span class="mono">{{ p.fileUrl ?? p }}</span></div>
            </div>
            <p v-else class="hint">첨부 사진 없음</p>

            <template v-if="c.relatedActive?.length">
              <p class="sect" style="margin-top: 30px">같은 위치에서 진행 중인 민원</p>
              <div class="tbl-wrap">
                <table class="tbl">
                  <tbody>
                    <tr v-for="r in c.relatedActive" :key="r.id" style="cursor: pointer"
                      @click="router.push({ name: 'admin-complaint', params: { id: r.id } })">
                      <td style="width: 104px"><StatusMark :status="r.status" :late="r.delayed" /></td>
                      <td><div class="title">{{ r.title }}</div><div class="num">{{ r.id }}</div></td>
                      <td class="right nowrap" style="width: 110px">{{ relatedOwner(r) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <!-- 분류 정보 수정은 보조 행동이다. 항상 열려 있지 않는다 (AX-14, AX-17) -->
            <div class="fold" style="margin-top: 34px">
              <button class="fold-h" :aria-expanded="clsOpen" @click="clsOpen = !clsOpen">
                <span>{{ TERMS.classify }}</span>
                <span class="fold-m">{{ clsOpen ? '접기' : '펼치기' }}</span>
              </button>
              <div v-if="clsOpen" class="fold-b">
                <p class="hint" style="margin-bottom: 14px">
                  신고자가 잘못 고른 위치·설비·긴급도를 고칩니다. 신고자가 적은 제목·내용·사진은 바꾸지 않습니다.
                </p>
                <div style="max-width: 460px">
                  <div class="row2" style="margin-bottom: 8px">
                    <select v-model="cls.floor" class="select" aria-label="층">
                      <option v-for="f in FLOORS" :key="f" :value="f">{{ f }}</option>
                    </select>
                    <select v-model="cls.space" class="select" aria-label="공간">
                      <option v-for="s in SPACES" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </div>
                  <select v-model="cls.categoryCode" class="select" style="margin-bottom: 8px" aria-label="설비">
                    <option v-for="x in CATEGORIES" :key="x.code" :value="x.code">{{ x.name }}</option>
                  </select>
                  <div class="filters" style="margin-bottom: 14px">
                    <button v-for="p in PRIORITIES" :key="p.code" class="ftog"
                      :class="{ on: cls.priority === p.code }" @click="cls.priority = p.code">{{ p.name }}</button>
                  </div>
                  <button class="btn line" :disabled="busy" @click="saveCls">저장</button>
                </div>
              </div>
            </div>
          </section>

          <aside>
            <p class="sect">처리 이력</p>
            <div class="timeline">
              <div v-for="(h, i) in c.history" :key="i" class="ev">
                <div class="act">{{ actionLabel(h.action) }}</div>
                <div class="at">{{ formatDateTime(h.at) }} · {{ h.actorName }}{{ h.note ? ` · ${h.note}` : '' }}</div>
              </div>
            </div>

            <template v-if="working && assignee">
              <p class="sect" style="margin-top: 28px">담당 기사</p>
              <div class="aside-box">
                <div class="av" style="margin-top: 0">
                  <strong style="color: var(--ink)">{{ assignee.name }}</strong> {{ TERMS.worker }}
                </div>
                <div class="hint" style="margin-top: 4px">
                  {{ workerCategories(assignee) }} · 보유 {{ assignee.holding }}건 · 맡은 지 {{ elapsedShort(c.assignedAt) }}
                </div>
              </div>
            </template>
          </aside>
        </div>
      </template>
    </div>

    <!-- A-04 배정 / 재배정 -->
    <AppDialog v-if="pick" :title="working ? '담당 기사 재배정' : '담당 기사 배정'"
      message="담당 기사를 골라 주세요." @close="pick = false">
      <template #body>
        <div class="tbl-wrap">
          <table class="tbl">
            <tbody>
              <tr v-for="w in pickList" :key="w.id" :class="{ sel: chosen === w.id, off: w.id === c.assigneeId }"
                :style="w.id === c.assigneeId ? '' : 'cursor: pointer'"
                @click="w.id === c.assigneeId ? null : (chosen = w.id)">
                <td>
                  <div class="title">
                    {{ w.name }}
                    <span v-if="matches(w)" class="match" title="이 민원의 담당 설비">●</span>
                  </div>
                  <div class="num">{{ workerCategories(w) }}</div>
                </td>
                <td style="font-size: 12.5px; color: var(--muted)">
                  <template v-if="w.id === c.assigneeId">현재 담당</template>
                  <template v-else-if="w.current.length">
                    {{ w.current[0].floor }} {{ w.current[0].space }}
                    <template v-if="w.current.length > 1"> 외 {{ w.current.length - 1 }}건</template>
                  </template>
                  <template v-else>—</template>
                </td>
                <td class="right mono nowrap" style="width: 52px; font-weight: 700; color: var(--ink)">{{ w.holding }}건</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="pickError" class="ferr">{{ pickError }}</p>
        <p v-else-if="!chosen" class="hint" style="margin-top: 8px">기사를 골라 주세요.</p>
      </template>
      <template #actions>
        <button class="btn line" @click="pick = false">닫기</button>
        <button class="btn" :disabled="!chosen || busy" @click="doAssign">
          {{ working ? TERMS.reassign : TERMS.assign }}
        </button>
      </template>
    </AppDialog>

    <!-- 배정 회수 확인 (P-D) -->
    <AppDialog v-if="askRevoke" danger title="배정을 회수할까요?"
      message="회수하면 미배정 목록으로 돌아가고, 기사의 내 작업에서 사라집니다." @close="askRevoke = false">
      <template #body>
        <p style="font-size: 14px"><strong style="color: var(--ink)">{{ c?.title }}</strong></p>
        <p class="hint" style="margin-top: 4px">
          {{ c?.floor }} {{ c?.space }} · 현재 담당 {{ c?.assigneeName }} {{ TERMS.worker }}
        </p>
        <label class="label" for="rv-note" style="margin-top: 16px">회수 사유 <span class="hint" style="font-weight: 400">(선택)</span></label>
        <input id="rv-note" v-model="revokeNote" class="input" maxlength="60" placeholder="예) 긴급 건 우선 처리로 회수" />
      </template>
      <template #actions>
        <button class="btn line" data-autofocus @click="askRevoke = false">그대로 두기</button>
        <button class="btn warn" :disabled="busy" @click="doRevoke">회수</button>
      </template>
    </AppDialog>
  </StaffShell>
</template>
