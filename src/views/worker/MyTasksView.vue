<script setup>
import { onMounted, ref, watch } from 'vue'
import AppBar from '@/components/AppBar.vue'
import TabBar from '@/components/TabBar.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { listMyTasks } from '@/mock/api'
import { categoryName } from '@/mock/constants'
import { auth } from '@/stores/auth'

const tab = ref('IN_PROGRESS')
const items = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  items.value = await listMyTasks(auth.state.user.id, tab.value)
  loading.value = false
}

onMounted(load)
watch(tab, load)
</script>

<template>
  <AppBar title="내 작업">
    <template #right>
      <button class="iconbtn" aria-label="새로고침" @click="load">⟳</button>
    </template>
  </AppBar>

  <main class="screen">
    <div class="chips" style="margin-bottom: 14px">
      <button class="chip" :class="{ on: tab === 'IN_PROGRESS' }" @click="tab = 'IN_PROGRESS'">처리중</button>
      <button class="chip" :class="{ on: tab === 'COMPLETED' }" @click="tab = 'COMPLETED'">완료</button>
    </div>

    <p v-if="loading" class="empty">불러오는 중…</p>
    <p v-else-if="!items.length" class="empty">
      {{ tab === 'IN_PROGRESS' ? '보유 중인 민원이 없습니다.' : '완료한 민원이 없습니다.' }}
    </p>

    <div v-else class="list">
      <div v-for="c in items" :key="c.id" class="card">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px">
        <StatusBadge :status="c.status" />
        <span style="font-size: 11.5px; color: var(--text-3)">{{ c.id }}</span>
      </div>
      <div style="font-size: 14.5px; font-weight: 700; line-height: 1.35">{{ c.title }}</div>
      <div class="meta hint" style="margin-top: 4px">
        {{ c.floor }} · {{ c.space }} · {{ categoryName(c.categoryCode) }}
      </div>
      <router-link
        v-if="tab === 'IN_PROGRESS'"
        class="btn"
        style="margin-top: 12px; display: block; text-align: center; text-decoration: none"
        :to="{ name: 'worker-complete', params: { id: c.id } }"
      >
        처리 결과 등록
        </router-link>
      </div>
    </div>
  </main>

  <TabBar role="WORKER" />
</template>
