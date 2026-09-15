<script setup>
import { onMounted, ref, watch } from 'vue'
import AppBar from '@/components/AppBar.vue'
import TabBar from '@/components/TabBar.vue'
import ComplaintCard from '@/components/ComplaintCard.vue'
import { listUnassigned } from '@/mock/api'
import { CATEGORIES } from '@/mock/constants'
import { auth } from '@/stores/auth'

const items = ref([])
const loading = ref(true)
const filter = ref('')

const mine = (code) => auth.state.user?.categories?.includes(code)

async function load() {
  loading.value = true
  items.value = await listUnassigned({ categoryCode: filter.value || null })
  loading.value = false
}

onMounted(load)
watch(filter, load)
</script>

<template>
  <AppBar title="미배정 민원">
    <template #right>
      <button class="iconbtn" aria-label="새로고침" @click="load">⟳</button>
    </template>
  </AppBar>

  <main class="screen">
    <div class="chips" style="margin-bottom: 12px">
      <button class="chip" :class="{ on: filter === '' }" @click="filter = ''">전체</button>
      <button
        v-for="c in CATEGORIES"
        :key="c.code"
        class="chip"
        :class="{ on: filter === c.code }"
        @click="filter = c.code"
      >
        {{ c.name }}<span v-if="mine(c.code)"> ·</span>
      </button>
    </div>

    <p class="hint" style="margin-bottom: 10px">
      우선순위와 경과 시간 순으로 정렬됩니다. 담당 카테고리가 아닌 민원도 선점할 수 있습니다.
    </p>

    <p v-if="loading" class="empty">불러오는 중…</p>
    <p v-else-if="!items.length" class="empty">미배정 민원이 없습니다.</p>
    <div v-else class="list">
      <ComplaintCard
        v-for="c in items"
        :key="c.id"
        :complaint="c"
        :to="{ name: 'worker-complaint', params: { id: c.id } }"
      />
    </div>
  </main>

  <TabBar role="WORKER" />
</template>
