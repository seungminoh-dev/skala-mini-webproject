<script setup>
// W-05 내 작업 — 맡은 것과 끝낸 것. 끝낸 것도 다시 열어볼 수 있다 (WORKER 개편 기획 6.3)
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import { listMyTasks } from '@/mock/api'
import { categoryName, priorityName } from '@/mock/constants'
import { TERMS } from '@/utils/labels'
import { clockLabel, elapsedShort, formatDateTime } from '@/utils/format'
import { auth } from '@/stores/auth'

const router = useRouter()
const tab = ref('IN_PROGRESS'); const items = ref([]); const loading = ref(true); const at = ref(null)
const working = computed(() => tab.value === 'IN_PROGRESS')

async function load() {
  loading.value = true
  const list = await listMyTasks(auth.state.user.id, tab.value)
  // 작업 중은 오래 붙잡고 있는 것이 위로 온다. 완료는 최근 완료 순(API 기본)을 그대로 쓴다.
  items.value = working.value ? [...list].reverse() : list
  at.value = new Date()
  loading.value = false
}
onMounted(load)
watch(tab, load)

const sub = computed(() =>
  `${working.value ? '작업 중' : '완료'} ${items.value.length}건`
  + (at.value ? ` · ${clockLabel(at.value)} 기준` : ''))
// 목록은 훑는 자리다. 조치 내용은 첫 문장(또는 40자)까지만 보이고 전문은 행을 눌러 읽는다 (UX-07).
function summary(c) {
  const text = c.resolution?.content?.split('\n')[0]?.trim()
  if (!text) return '작업 완료'
  const stop = text.indexOf('. ')
  const first = stop > 0 ? text.slice(0, stop + 1) : text
  return first.length > 40 ? `${first.slice(0, 40)}…` : first
}

const open = (id) => router.push({ name: 'worker-complaint', params: { id }, query: { from: 'tasks' } })
const complete = (id) => router.push({ name: 'worker-complete', params: { id } })
</script>

<template>
  <StaffShell :title="TERMS.myTasks" :sub="sub">
    <template #toolbar>
      <div class="toolbar">
        <div class="filters">
          <button class="ftog" :class="{ on: working }" @click="tab = 'IN_PROGRESS'">작업 중</button>
          <button class="ftog" :class="{ on: !working }" @click="tab = 'COMPLETED'">완료</button>
        </div>
      </div>
    </template>

    <div class="page">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <div v-else-if="!items.length" class="empty">
        <template v-if="working">
          <p>맡은 작업이 없습니다. {{ TERMS.unassignedList }}에서 골라보세요.</p>
          <p style="margin-top: 12px">
            <router-link to="/worker" class="btn line" style="display: inline-block">{{ TERMS.unassignedList }}</router-link>
          </p>
        </template>
        <p v-else>완료한 작업이 없습니다.</p>
      </div>

      <!-- 작업 중 — 무엇을 얼마나 오래 붙잡고 있는지가 보여야 한다 (WX-15) -->
      <div v-else-if="working" class="tbl-wrap">
        <table class="tbl tbl-w">
          <thead>
            <tr>
              <th class="c-pri">긴급도</th>
              <th class="c-loc">위치</th>
              <th class="c-req">요청 내용</th>
              <th class="c-cat">설비</th>
              <th class="c-at">맡은 지</th>
              <th class="c-act" />
              <th class="c-gap" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in items" :key="c.id" class="click" @click="open(c.id)">
              <td class="c-pri nowrap">
                <span :class="{ urgent: c.priority === 'URGENT' }">{{ priorityName(c.priority) }}</span>
              </td>
              <td class="c-loc"><span class="place">{{ c.floor }} {{ c.space }}</span></td>
              <td class="c-req">
                <div class="rloc">{{ c.floor }} {{ c.space }}</div>
                <div class="title">{{ c.title }}</div>
                <div class="num">{{ c.id }}</div>
                <div class="rsub">{{ categoryName(c.categoryCode) }} · 맡은 지 {{ elapsedShort(c.assignedAt) }}</div>
              </td>
              <td class="c-cat">{{ categoryName(c.categoryCode) }}</td>
              <td class="c-at num nowrap">{{ elapsedShort(c.assignedAt) }}</td>
              <td class="c-act">
                <button class="btn line nowrap" @click.stop="complete(c.id)">결과 남기기</button>
              </td>
              <td class="c-gap" />
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 완료 — 언제 끝냈고 무엇을 했는지. 행을 누르면 다시 열람한다 (WX-14) -->
      <div v-else class="tbl-wrap">
        <table class="tbl tbl-w">
          <thead>
            <tr>
              <th class="c-loc">위치</th>
              <th class="c-req">요청 내용</th>
              <th class="c-cat">설비</th>
              <th class="c-when">완료</th>
              <th class="c-sum">조치 요약</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in items" :key="c.id" class="click" @click="open(c.id)">
              <td class="c-loc"><span class="place">{{ c.floor }} {{ c.space }}</span></td>
              <td class="c-req">
                <div class="rloc">{{ c.floor }} {{ c.space }}</div>
                <div class="title">{{ c.title }}</div>
                <div class="num">{{ c.id }}</div>
                <div class="rsub">{{ categoryName(c.categoryCode) }} · {{ formatDateTime(c.completedAt) }}</div>
              </td>
              <td class="c-cat">{{ categoryName(c.categoryCode) }}</td>
              <td class="c-when num nowrap">{{ formatDateTime(c.completedAt) }}</td>
              <td class="c-sum ell" :title="summary(c)">{{ summary(c) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </StaffShell>
</template>
