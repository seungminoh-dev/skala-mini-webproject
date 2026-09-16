<script setup>
// A-02 전체 민원 — 대장. 조건을 걸어 찾고, 걸린 조건이 항상 보인다 (ADMIN 개편 기획 6.2)
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import { listComplaints, listWorkers } from '@/mock/api'
import { CATEGORIES, FLOORS, PRIORITIES, STATUSES, categoryName, priorityName } from '@/mock/constants'
import { TERMS, statusLabel } from '@/utils/labels'

const route = useRoute(); const router = useRouter()
const items = ref([]); const loading = ref(true); const workers = ref([])

const SORTS = [
  { code: 'new', label: '최신 접수순' },
  { code: 'old', label: '오래된 순' },
  { code: 'urgent', label: '긴급한 순' }
]

// 조건은 전부 주소에 남는다 — 대시보드 링크가 그대로 초기 조건이 되고, 새로고침해도 살아 있다 (AX-06)
const q = route.query
const status = ref(q.status ?? '')
const categoryCode = ref(q.category ?? '')
const floor = ref(q.floor ?? '')
const priority = ref(q.priority ?? '')
const assignee = ref(q.assignee ?? '')
const from = ref(q.from ?? '')
const to = ref(q.to ?? '')
const delayedOnly = ref(q.delayed === '1')
const doneToday = ref(q.doneToday === '1')
const keyword = ref(q.q ?? '')
const applied = ref(q.q ?? '')   // 실제로 조회에 쓰인 검색어
const sort = ref(SORTS.some((s) => s.code === q.sort) ? q.sort : 'new')

const EMPTY = { status: '', category: '', floor: '', priority: '', assignee: '', from: '', to: '', delayed: '', doneToday: '', q: '', sort: '' }

function syncUrl() {
  const next = {
    ...EMPTY,
    status: status.value, category: categoryCode.value, floor: floor.value, priority: priority.value,
    assignee: assignee.value, from: from.value, to: to.value,
    delayed: delayedOnly.value ? '1' : '', doneToday: doneToday.value ? '1' : '',
    q: applied.value, sort: sort.value === 'new' ? '' : sort.value
  }
  const query = {}
  Object.entries(next).forEach(([k, v]) => { if (v) query[k] = v })
  if (route.query.capture) query.capture = route.query.capture
  if (route.query.devrole) query.devrole = route.query.devrole
  router.replace({ path: route.path, query })
}

async function load() {
  loading.value = true
  items.value = await listComplaints({
    status: status.value || null,
    categoryCode: categoryCode.value || null,
    floor: floor.value || null,
    priority: priority.value || null,
    assignee: assignee.value || null,
    from: from.value || null,
    to: to.value || null,
    delayedOnly: delayedOnly.value,
    keyword: applied.value.trim() || null
  })
  loading.value = false
  syncUrl()
}
onMounted(async () => {
  workers.value = await listWorkers()
  await load()
})
watch([status, categoryCode, floor, priority, assignee, from, to, delayedOnly], load)
watch([doneToday, sort], syncUrl)

function search() { applied.value = keyword.value; load() }
function clearAll() {
  status.value = ''; categoryCode.value = ''; floor.value = ''; priority.value = ''
  assignee.value = ''; from.value = ''; to.value = ''
  delayedOnly.value = false; doneToday.value = false
  keyword.value = ''; applied.value = ''
  load()
}

// 오늘 완료는 완료 시각 기준이라 접수 기간 필터로 대신할 수 없다 — 표시 계층에서 거른다.
const within24h = (iso) => iso && Date.now() - new Date(iso).getTime() < 86400000
const shown = computed(() => {
  const list = doneToday.value ? items.value.filter((c) => within24h(c.completedAt)) : items.value
  const sorted = [...list]
  if (sort.value === 'old') sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  if (sort.value === 'urgent') {
    const w = { URGENT: 0, NORMAL: 1, LOW: 2 }
    sorted.sort((a, b) => w[a.priority] - w[b.priority] || new Date(a.createdAt) - new Date(b.createdAt))
  }
  return sorted   // 'new' 는 API 기본 정렬(최신 접수순) 그대로
})

const workerName = (wid) => workers.value.find((w) => w.id === wid)?.name ?? wid
// 걸린 조건을 사실 그대로 나열한다. 없으면 아무 말도 하지 않는다.
const conditions = computed(() => {
  const list = []
  if (delayedOnly.value) list.push('지연만')
  if (doneToday.value) list.push('오늘 완료')
  if (status.value) list.push(statusLabel(status.value))
  if (categoryCode.value) list.push(categoryName(categoryCode.value))
  if (floor.value) list.push(floor.value)
  if (priority.value) list.push(priorityName(priority.value))
  if (assignee.value) list.push(`담당 ${workerName(assignee.value)}`)
  if (from.value || to.value) list.push(`${from.value || '처음'} ~ ${to.value || '오늘'}`)
  if (applied.value.trim()) list.push(`'${applied.value.trim()}'`)
  return list
})
const open = (id) => router.push({ name: 'admin-complaint', params: { id }, query: route.query })
</script>

