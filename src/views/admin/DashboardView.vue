<script setup>
import { onMounted, ref } from 'vue'
import AppBar from '@/components/AppBar.vue'
import TabBar from '@/components/TabBar.vue'
import ComplaintCard from '@/components/ComplaintCard.vue'
import { getDashboard } from '@/mock/api'
import { categoryName } from '@/mock/constants'

const data = ref(null)
const loading = ref(true)

async function load() {
  loading.value = true
  data.value = await getDashboard()
  loading.value = false
}

onMounted(load)
</script>

<template>
  <AppBar title="운영 현황">
    <template #right>
      <button class="iconbtn" aria-label="새로고침" @click="load">⟳</button>
    </template>
  </AppBar>

  <main class="screen">
    <p v-if="loading" class="empty">불러오는 중…</p>

    <template v-else-if="data">
      <div class="metrics">
        <div class="metric">
          <div class="k">접수됨</div>
          <div class="n">{{ data.counts.received }}</div>
        </div>
        <div class="metric">
          <div class="k">처리중</div>
          <div class="n">{{ data.counts.inProgress }}</div>
        </div>
        <div class="metric alert">
          <div class="k">선점 지연</div>
          <div class="n">{{ data.counts.delayed }}</div>
        </div>
        <div class="metric">
          <div class="k">오늘 완료</div>
          <div class="n">{{ data.counts.completedToday }}</div>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; margin: 20px 0 8px">
        <span style="font-size: 14px; font-weight: 700">개입이 필요한 민원</span>
        <router-link
          to="/admin/complaints?delayed=1"
          style="font-size: 12.5px; color: var(--blue); font-weight: 700"
        >
          전체 보기
        </router-link>
      </div>

      <p v-if="!data.delayed.length" class="hint" style="padding: 10px 0">지연된 민원이 없습니다.</p>
      <div v-else class="list">
        <ComplaintCard
          v-for="c in data.delayed.slice(0, 6)"
          :key="c.id"
          :complaint="c"
          show-assignee
          :to="{ name: 'admin-complaint', params: { id: c.id } }"
        />
      </div>

      <div class="section-title">작업자별 보유 현황</div>
      <div class="card">
        <div
          v-for="(w, i) in data.workers"
          :key="w.id"
          style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0"
          :style="i > 0 ? 'border-top: 1px solid var(--line)' : ''"
        >
          <div>
            <div style="font-size: 14px; font-weight: 700">{{ w.name }}</div>
            <div class="hint" style="margin-top: 2px">
              {{ w.categories.length > 3 ? '전 카테고리' : w.categories.map(categoryName).join(', ') }}
            </div>
          </div>
          <div style="font-size: 17px; font-weight: 700">{{ w.holding }}건</div>
        </div>
      </div>
    </template>
  </main>

  <TabBar role="ADMIN" />
</template>
