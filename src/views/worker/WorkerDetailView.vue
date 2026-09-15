<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBar from '@/components/AppBar.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ModalSheet from '@/components/ModalSheet.vue'
import { claimComplaint, getWorkerComplaint } from '@/mock/api'
import { categoryName, priorityName } from '@/mock/constants'
import { actionLabel, formatDateTime } from '@/utils/format'
import { auth } from '@/stores/auth'
import { devModal } from '@/utils/devModal'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const complaint = ref(null)
const loading = ref(true)
const warnOffCategory = ref(false)
const conflict = ref(false)
const busy = ref(false)

// P-01: 담당 카테고리가 아니어도 선점은 가능하되, 경고를 먼저 띄운다.
const offCategory = computed(() => {
  const cats = auth.state.user?.categories ?? []
  return complaint.value && cats.length > 0 && !cats.includes(complaint.value.categoryCode)
})

onMounted(load)

async function load() {
  loading.value = true
  try {
    complaint.value = await getWorkerComplaint(id)
  } finally {
    loading.value = false
  }
  if (devModal('offcat')) warnOffCategory.value = true
  if (devModal('conflict')) conflict.value = true
}

function onClaimClick() {
  if (offCategory.value) warnOffCategory.value = true
  else doClaim()
}

async function doClaim() {
  busy.value = true
  warnOffCategory.value = false
  try {
    await claimComplaint(id, auth.state.user.id)
    router.replace('/worker/tasks')
  } catch (e) {
    // E-01 선점 경합 실패
    if (e.status === 409) conflict.value = true
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppBar title="민원 상세" :back="{ path: '/worker' }" />

  <main class="screen narrow">
    <p v-if="loading" class="empty">불러오는 중…</p>

    <template v-else-if="complaint">
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span v-if="complaint.delayed" class="badge delay">지연</span>
        <StatusBadge v-else :status="complaint.status" />
        <span style="font-size: 11.5px; color: var(--text-3)">{{ complaint.id }}</span>
      </div>

      <h2 style="font-size: 18px; margin: 10px 0 14px; line-height: 1.4">{{ complaint.title }}</h2>

      <div class="card">
        <div class="kv">
          <div>
            <div class="k">위치</div>
            <div class="v">{{ complaint.floor }} · {{ complaint.space }}</div>
          </div>
          <div>
            <div class="k">설비 카테고리</div>
            <div class="v">{{ categoryName(complaint.categoryCode) }}</div>
          </div>
          <div>
            <div class="k">우선순위</div>
            <div class="v">{{ priorityName(complaint.priority) }}</div>
          </div>
          <div>
            <div class="k">경과</div>
            <div class="v">{{ complaint.elapsed }}</div>
          </div>
        </div>
      </div>

      <div class="section-title">신고 내용</div>
      <div class="card">
        <p style="font-size: 13.5px; line-height: 1.6; margin: 0; white-space: pre-wrap">{{ complaint.content }}</p>
      </div>

      <!-- FR-206: 동일 위치·카테고리의 진행 중 민원 (AS-04 중복 판단 근거) -->
      <template v-if="complaint.relatedActive?.length">
        <div class="section-title">동일 위치 · 카테고리 진행 중 민원</div>
        <div class="notice warn">
          같은 위치에 진행 중인 민원이 있습니다. 동일 건이면 관리소장에게 중복 반려를 요청하세요.
        </div>
        <router-link
          v-for="r in complaint.relatedActive"
          :key="r.id"
          class="list-item"
          style="margin-top: 8px"
          :to="{ name: 'worker-complaint', params: { id: r.id } }"
        >
          <div class="top">
            <StatusBadge :status="r.status" />
            <span class="who">{{ r.assigneeName ?? '미배정' }}</span>
          </div>
          <div class="title">{{ r.title }}</div>
          <div class="meta">{{ r.id }} · {{ r.elapsed }}</div>
        </router-link>
      </template>

      <div v-if="offCategory" class="notice warn" style="margin-top: 16px">
        <strong>담당 외 카테고리입니다</strong><br />
        선점은 가능하지만, 처리 가능 여부를 먼저 확인해 주세요.
      </div>

      <div class="section-title">처리 이력</div>
      <div class="card">
        <div class="timeline">
          <div v-for="(h, i) in complaint.history" :key="i" class="node">
            <div class="act">{{ actionLabel(h.action) }}</div>
            <div class="at">{{ formatDateTime(h.at) }} · {{ h.actorName }}</div>
          </div>
        </div>
      </div>

      <button
        v-if="complaint.status === 'RECEIVED'"
        class="btn"
        style="margin-top: 16px"
        :disabled="busy"
        @click="onClaimClick"
      >
        {{ busy ? '처리 중…' : '이 민원 선점하기' }}
      </button>
      <div v-else class="notice info" style="margin-top: 16px">
        {{ complaint.assigneeName ?? '다른 작업자' }}가 처리 중이거나 종료된 민원입니다.
      </div>
    </template>
  </main>

  <!-- W-04 담당 외 카테고리 경고 -->
  <ModalSheet
    v-if="warnOffCategory"
    center
    icon="!"
    icon-tone="amber"
    title="담당 외 카테고리입니다"
    message="담당하지 않는 설비의 민원입니다. 선점하면 처리 책임이 본인에게 배정됩니다. 그래도 진행할까요?"
    @close="warnOffCategory = false"
  >
    <button class="btn" :disabled="busy" @click="doClaim">그래도 선점</button>
    <button class="btn ghost" @click="warnOffCategory = false">취소</button>
  </ModalSheet>

  <!-- E-01 선점 경합 실패 (409) -->
  <ModalSheet
    v-if="conflict"
    center
    icon="!"
    icon-tone="red"
    title="이미 선점된 민원입니다"
    message="다른 작업자가 먼저 이 민원을 가져갔습니다. 미배정 목록을 새로 불러옵니다."
    @close="router.replace('/worker')"
  >
    <button class="btn" @click="router.replace('/worker')">목록으로 돌아가기</button>
  </ModalSheet>
</template>