<template>
  <StaffShell :title="TERMS.allComplaints" :sub="`${shown.length}건`">
    <template #toolbar>
      <div class="toolbar" style="display: block">
        <div class="fbar">
          <div class="lookup-row" style="flex: none">
            <input v-model="keyword" class="input" style="width: 220px" placeholder="제목 또는 민원 번호"
              @keyup.enter="search" />
            <button class="btn line nowrap" @click="search">검색</button>
          </div>
          <div class="fgrp">
            <span class="fk">상태</span>
            <div class="filters">
              <button class="ftog" :class="{ on: !status }" @click="status = ''">전체</button>
              <button v-for="s in STATUSES" :key="s.code" class="ftog" :class="{ on: status === s.code }"
                @click="status = status === s.code ? '' : s.code">{{ statusLabel(s.code) }}</button>
            </div>
          </div>
          <!-- 지연은 상태가 아니라 경과 조건이다. 상태 세그먼트와 층위를 나눈다 (AX-03) -->
          <label class="fswitch">
            <input v-model="delayedOnly" type="checkbox" /> 지연만
          </label>
        </div>

        <div class="fbar">
          <div class="fgrp">
            <span class="fk">설비</span>
            <select v-model="categoryCode" class="select" aria-label="설비">
              <option value="">전체</option>
              <option v-for="c in CATEGORIES" :key="c.code" :value="c.code">{{ c.name }}</option>
            </select>
          </div>
          <div class="fgrp">
            <span class="fk">층</span>
            <select v-model="floor" class="select" aria-label="층">
              <option value="">전체</option>
              <option v-for="f in FLOORS" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
          <div class="fgrp">
            <span class="fk">긴급도</span>
            <div class="filters">
              <button class="ftog" :class="{ on: !priority }" @click="priority = ''">전체</button>
              <button v-for="p in PRIORITIES" :key="p.code" class="ftog" :class="{ on: priority === p.code }"
                @click="priority = priority === p.code ? '' : p.code">{{ p.name }}</button>
            </div>
          </div>
          <div class="fgrp">
            <span class="fk">접수 기간</span>
            <input v-model="from" type="date" class="input" aria-label="시작일" />
            <span class="hint">~</span>
            <input v-model="to" type="date" class="input" aria-label="종료일" />
          </div>
          <span style="flex: 1" />
          <div class="fgrp">
            <span class="fk">정렬</span>
            <select v-model="sort" class="select" aria-label="정렬 기준">
              <option v-for="s in SORTS" :key="s.code" :value="s.code">{{ s.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 활성 조건 요약 — 무엇이 걸려 있는지 화면이 먼저 말한다 (AX-03, AX-06) -->
      <div class="summary">
        <b>{{ shown.length }}건</b>
        <span v-if="conditions.length" class="cond">· {{ conditions.join(' · ') }}</span>
        <span class="grow" />
        <button v-if="conditions.length" class="btn line sm" @click="clearAll">필터 해제</button>
      </div>
    </template>

    <div class="page pad-0">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <!-- 빈 상태도 무엇 때문에 비었는지 말한다 (AX-07) -->
      <div v-else-if="!shown.length" class="empty">
        <p v-if="conditions.length">{{ conditions.join(' · ') }} 조건에 맞는 민원이 없습니다.</p>
        <p v-else>등록된 민원이 없습니다.</p>
        <p v-if="conditions.length" style="margin-top: 12px">
          <button class="btn line" @click="clearAll">필터 해제</button>
        </p>
      </div>

      <table v-else class="tbl tbl-w tbl-adm">
        <thead>
          <tr>
            <th class="c-st">상태</th>
            <th class="c-pri">긴급도</th>
            <th class="c-loc">위치</th>
            <th class="c-req">요청 내용</th>
            <th class="c-cat">설비</th>
            <th class="c-who">담당 기사</th>
            <th class="c-at">접수</th>
            <th class="c-gap" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in shown" :key="c.id" class="click" @click="open(c.id)">
            <td class="c-st"><StatusMark :status="c.status" :late="c.delayed" /></td>
            <td class="c-pri nowrap">
              <span :class="{ urgent: c.priority === 'URGENT' }">{{ priorityName(c.priority) }}</span>
            </td>
            <td class="c-loc"><span class="place">{{ c.floor }} {{ c.space }}</span></td>
            <td class="c-req">
              <div class="rloc">{{ c.floor }} {{ c.space }}</div>
              <div class="title">{{ c.title }}</div>
              <div class="num">{{ c.id }}</div>
              <div class="rsub">{{ categoryName(c.categoryCode) }} · {{ c.elapsed }}</div>
            </td>
            <td class="c-cat">{{ categoryName(c.categoryCode) }}</td>
            <td class="c-who nowrap">{{ c.assigneeName ?? '—' }}</td>
            <td class="c-at num nowrap">{{ c.elapsed }}</td>
            <td class="c-gap" />
          </tr>
        </tbody>
      </table>
    </div>
  </StaffShell>
</template>
