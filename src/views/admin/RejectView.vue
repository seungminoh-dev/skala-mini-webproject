<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBar from '@/components/AppBar.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { getComplaint, listComplaints, rejectComplaint } from '@/mock/api'
import { REJECT_REASONS, categoryName } from '@/mock/constants'
import { auth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const complaint = ref(null)
const loading = ref(true)
const reasonType = ref('DUPLICATE')
const reason = ref('')
const keyword = ref('')
const candidates = ref([])
const original = ref(null)
const busy = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    complaint.value = await getComplaint(id)
    keyword.value = complaint.value.title.slice(0, 6)
    await search()
  } finally {
    loading.value = false
  }
})

// 중복 반려는 원본 민원 연결이 필수다 (D-01).
const needOriginal = computed(() => reasonType.value === 'DUPLICATE')
const valid = computed(() => reason.value.trim() && (!needOriginal.value || original.value))

async function search() {
  const list = await listComplaints({ keyword: keyword.value.trim() || null })
  candidates.value = list.filter((c) => c.id !== id && ['RECEIVED', 'IN_PROGRESS', 'COMPLETED'].includes(c.status))
}

watch(reasonType, (v) => {
  if (v !== 'DUPLICATE') original.value = null
})

async function submit() {
  if (!valid.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await rejectComplaint(
      id,
      {
        reasonType: reasonType.value,
        reason: reason.value,
        originalComplaintId: original.value?.id ?? null
      },
      auth.state.user.name
    )
    router.replace({ name: 'admin-complaint', params: { id } })
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppBar title="민원 반려" :back="{ name: 'admin-complaint', params: { id } }" />

  <main class="screen narrow">
    <p v-if="loading" class="empty">불러오는 중…</p>

    <template v-else-if="complaint">
      <div class="card">
        <StatusBadge :status="complaint.status" />
        <div style="font-size: 15px; font-weight: 700; margin: 8px 0 3px">{{ complaint.title }}</div>
        <div class="hint">{{ complaint.id }} · {{ complaint.floor }} · {{ complaint.space }}</div>
      </div>

      <div class="section-title">반려 사유</div>
      <div class="chips">
        <button
          v-for="r in REJECT_REASONS"
          :key="r.code"
          class="chip"
          :class="{ on: reasonType === r.code }"
          @click="reasonType = r.code"
        >
          {{ r.name }}
        </button>
      </div>

      <div class="field" style="margin-top: 14px">
        <label class="label">반려 상세 사유</label>
        <textarea v-model="reason" class="textarea" placeholder="신고자에게 표시될 사유를 입력" />
      </div>

      <template v-if="needOriginal">
        <div class="section-title">원본 민원 연결</div>
        <div class="notice info" style="margin-bottom: 10px">
          중복 반려는 원본 민원을 반드시 연결해야 합니다. 신고자는 원본 민원에서 진행 상황을 확인합니다.
        </div>

        <div v-if="original" class="card" style="border-color: var(--blue); background: var(--blue-weak)">
          <div style="font-size: 11.5px; color: var(--text-2)">선택된 원본</div>
          <div style="font-size: 14px; font-weight: 700; margin-top: 3px">{{ original.title }}</div>
          <div class="hint" style="margin-top: 2px">{{ original.id }}</div>
          <button class="btn ghost" style="margin-top: 10px" @click="original = null">선택 해제</button>
        </div>

        <template v-else>
          <input
            v-model="keyword"
            class="input"
            placeholder="제목 또는 민원 번호로 검색"
            style="margin-bottom: 8px"
            @keyup.enter="search"
          />
          <button class="btn ghost" style="margin-bottom: 10px" @click="search">검색</button>

          <p v-if="!candidates.length" class="hint" style="padding: 6px 0">검색 결과가 없습니다.</p>
          <button
            v-for="c in candidates.slice(0, 5)"
            v-else
            :key="c.id"
            class="list-item"
            style="width: 100%; text-align: left; border: 1px solid var(--line)"
            @click="original = c"
          >
            <div class="top">
              <StatusBadge :status="c.status" />
              <span class="who">{{ c.elapsed }}</span>
            </div>
            <div class="title">{{ c.title }}</div>
            <div class="meta">{{ c.id }} · {{ categoryName(c.categoryCode) }}</div>
          </button>
        </template>
      </template>

      <p v-if="error" class="notice error" style="margin-top: 14px">{{ error }}</p>

      <button class="btn danger" style="margin-top: 16px" :disabled="!valid || busy" @click="submit">
        {{ needOriginal ? '원본 연결하여 반려' : '민원 반려' }}
      </button>
    </template>
  </main>
</template>
