<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppBar from '@/components/AppBar.vue'
import TabBar from '@/components/TabBar.vue'
import ComplaintCard from '@/components/ComplaintCard.vue'
import { listComplaints } from '@/mock/api'
import { CATEGORIES, STATUSES } from '@/mock/constants'

const route = useRoute()
const items = ref([])
const loading = ref(true)
const status = ref('')
const categoryCode = ref('')
const delayedOnly = ref(route.query.delayed === '1')
const keyword = ref('')

async function load() {
  loading.value = true
  items.value = await listComplaints({
    status: status.value || null,
    categoryCode: categoryCode.value || null,
    delayedOnly: delayedOnly.value,
    keyword: keyword.value.trim() || null
  })
  loading.value = false
}

onMounted(load)
watch([status, categoryCode, delayedOnly], load)
</script>

<template>
  <AppBar title="전체 민원" />

  <main class="screen">
    <input
      v-model="keyword"
      class="input"
      placeholder="제목 또는 민원 번호 검색"
      style="margin-bottom: 10px"
      @keyup.enter="load"
    />

    <div class="chips" style="margin-bottom: 8px">
      <button class="chip" :class="{ on: status === '' && !delayedOnly }" @click="status = ''; delayedOnly = false">
        전체
      </button>
      <button class="chip" :class="{ on: delayedOnly }" @click="delayedOnly = !delayedOnly">지연</button>
      <button
        v-for="s in STATUSES"
        :key="s.code"
        class="chip"
        :class="{ on: status === s.code }"
        @click="status = status === s.code ? '' : s.code"
      >
        {{ s.name }}
      </button>
    </div>

    <div class="chips" style="margin-bottom: 14px">
      <button
        v-for="c in CATEGORIES"
        :key="c.code"
        class="chip"
        :class="{ on: categoryCode === c.code }"
        @click="categoryCode = categoryCode === c.code ? '' : c.code"
      >
        {{ c.name }}
      </button>
    </div>

    <p v-if="loading" class="empty">불러오는 중…</p>
    <p v-else-if="!items.length" class="empty">조건에 맞는 민원이 없습니다.</p>
    <div v-else class="list">
      <ComplaintCard
        v-for="c in items"
        :key="c.id"
        :complaint="c"
        show-assignee
        :to="{ name: 'admin-complaint', params: { id: c.id } }"
      />
    </div>
  </main>

  <TabBar role="ADMIN" />
</template>
