<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBar from '@/components/AppBar.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ModalSheet from '@/components/ModalSheet.vue'
import {
  assignComplaint,
  getComplaint,
  listWorkers,
  revokeAssignment,
  updateClassification
} from '@/mock/api'
import { CATEGORIES, FLOORS, PRIORITIES, SPACES, categoryName } from '@/mock/constants'
import { actionLabel, formatDateTime } from '@/utils/format'
import { auth } from '@/stores/auth'
import { devModal } from '@/utils/devModal'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const complaint = ref(null)
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const savedNote = ref('')

const classification = ref({ floor: '', space: '', categoryCode: '', priority: '' })

const showAssign = ref(false)
const workers = ref([])
const selectedWorker = ref('')

onMounted(load)

async function load() {
  loading.value = true
  try {
    const c = await getComplaint(id)
    complaint.value = c
    classification.value = {
      floor: c.floor, space: c.space, categoryCode: c.categoryCode, priority: c.priority
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
  if (devModal('assign')) await openAssign()
}

async function saveClassification() {
  busy.value = true
  error.value = ''
  savedNote.value = ''
  try {
    complaint.value = await updateClassification(id, classification.value, auth.state.user.name)
    savedNote.value = '분류 정보를 수정했습니다.'
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

async function openAssign() {
  workers.value = await listWorkers()
  selectedWorker.value = ''
  showAssign.value = true
}

async function doAssign() {
  if (!selectedWorker.value) return
  busy.value = true
  try {
    complaint.value = await assignComplaint(id, selectedWorker.value, auth.state.user.name)
    showAssign.value = false
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

async function doRevoke() {
  busy.value = true
  try {
    complaint.value = await revokeAssignment(id, auth.state.user.name)
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppBar title="민원 상세" :back="{ path: '/admin/complaints' }" />

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
            <div class="k">담당자</div>
            <div class="v">{{ complaint.assigneeName ?? '미배정' }}</div>
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

      <!-- FR-307: 분류 정보만 수정 가능. 신고 원문은 수정 대상이 아니다. -->
      <div class="section-title">분류 정보 수정</div>
      <div class="card">
        <p class="hint" style="margin-bottom: 10px">
          신고 원문(제목·내용·사진)은 신고자의 진술 기록이므로 수정할 수 없습니다.
        </p>
        <div class="row2" style="margin-bottom: 8px">
          <select v-model="classification.floor" class="select">
            <option v-for="f in FLOORS" :key="f" :value="f">{{ f }}</option>
          </select>
          <select v-model="classification.space" class="select">
            <option v-for="s in SPACES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <select v-model="classification.categoryCode" class="select" style="margin-bottom: 8px">
          <option v-for="c in CATEGORIES" :key="c.code" :value="c.code">{{ c.name }}</option>
        </select>
        <div class="chips" style="margin-bottom: 10px">
          <button
            v-for="p in PRIORITIES"
            :key="p.code"
            class="chip"
            :class="{ on: classification.priority === p.code }"
            @click="classification.priority = p.code"
          >
            {{ p.name }}
          </button>
        </div>
        <button class="btn ghost" :disabled="busy" @click="saveClassification">분류 정보 수정</button>
        <p v-if="savedNote" class="hint" style="color: var(--green); margin-top: 8px">{{ savedNote }}</p>
      </div>

      <div class="section-title">처리 이력</div>
      <div class="card">
        <div class="timeline">
          <div v-for="(h, i) in complaint.history" :key="i" class="node">
            <div class="act">{{ actionLabel(h.action) }}</div>
            <div class="at">{{ formatDateTime(h.at) }} · {{ h.actorName }}{{ h.note ? ` · ${h.note}` : '' }}</div>
          </div>
        </div>
      </div>

      <p v-if="error" class="notice error" style="margin-top: 14px">{{ error }}</p>

      <template v-if="['RECEIVED', 'IN_PROGRESS'].includes(complaint.status)">
        <div class="btn-row" style="margin-top: 14px">
          <button class="btn" :disabled="busy" @click="openAssign">
            {{ complaint.status === 'RECEIVED' ? '강제 배정' : '재배정' }}
          </button>
          <button
            class="btn ghost"
            :disabled="busy || complaint.status !== 'IN_PROGRESS'"
            @click="doRevoke"
          >
            배정 회수
          </button>
        </div>
        <button
          class="btn danger-ghost"
          style="margin-top: 8px"
          @click="router.push({ name: 'admin-reject', params: { id } })"
        >
          민원 반려
        </button>
      </template>
    </template>
  </main>

  <!-- A-04 강제 배정: 작업자별 보유 건수를 근거로 대상을 고른다 (AS-02 해소) -->
  <ModalSheet v-if="showAssign" @close="showAssign = false">
    <h2 style="text-align: left">작업자 선택</h2>
    <p style="text-align: left">담당 카테고리와 현재 보유 건수를 확인하고 배정합니다.</p>
    <div
      v-for="w in workers"
      :key="w.id"
      class="card"
      style="display: flex; align-items: center; justify-content: space-between; cursor: pointer"
      :style="selectedWorker === w.id ? 'border-color: var(--blue); background: var(--blue-weak)' : ''"
      @click="selectedWorker = w.id"
    >
      <div>
        <div style="font-size: 14px; font-weight: 700">{{ w.name }}</div>
        <div class="hint" style="margin-top: 2px">
          {{ w.categories.length > 3 ? '전 카테고리' : w.categories.map(categoryName).join(', ') }}
        </div>
      </div>
      <div style="font-size: 14px; font-weight: 700; color: var(--text-2)">{{ w.holding }}건</div>
    </div>
    <button class="btn" style="margin-top: 14px" :disabled="!selectedWorker || busy" @click="doAssign">
      강제 배정하기
    </button>
    <button class="btn ghost" @click="showAssign = false">닫기</button>
  </ModalSheet>
</template>
