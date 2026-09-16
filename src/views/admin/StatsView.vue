<script setup>
// A-06 통계 — 근거 자료. 기간을 고르고 숫자를 읽고, 눌러서 대장으로 내려간다
// (ADMIN 개편 기획 6.5)
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import { getStats } from '@/mock/api'
import { FLOORS, categoryName } from '@/mock/constants'
import { TERMS } from '@/utils/labels'
import { durationLabel } from '@/utils/format'

const router = useRouter()
const from = ref(''); const to = ref(''); const s = ref(null); const loading = ref(true)
const floorSort = ref('count')   // count | floor

const iso = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 프리셋 3개면 한 줄에 들어간다. '전체 기간'이 곧 해제다 (P-I, AX-28).
const PRESETS = [
  { code: 'all', label: '전체 기간', range: () => ['', ''] },
  {
    code: 'month',
    label: '이번 달',
    range: () => {
      const n = new Date()
      return [iso(new Date(n.getFullYear(), n.getMonth(), 1)), iso(n)]
    }
  },
  {
    code: 'q',
    label: '최근 3개월',
    range: () => {
      const n = new Date()
      return [iso(new Date(n.getFullYear(), n.getMonth() - 3, n.getDate())), iso(n)]
    }
  }
]

async function load() {
  loading.value = true
  s.value = await getStats({ from: from.value || null, to: to.value || null })
  loading.value = false
}
onMounted(load)

function preset(p) { [from.value, to.value] = p.range(); load() }
const activePreset = computed(() => {
  if (!from.value && !to.value) return 'all'
  return PRESETS.slice(1).find((p) => { const [a, b] = p.range(); return a === from.value && b === to.value })?.code ?? ''
})
const rangeLabel = computed(() =>
  !from.value && !to.value ? '전체 기간' : `${from.value || '처음'} ~ ${to.value || '오늘'}`)

// 기간을 그대로 들고 대장으로 내려간다 (AX-30)
function drill(extra) {
  const query = { ...extra }
  if (from.value) query.from = from.value
  if (to.value) query.to = to.value
  router.push({ path: '/admin/complaints', query })
}

function rows(list, nameFn) {
  const max = Math.max(1, ...list.map((r) => r.count))
  const sum = list.reduce((a, r) => a + r.count, 0) || 1
  return list.map((r) => ({
    key: r.key, name: nameFn(r.key), count: r.count,
    pct: Math.round((r.count / sum) * 1000) / 10,
    w: (r.count / max) * 100
  }))
}
const byCategory = computed(() => rows(s.value?.byCategory ?? [], categoryName))
const byFloor = computed(() => {
  const list = rows(s.value?.byFloor ?? [], (k) => k)
  // 층은 건물 순서로도 볼 수 있어야 한다 — 동률의 순서가 임의로 보이지 않게 (AX-30)
  return floorSort.value === 'floor'
    ? [...list].sort((a, b) => FLOORS.indexOf(a.key) - FLOORS.indexOf(b.key))
    : list
})
const openCount = computed(() => (s.value ? s.value.total - s.value.completed - s.value.rejected : 0))
</script>

<template>
  <StaffShell :title="TERMS.stats">
    <template #toolbar>
      <div class="toolbar">
        <div class="fgrp">
          <span class="fk">기간</span>
          <div class="filters">
            <button v-for="p in PRESETS" :key="p.code" class="ftog" :class="{ on: activePreset === p.code }"
              @click="preset(p)">{{ p.label }}</button>
          </div>
        </div>
        <div class="fgrp">
          <input v-model="from" type="date" class="input" aria-label="시작일" />
          <span class="hint">~</span>
          <input v-model="to" type="date" class="input" aria-label="종료일" />
          <button class="btn line nowrap" @click="load">적용</button>
        </div>
        <span style="flex: 1" />
        <span class="hint">현재: <b style="color: var(--ink)">{{ rangeLabel }}</b></span>
      </div>
    </template>

    <div class="page page-narrow">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <template v-else-if="s">
        <!-- 큰 숫자는 한 화면에 하나. 나머지는 문장 안의 숫자로 (AX-27) -->
        <p class="statline">
          <span class="big">{{ s.total }}</span>건 접수
          <template v-if="s.total">
            — 완료 <b>{{ s.completed }}건</b> · 반려 <b>{{ s.rejected }}건</b> · 처리 중·대기 <b>{{ openCount }}건</b>
          </template>
        </p>
        <p v-if="s.total" class="hint" style="margin-top: 10px">
          평균 처리 시간 <b style="color: var(--ink)">{{ durationLabel(s.avgMinutes) }}</b> (접수 → 완료)
          · 반려율 <b style="color: var(--ink)">{{ s.rejectRate }}%</b>
        </p>

        <div v-if="!s.total" class="empty">
          <p>이 기간에 접수된 민원이 없습니다.</p>
          <p style="margin-top: 12px"><button class="btn line" @click="preset(PRESETS[0])">전체 기간</button></p>
        </div>

        <div v-else style="display: grid; grid-template-columns: 1fr 1fr; gap: 44px; margin-top: 36px; align-items: start">
          <section>
            <p class="sect">설비별 발생 건수</p>
            <div class="bars">
              <button v-for="r in byCategory" :key="r.key" class="bar link" @click="drill({ category: r.key })">
                <span class="nm">{{ r.name }}</span>
                <span class="track"><span class="fill" :style="{ width: `${r.w}%` }" /></span>
                <span class="vl">{{ r.count }}<span>{{ r.pct }}%</span></span>
              </button>
            </div>
          </section>

          <section>
            <div style="display: flex; align-items: baseline; gap: 10px" class="sect">
              <span>층별 발생 건수</span>
              <span style="flex: 1" />
              <span class="filters" style="letter-spacing: 0">
                <button class="ftog" :class="{ on: floorSort === 'count' }" @click="floorSort = 'count'">건수순</button>
                <button class="ftog" :class="{ on: floorSort === 'floor' }" @click="floorSort = 'floor'">층 순서</button>
              </span>
            </div>
            <div class="bars">
              <button v-for="r in byFloor" :key="r.key" class="bar link" @click="drill({ floor: r.key })">
                <span class="nm">{{ r.name }}</span>
                <span class="track"><span class="fill" :style="{ width: `${r.w}%` }" /></span>
                <span class="vl">{{ r.count }}<span>{{ r.pct }}%</span></span>
              </button>
            </div>
          </section>
        </div>
      </template>
    </div>
  </StaffShell>
</template>
