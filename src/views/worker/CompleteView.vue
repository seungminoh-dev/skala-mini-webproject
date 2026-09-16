<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import AppDialog from '@/components/AppDialog.vue'
import { completeComplaint, getWorkerComplaint, releaseComplaint } from '@/mock/api'
import { auth } from '@/stores/auth'
import { devModal } from '@/utils/devModal'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const c = ref(null); const loading = ref(true)
const form = ref({ content: '', photos: [], hours: '', minutes: '' })
const busy = ref(false); const error = ref(''); const askRelease = ref(false)

onMounted(async () => {
  try { c.value = await getWorkerComplaint(id) } finally { loading.value = false }
  if (devModal('release')) askRelease.value = true
})
const valid = computed(() => form.value.content.trim().length > 0)
function onPhoto(e) {
  form.value.photos = [...form.value.photos, ...[...(e.target.files ?? [])].map((f) => f.name)]
  e.target.value = ''
}
async function complete() {
  if (!valid.value || busy.value) return
  busy.value = true; error.value = ''
  try {
    await completeComplaint(id, auth.state.user.id, {
      content: form.value.content, photos: form.value.photos,
      durationMinutes: (Number(form.value.hours) || 0) * 60 + (Number(form.value.minutes) || 0)
    })
    router.replace('/worker/tasks')
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
async function release() {
  busy.value = true
  try { await releaseComplaint(id, auth.state.user.id); router.replace('/worker') }
  catch (e) { error.value = e.message; askRelease.value = false } finally { busy.value = false }
}
</script>

<template>
  <StaffShell title="처리 결과 남기기" sub="여기 적은 내용이 그대로 신고자에게 보이고, 정비 이력으로 쌓입니다">
    <template #actions>
      <button class="btn line" @click="askRelease = true">작업 넘기기</button>
      <button class="btn" :disabled="!valid || busy" @click="complete">{{ busy ? '처리 중…' : '작업 완료' }}</button>
    </template>

    <div class="page">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <template v-else-if="c">
        <div style="display: flex; align-items: center; gap: 12px">
          <StatusMark :status="c.status" />
          <span class="mono hint">{{ c.id }}</span>
        </div>
        <h2 style="font-size: 20px; font-weight: 700; color: var(--ink); margin: 8px 0 22px">{{ c.title }}</h2>

        <div style="max-width: 620px">
          <div class="field">
            <label class="label">무엇을 어떻게 조치했나요</label>
            <textarea v-model="form.content" class="textarea" placeholder="예) 배수 트랩 패킹 교체. 누수 없는 것 확인했습니다." />
          </div>
          <div class="field">
            <label class="label">조치 사진 <span class="hint" style="font-weight: 400">(선택)</span></label>
            <label class="btn line" style="display: inline-block">
              사진 첨부
              <input type="file" accept="image/*" multiple hidden @change="onPhoto" />
            </label>
            <p v-if="form.photos.length" class="hint mono" style="margin-top: 6px">{{ form.photos.join(', ') }}</p>
          </div>
          <div class="field">
            <label class="label">걸린 시간</label>
            <div class="row2" style="max-width: 260px">
              <input v-model="form.hours" class="input mono" inputmode="numeric" placeholder="시간" />
              <input v-model="form.minutes" class="input mono" inputmode="numeric" placeholder="분" />
            </div>
          </div>
          <p v-if="error" class="note warn" style="margin-top: 16px">{{ error }}</p>
        </div>
      </template>
    </div>

    <AppDialog v-if="askRelease" title="작업을 넘길까요?"
      message="지금 적던 내용은 저장되지 않습니다. 이 작업은 대기 목록으로 돌아가 다른 기사가 맡을 수 있게 됩니다."
      @close="askRelease = false">
      <template #actions>
        <button class="btn line" @click="askRelease = false">계속 하기</button>
        <button class="btn" :disabled="busy" @click="release">넘기기</button>
      </template>
    </AppDialog>
  </StaffShell>
</template>
