<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import { listUnassigned } from '@/mock/api'
import { CATEGORIES, categoryName, priorityName } from '@/mock/constants'
import { auth } from '@/stores/auth'

const router = useRouter()
const items = ref([]); const loading = ref(true); const filter = ref('')
const mine = (code) => auth.state.user?.categories?.includes(code)
const lateCount = computed(() => items.value.filter((c) => c.delayed).length)

async function load() {
  loading.value = true
  items.value = await listUnassigned({ categoryCode: filter.value || null })
  loading.value = false
}
onMounted(load); watch(filter, load)
</script>

<template>
  <StaffShell title="대기 중인 작업" :sub="`담당자가 정해지지 않은 요청 ${items.length}건` + (lateCount ? ` · 지연 ${lateCount}건` : '')">
    <template #actions>
      <button class="btn line" @click="load">새로고침</button>
    </template>

    <template #toolbar>
      <div class="toolbar">
        <div class="filters">
          <button class="ftog" :class="{ on: filter === '' }" @click="filter = ''">전체</button>
          <button v-for="c in CATEGORIES" :key="c.code" class="ftog" :class="{ on: filter === c.code }" @click="filter = c.code">
            {{ c.name }}<template v-if="mine(c.code)"> ·</template>
          </button>
        </div>
        <span style="flex: 1" />
        <span class="hint">· 는 내 담당 설비</span>
      </div>
    </template>

    <div class="page">
      <p v-if="loading" class="empty">불러오는 중…</p>
      <p v-else-if="!items.length" class="empty">대기 중인 작업이 없습니다.</p>

      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th style="width: 120px">상태</th>
              <th style="width: 72px">긴급도</th>
              <th>요청 내용</th>
              <th style="width: 120px">설비</th>
              <th style="width: 104px" class="right">대기</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in items" :key="c.id" style="cursor: pointer"
              @click="router.push({ name: 'worker-complaint', params: { id: c.id } })">
              <td><StatusMark :status="c.status" :late="c.delayed" /></td>
              <td><span :class="{ urgent: c.priority === 'URGENT' }">{{ priorityName(c.priority) }}</span></td>
              <td>
                <div class="title">{{ c.title }}</div>
                <div class="num">{{ c.id }} · {{ c.floor }} {{ c.space }}</div>
              </td>
              <td>{{ categoryName(c.categoryCode) }}</td>
              <td class="right num nowrap">{{ c.elapsed }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </StaffShell>
</template>
