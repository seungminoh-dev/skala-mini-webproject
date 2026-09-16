<script setup>
// A-01 운영 현황 — 현황판. 지금 개입해야 할 것과 지금 누가 무엇을 하는지를 본다
// (ADMIN 개편 기획 6.1)
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import { getDashboard } from '@/mock/api'
import { categoryName, priorityName } from '@/mock/constants'
import { TERMS } from '@/utils/labels'
import { clockLabel, elapsedShort } from '@/utils/format'

const router = useRouter()
const d = ref(null); const loading = ref(true); const at = ref(null)

async function load() {
  loading.value = true
  d.value = await getDashboard()
  at.value = new Date()
  loading.value = false
}
onMounted(load)

const clock = computed(() => (at.value ? clockLabel(at.value) : ''))

const workerCategories = (w) => (w.categories.length >= 6 ? '전 설비' : w.categories.map(categoryName).join(' · '))

const openComplaint = (id) => router.push({ name: 'admin-complaint', params: { id }, query: { from: 'dashboard' } })
// 지연 행에서 바로 배정 모달을 연다 — 개입 동선을 한 단계 줄인다
const openAssign = (id) =>
  router.push({ name: 'admin-complaint', params: { id }, query: { from: 'dashboard', modal: 'assign' } })
const openWorker = (id) => router.push({ path: '/admin/complaints', query: { assignee: id, status: 'IN_PROGRESS' } })
</script>

<template>
  <StaffShell :title="TERMS.dashboard">
    <template #sub>
      <span v-if="d">
        <!-- 수치 타일 대신 사실 문장. 숫자를 누르면 그 조건의 대장이 열린다 (AX-08) -->
        미배정
        <router-link class="factlink" :to="{ path: '/admin/complaints', query: { status: 'RECEIVED' } }">{{ d.counts.received }}건</router-link>
        · 작업 중
        <router-link class="factlink" :to="{ path: '/admin/complaints', query: { status: 'IN_PROGRESS' } }">{{ d.counts.inProgress }}건</router-link>
        · 오늘 완료
        <router-link class="factlink" :to="{ path: '/admin/complaints', query: { status: 'COMPLETED', doneToday: '1' } }">{{ d.counts.completedToday }}건</router-link>
        · {{ clock }} 기준
      </span>
    </template>
    <template #actions><button class="btn line" @click="load">새로고침</button></template>

    <div class="page">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <template v-else-if="d">
        <section>
          <div class="head-line">
            <span class="hl-n alert">{{ d.counts.delayed }}</span>
            <span class="hl-t alert">{{ TERMS.delayedList }}</span>
            <span class="grow" />
            <router-link :to="{ path: '/admin/complaints', query: { delayed: '1' } }">전체 보기 →</router-link>
          </div>

          <p v-if="!d.delayed.length" class="hint" style="padding: 6px 0">지연 민원이 없습니다.</p>
          <div v-else class="tbl-wrap">
            <table class="tbl tbl-w tbl-adm">
              <tbody>
                <tr v-for="c in d.delayed.slice(0, 6)" :key="c.id" class="click" @click="openComplaint(c.id)">
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
                  <td class="c-at num nowrap">{{ c.elapsed }}</td>
                  <td class="c-act">
                    <button class="btn line nowrap" @click.stop="openAssign(c.id)">{{ TERMS.assign }}</button>
                  </td>
                  <td class="c-gap" />
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section style="margin-top: 38px">
          <div class="head-line">
            <span class="hl-t">기사 현황</span>
          </div>
          <div class="tbl-wrap">
            <table class="tbl tbl-w tbl-adm">
              <tbody>
                <!-- 보유 건수만으로는 "지금 무엇을 하는지"를 알 수 없다 (AX-11) -->
                <tr v-for="w in d.workers" :key="w.id" :class="{ click: w.holding > 0 }"
                  @click="w.holding ? openWorker(w.id) : null">
                  <td class="c-nm"><span class="place">{{ w.name }}</span></td>
                  <td class="c-cat">{{ workerCategories(w) }}</td>
                  <td class="c-hold mono nowrap">{{ w.holding }}건</td>
                  <td class="c-req">
                    <template v-if="w.current.length">
                      <div class="title">{{ w.current[0].title }}</div>
                      <div class="num">
                        {{ w.current[0].floor }} {{ w.current[0].space }} · 맡은 지 {{ elapsedShort(w.current[0].assignedAt) }}
                        <template v-if="w.current.length > 1"> · 외 {{ w.current.length - 1 }}건</template>
                      </div>
                    </template>
                    <span v-else class="hint">—</span>
                  </td>
                  <td class="c-gap" />
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </div>
  </StaffShell>
</template>
