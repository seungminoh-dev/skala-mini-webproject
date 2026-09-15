<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBar from '@/components/AppBar.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import ModalSheet from '@/components/ModalSheet.vue'
import { completeComplaint, getWorkerComplaint, releaseComplaint } from '@/mock/api'
import { auth } from '@/stores/auth'
import { devModal } from '@/utils/devModal'

const route = useRoute()
const router = useRouter()
const id = route.params.id

const complaint = ref(null)
const loading = ref(true)
const form = ref({ content: '', photos: [], hours: '', minutes: '' })
const busy = ref(false)
const error = ref('')
const confirmRelease = ref(false)

onMounted(async () => {
  try {
    complaint.value = await getWorkerComplaint(id)
  } finally {
    loading.value = false
  }
  if (devModal('release')) confirmRelease.value = true
})

const valid = computed(() => form.value.content.trim().length > 0)

function onPhoto(e) {
  const files = [...(e.target.files ?? [])]
  form.value.photos = [...form.value.photos, ...files.map((f) => f.name)]
  e.target.value = ''
}

async function complete() {
  if (!valid.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    const durationMinutes = (Number(form.value.hours) || 0) * 60 + (Number(form.value.minutes) || 0)
    await completeComplaint(id, auth.state.user.id, {
      content: form.value.content,
      photos: form.value.photos,
      durationMinutes
    })
    router.replace('/worker/tasks')
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}

async function release() {
  busy.value = true
  try {
    await releaseComplaint(id, auth.state.user.id)
    router.replace('/worker')
  } catch (e) {
    error.value = e.message
    confirmRelease.value = false
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AppBar title="처리 결과 등록" :back="{ path: '/worker/tasks' }" />

  <main class="screen narrow">
    <p v-if="loading" class="empty">불러오는 중…</p>

    <template v-else-if="complaint">
      <div class="card">
        <StatusBadge :status="complaint.status" />
        <div style="font-size: 15px; font-weight: 700; margin: 8px 0 3px">{{ complaint.title }}</div>
        <div class="hint">{{ complaint.id }} · {{ complaint.floor }} · {{ complaint.space }}</div>
      </div>

      <div class="field" style="margin-top: 16px">
        <label class="label">조치 내용</label>
        <textarea v-model="form.content" class="textarea" placeholder="수행한 조치를 입력" />
      </div>

      <div class="field">
        <label class="label">조치 사진</label>
        <label
          class="card"
          style="display: grid; place-items: center; color: var(--text-3); font-size: 13px; cursor: pointer; padding: 18px"
        >
          ＋ 사진 첨부
          <input type="file" accept="image/*" multiple hidden @change="onPhoto" />
        </label>
        <div v-if="form.photos.length" class="chips" style="margin-top: 8px">
          <span v-for="(p, i) in form.photos" :key="i" class="chip">{{ p }}</span>
        </div>
      </div>

      <div class="field">
        <label class="label">소요 시간</label>
        <div class="row2">
          <input v-model="form.hours" class="input" inputmode="numeric" placeholder="시간" />
          <input v-model="form.minutes" class="input" inputmode="numeric" placeholder="분" />
        </div>
      </div>

      <p v-if="error" class="notice error" style="margin-top: 12px">{{ error }}</p>

      <button class="btn" style="margin-top: 16px" :disabled="!valid || busy" @click="complete">
        {{ busy ? '처리 중…' : '처리 완료' }}
      </button>
      <button class="btn ghost" :disabled="busy" @click="confirmRelease = true">작업 반납</button>
    </template>
  </main>

  <!-- E-04 작업 반납 확인 -->
  <ModalSheet
    v-if="confirmRelease"
    center
    icon="!"
    icon-tone="amber"
    title="미배정 목록으로 반납할까요?"
    message="작성 중인 처리 결과는 저장되지 않고 다른 작업자가 다시 선점할 수 있습니다."
    @close="confirmRelease = false"
  >
    <button class="btn" :disabled="busy" @click="release">작업 반납</button>
    <button class="btn ghost" @click="confirmRelease = false">계속 처리</button>
  </ModalSheet>
</template>
