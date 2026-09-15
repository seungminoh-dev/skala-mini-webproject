<script setup>
import { computed, onMounted, ref } from 'vue'
import AppBar from '@/components/AppBar.vue'
import TabBar from '@/components/TabBar.vue'
import { getStats } from '@/mock/api'
import { categoryName } from '@/mock/constants'
import { durationLabel } from '@/utils/format'

const from = ref('')
const to = ref('')
const stats = ref(null)
const loading = ref(true)

async function load() {
  loading.value = true
  stats.value = await getStats({ from: from.value || null, to: to.value || null })
  loading.value = false
}

onMounted(load)

const maxCategory = computed(() => Math.max(1, ...(stats.value?.byCategory ?? []).map((r) => r.count)))
const maxFloor = computed(() => Math.max(1, ...(stats.value?.byFloor ?? []).map((r) => r.count)))
</script>

<template>
  <AppBar title="민원 통계">
    <template #right>
      <button class="iconbtn" aria-label="새로고침" @click="load">⟳</button>
    </template>
  </AppBar>

  <main class="screen">
    <div class="row2" style="margin-bottom: 8px">
      <input v-model="from" type="date" class="input" />
      <input v-model="to" type="date" class="input" />
    </div>
    <button class="btn ghost" style="margin-bottom: 16px" @click="load">기간 적용</button>

    <p v-if="loading" class="empty">불러오는 중…</p>

    <template v-else-if="stats">
      <div class="metrics">
        <div class="metric">
          <div class="k">총 접수</div>
          <div class="n">{{ stats.total }}건</div>
        </div>
        <div class="metric">
          <div class="k">평균 처리 시간</div>
          <div class="n" style="font-size: 20px">{{ durationLabel(stats.avgMinutes) }}</div>
        </div>
        <div class="metric">
          <div class="k">반려율</div>
          <div class="n">{{ stats.rejectRate }}%</div>
        </div>
        <div class="metric">
          <div class="k">처리 완료</div>
          <div class="n">{{ stats.completed }}건</div>
        </div>
      </div>

      <div class="cols" style="margin-top: 18px">
        <section>
          <div class="section-title" style="margin-top: 0">카테고리별 발생 건수</div>
          <div class="card">
            <p v-if="!stats.byCategory.length" class="hint">데이터가 없습니다.</p>
            <div v-for="r in stats.byCategory" v-else :key="r.key" class="bar-row">
              <span class="name">{{ categoryName(r.key) }}</span>
              <span class="track"><span class="fill" :style="{ width: `${(r.count / maxCategory) * 100}%` }" /></span>
              <span class="n">{{ r.count }}</span>
            </div>
          </div>
        </section>
        <section>
          <div class="section-title" style="margin-top: 0">위치별 발생 건수</div>
          <div class="card">
            <p v-if="!stats.byFloor.length" class="hint">데이터가 없습니다.</p>
            <div v-for="r in stats.byFloor" v-else :key="r.key" class="bar-row">
              <span class="name">{{ r.key }}</span>
              <span class="track"><span class="fill" :style="{ width: `${(r.count / maxFloor) * 100}%` }" /></span>
              <span class="n">{{ r.count }}</span>
            </div>
          </div>
        </section>
      </div>

      <p class="hint" style="margin-top: 14px">
        정기 정비 요청의 근거 자료로 사용합니다. (AS-01)
      </p>
    </template>
  </main>

  <TabBar role="ADMIN" />
</template>
