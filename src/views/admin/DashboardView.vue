<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import { getDashboard } from '@/mock/api'
import { categoryName, priorityName } from '@/mock/constants'

const router = useRouter()
const d = ref(null); const loading = ref(true)
async function load() { loading.value = true; d.value = await getDashboard(); loading.value = false }
onMounted(load)
</script>

<template>
  <StaffShell title="운영 현황" sub="판교 오피스 B동 · 오늘">
    <template #actions><button class="btn line" @click="load">새로고침</button></template>

    <div class="page">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <template v-else-if="d">
        <div class="metrics">
          <div class="metric"><div class="k">담당자 없음</div><div class="n">{{ d.counts.received }}</div></div>
          <div class="metric"><div class="k">작업 중</div><div class="n">{{ d.counts.inProgress }}</div></div>
          <div class="metric alert"><div class="k">지연 작업</div><div class="n">{{ d.counts.delayed }}</div></div>
          <div class="metric"><div class="k">오늘 완료</div><div class="n">{{ d.counts.completedToday }}</div></div>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 34px; margin-top: 34px; align-items: start">
          <section>
            <div style="display: flex; align-items: baseline; gap: 10px" class="sect">
              <span>배치 필요 작업</span>
              <span style="flex: 1" />
              <router-link to="/admin/complaints?delayed=1" style="color: var(--sky); font-weight: 600; letter-spacing: 0">전체 보기</router-link>
            </div>
            <p v-if="!d.delayed.length" class="hint" style="padding: 10px 0">배치가 필요한 작업이 없습니다.</p>
            <div v-else class="tbl-wrap">
              <table class="tbl">
                <tbody>
                  <tr v-for="c in d.delayed.slice(0, 6)" :key="c.id" style="cursor: pointer"
                    @click="router.push({ name: 'admin-complaint', params: { id: c.id } })">
                    <td style="width: 92px"><StatusMark :status="c.status" late /></td>
                    <td style="width: 62px"><span :class="{ urgent: c.priority === 'URGENT' }">{{ priorityName(c.priority) }}</span></td>
                    <td><div class="title">{{ c.title }}</div><div class="num">{{ c.floor }} {{ c.space }} · {{ categoryName(c.categoryCode) }}</div></td>
                    <td class="right num" style="width: 88px">{{ c.elapsed }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <p class="sect">기사별 보유 작업</p>
            <div class="tbl-wrap">
              <table class="tbl">
                <tbody>
                  <tr v-for="w in d.workers" :key="w.id">
                    <td>
                      <div class="title">{{ w.name }}</div>
                      <div class="num">{{ w.categories.length > 3 ? '전 설비' : w.categories.map(categoryName).join(', ') }}</div>
                    </td>
                    <td class="right mono" style="width: 64px; font-size: 15px; font-weight: 700; color: var(--ink)">{{ w.holding }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
          </section>
        </div>
      </template>
    </div>
  </StaffShell>
</template>
