<script setup>
// W-02 미배정 민원 — 작업판. 무엇을 다음에 할지 고르는 화면 (WORKER 개편 기획 6.1)
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import { listUnassigned } from '@/mock/api'
import { CATEGORIES, FLOORS, categoryName, priorityName } from '@/mock/constants'
import { TERMS } from '@/utils/labels'
import { auth } from '@/stores/auth'

const router = useRouter()
const items = ref([]); const loading = ref(true)

// 기사가 훑는 기준을 직접 고른다. 정렬은 표시 계층에서만 하고 API 호출은 바꾸지 않는다 (WX-27).
const SORTS = [
  { code: 'urgent', label: '긴급한 순' },
  { code: 'old', label: '오래된 순' },
  { code: 'place', label: '위치 순' }
]
const SORT_KEY = 'ofc-worker-sort'
const sort = ref(sessionStorage.getItem(SORT_KEY) ?? 'urgent')
watch(sort, (v) => { try { sessionStorage.setItem(SORT_KEY, v) } catch (e) { /* 무시 */ } })

// 필터는 '내 담당'(여러 설비) · 전체 · 설비별. 기본은 전체다 — 오분류 건도 눈에 띄어야 한다 (P-D).
const filter = ref('')
const myCats = computed(() => auth.state.user?.categories ?? [])
const filterName = computed(() =>
  filter.value === 'MINE' ? '내 담당 설비' : filter.value ? categoryName(filter.value) : '')

async function load() {
  loading.value = true
  const code = filter.value && filter.value !== 'MINE' ? filter.value : null
  items.value = await listUnassigned({ categoryCode: code })
  loading.value = false
}
onMounted(load)
watch(filter, load)

const floorNo = (f) => FLOORS.indexOf(f)
const shown = computed(() => {
  const list = filter.value === 'MINE'
    ? items.value.filter((c) => myCats.value.includes(c.categoryCode))
    : items.value
  const sorted = [...list]
  if (sort.value === 'old') sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  if (sort.value === 'place') {
    sorted.sort((a, b) => floorNo(a.floor) - floorNo(b.floor) || a.space.localeCompare(b.space))
  }
  return sorted // 'urgent' 는 API 기본 정렬(긴급도 → 오래된 순)을 그대로 쓴다
})
const lateCount = computed(() => shown.value.filter((c) => c.delayed).length)
const sub = computed(() =>
  `담당자 미배정 민원 ${shown.value.length}건` + (lateCount.value ? ` · 지연 ${lateCount.value}건` : ''))

const open = (id) => router.push({ name: 'worker-complaint', params: { id } })
</script>

<template>
  <StaffShell :title="TERMS.unassignedList" :sub="sub">
    <template #actions>
      <button class="btn line" @click="load">새로고침</button>
    </template>

    <template #toolbar>
      <div class="toolbar">
        <div class="filters">
          <button class="ftog" :class="{ on: filter === 'MINE' }" @click="filter = 'MINE'">내 담당</button>
          <button class="ftog" :class="{ on: filter === '' }" @click="filter = ''">전체</button>
          <button v-for="c in CATEGORIES" :key="c.code" class="ftog" :class="{ on: filter === c.code }"
            @click="filter = c.code">{{ c.name }}</button>
        </div>
        <span style="flex: 1" />
        <div class="sortbox">
          <span class="sk">정렬</span>
          <div class="filters only-wide">
            <button v-for="s in SORTS" :key="s.code" class="ftog" :class="{ on: sort === s.code }"
              @click="sort = s.code">{{ s.label }}</button>
          </div>
          <select v-model="sort" class="select only-narrow" style="width: auto" aria-label="정렬 기준">
            <option v-for="s in SORTS" :key="s.code" :value="s.code">{{ s.label }}</option>
          </select>
        </div>
      </div>
    </template>

    <div class="page">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <!-- 필터를 걸어 비었으면 무엇 때문에 비었는지 말하고 빠져나갈 길을 준다 (WX-05) -->
      <div v-else-if="!shown.length" class="empty">
        <template v-if="filterName">
          <p>{{ filterName }}에 미배정 민원이 없습니다.</p>
          <p style="margin-top: 12px"><button class="btn line" @click="filter = ''">전체 보기</button></p>
        </template>
        <p v-else>미배정 민원이 없습니다.</p>
      </div>

      <div v-else class="tbl-wrap">
        <table class="tbl tbl-w">
          <thead>
            <tr>
              <th class="c-pri">긴급도</th>
              <th class="c-loc">위치</th>
              <th class="c-req">요청 내용</th>
              <th class="c-cat">설비</th>
              <th class="c-at">접수</th>
              <th class="c-gap" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in shown" :key="c.id" class="click" @click="open(c.id)">
              <td class="c-pri nowrap">
                <span :class="{ urgent: c.priority === 'URGENT' }">{{ priorityName(c.priority) }}</span>
                <span v-if="c.delayed" class="late-mark"><i /> 지연</span>
              </td>
              <td class="c-loc"><span class="place">{{ c.floor }} {{ c.space }}</span></td>
              <td class="c-req">
                <div class="rloc">{{ c.floor }} {{ c.space }}</div>
                <div class="title">{{ c.title }}</div>
                <div class="num">{{ c.id }}</div>
                <div class="rsub">{{ categoryName(c.categoryCode) }} · {{ c.elapsed }}</div>
              </td>
              <td class="c-cat">{{ categoryName(c.categoryCode) }}</td>
              <td class="c-at num nowrap">{{ c.elapsed }}</td>
              <td class="c-gap" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </StaffShell>
</template>
