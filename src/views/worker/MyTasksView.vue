<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import { listMyTasks } from '@/mock/api'
import { categoryName } from '@/mock/constants'
import { auth } from '@/stores/auth'

const router = useRouter()
const tab = ref('IN_PROGRESS'); const items = ref([]); const loading = ref(true)
async function load() { loading.value = true; items.value = await listMyTasks(auth.state.user.id, tab.value); loading.value = false }
onMounted(load); watch(tab, load)
</script>

<template>
  <StaffShell title="내 작업" :sub="`${auth.state.user?.name} 기사 · ${items.length}건`">
    <template #toolbar>
      <div class="toolbar">
        <div class="filters">
          <button class="ftog" :class="{ on: tab === 'IN_PROGRESS' }" @click="tab = 'IN_PROGRESS'">작업 중</button>
          <button class="ftog" :class="{ on: tab === 'COMPLETED' }" @click="tab = 'COMPLETED'">완료</button>
        </div>
      </div>
    </template>

    <div class="page">
      <p v-if="loading" class="empty">불러오는 중…</p>
      <p v-else-if="!items.length" class="empty">
        {{ tab === 'IN_PROGRESS' ? '맡은 작업이 없습니다.' : '완료한 작업이 없습니다.' }}
      </p>

      <div v-else class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th style="width: 120px">상태</th>
              <th>요청 내용</th>
              <th style="width: 120px">설비</th>
              <th style="width: 150px" class="right" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in items" :key="c.id">
              <td><StatusMark :status="c.status" /></td>
              <td><div class="title">{{ c.title }}</div><div class="num">{{ c.id }} · {{ c.floor }} {{ c.space }}</div></td>
              <td>{{ categoryName(c.categoryCode) }}</td>
              <td class="right">
                <button v-if="tab === 'IN_PROGRESS'" class="btn line"
                  @click="router.push({ name: 'worker-complete', params: { id: c.id } })">처리 결과 남기기</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </StaffShell>
</template>
