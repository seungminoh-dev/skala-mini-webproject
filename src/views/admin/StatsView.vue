<script setup>
import { computed, onMounted, ref } from 'vue'
import StaffShell from '@/components/StaffShell.vue'
import { getStats } from '@/mock/api'
import { categoryName } from '@/mock/constants'
import { durationLabel } from '@/utils/format'

const from = ref(''); const to = ref(''); const s = ref(null); const loading = ref(true)
async function load() { loading.value = true; s.value = await getStats({ from: from.value || null, to: to.value || null }); loading.value = false }
onMounted(load)

function rows(list, nameFn) {
  const max = Math.max(1, ...list.map((r) => r.count))
  const sum = list.reduce((a, r) => a + r.count, 0) || 1
  return list.map((r, i) => ({
    key: r.key, name: nameFn(r.key), count: r.count,
    pct: Math.round((r.count / sum) * 1000) / 10,
    w: (r.count / max) * 100, top: i === 0
  }))
}
const byCategory = computed(() => rows(s.value?.byCategory ?? [], categoryName))
const byFloor = computed(() => rows(s.value?.byFloor ?? [], (k) => k))
</script>

<template>
  <StaffShell title="통계" sub="정기 정비를 요청할 때 근거로 씁니다">
    <template #toolbar>
      <div class="toolbar">
        <input v-model="from" type="date" class="input" style="max-width: 158px" />
        <span class="hint">—</span>
        <input v-model="to" type="date" class="input" style="max-width: 158px" />
        <button class="btn line" @click="load">적용</button>
        <span style="flex: 1" />
        <span class="hint">기간을 비우면 전체 누적</span>
      </div>
    </template>

    <div class="page">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <template v-else-if="s">
        <div class="metrics">
          <div class="metric"><div class="k">총 접수</div><div class="n">{{ s.total }}<small>건</small></div></div>
          <div class="metric"><div class="k">처리 완료</div><div class="n">{{ s.completed }}<small>건</small></div></div>
          <div class="metric"><div class="k">평균 처리 시간</div><div class="n" style="font-size: 23px">{{ durationLabel(s.avgMinutes) }}</div></div>
          <div class="metric"><div class="k">반려율</div><div class="n">{{ s.rejectRate }}<small>%</small></div></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 44px; margin-top: 40px; align-items: start">
          <section>
            <p class="sect">설비별 발생 건수</p>
            <p v-if="!byCategory.length" class="hint">데이터가 없습니다.</p>
            <div v-else class="bars">
              <div v-for="r in byCategory" :key="r.key" class="bar" :class="{ top: r.top }">
                <span class="nm">{{ r.name }}</span>
                <span class="track"><span class="fill" :style="{ width: `${r.w}%` }" /></span>
                <span class="vl">{{ r.count }}<span>{{ r.pct }}%</span></span>
              </div>
            </div>
            <p v-if="byCategory.length" class="hint" style="margin-top: 14px">
              <b style="color: var(--ink)">{{ byCategory[0].name }}</b> — 전체의 {{ byCategory[0].pct }}%. 정기 정비 대상 1순위.
            </p>
          </section>

          <section>
            <p class="sect">층별 발생 건수</p>
            <p v-if="!byFloor.length" class="hint">데이터가 없습니다.</p>
            <div v-else class="bars">
              <div v-for="r in byFloor" :key="r.key" class="bar" :class="{ top: r.top }">
                <span class="nm">{{ r.name }}</span>
                <span class="track"><span class="fill" :style="{ width: `${r.w}%` }" /></span>
                <span class="vl">{{ r.count }}<span>{{ r.pct }}%</span></span>
              </div>
            </div>
          </section>
        </div>
      </template>
    </div>
  </StaffShell>
</template>
