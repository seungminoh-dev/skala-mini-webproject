<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import { listComplaints } from '@/mock/api'
import { CATEGORIES, STATUSES, categoryName, priorityName } from '@/mock/constants'
import { statusLabel } from '@/utils/labels'

const route = useRoute(); const router = useRouter()
const items = ref([]); const loading = ref(true)
const status = ref(''); const categoryCode = ref(''); const delayedOnly = ref(route.query.delayed === '1'); const keyword = ref('')

async function load() {
  loading.value = true
  items.value = await listComplaints({
    status: status.value || null, categoryCode: categoryCode.value || null,
    delayedOnly: delayedOnly.value, keyword: keyword.value.trim() || null
  })
  loading.value = false
}
onMounted(load); watch([status, categoryCode, delayedOnly], load)
</script>

<template>
  <StaffShell title="민원 전체" :sub="`${items.length}건`">
    <template #toolbar>
      <div class="toolbar">
        <input v-model="keyword" class="input" style="max-width: 260px" placeholder="제목 또는 민원 번호" @keyup.enter="load" />
        <div class="filters">
          <button class="ftog" :class="{ on: !status && !delayedOnly }" @click="status = ''; delayedOnly = false">전체</button>
          <button class="ftog" :class="{ on: delayedOnly }" @click="delayedOnly = !delayedOnly">지연</button>
          <button v-for="s in STATUSES" :key="s.code" class="ftog" :class="{ on: status === s.code }"
            @click="status = status === s.code ? '' : s.code">{{ statusLabel(s.code) }}</button>
        </div>
        <span style="flex: 1" />
        <div class="filters">
          <button v-for="c in CATEGORIES" :key="c.code" class="ftog" :class="{ on: categoryCode === c.code }"
            @click="categoryCode = categoryCode === c.code ? '' : c.code">{{ c.name }}</button>
        </div>
      </div>
    </template>

    <div class="page pad-0">
      <p v-if="loading" class="empty">불러오는 중…</p>
      <p v-else-if="!items.length" class="empty">조건에 맞는 민원이 없습니다.</p>

      <table v-else class="tbl">
        <thead>
          <tr>
            <th style="width: 120px">상태</th>
            <th style="width: 68px">긴급도</th>
            <th style="width: 168px">민원 번호</th>
            <th>요청 내용</th>
            <th style="width: 118px">설비</th>
            <th style="width: 96px">담당 기사</th>
            <th style="width: 104px" class="right">경과</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in items" :key="c.id" style="cursor: pointer"
            @click="router.push({ name: 'admin-complaint', params: { id: c.id } })">
            <td><StatusMark :status="c.status" :late="c.delayed" /></td>
            <td><span :class="{ urgent: c.priority === 'URGENT' }">{{ priorityName(c.priority) }}</span></td>
            <td class="num">{{ c.id }}</td>
            <td><div class="title">{{ c.title }}</div><div class="num">{{ c.floor }} {{ c.space }}</div></td>
            <td>{{ categoryName(c.categoryCode) }}</td>
            <td>{{ c.assigneeName ?? '—' }}</td>
            <td class="right num nowrap">{{ c.elapsed }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </StaffShell>
</template>
