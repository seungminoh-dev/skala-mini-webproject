<script setup>
// W-06 처리 결과 등록 — 작업 일지. 지시서를 옆에 두고 몇 초 안에 쓴다 (WORKER 개편 기획 6.4)
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import AppDialog from '@/components/AppDialog.vue'
import { completeComplaint, getWorkerComplaint, releaseComplaint } from '@/mock/api'
import { RESOLUTION_ACTIONS, categoryName } from '@/mock/constants'
import { TERMS } from '@/utils/labels'
import { actionLabel, formatDateTime } from '@/utils/format'
import { auth } from '@/stores/auth'
import { devModal } from '@/utils/devModal'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const c = ref(null); const loading = ref(true)
const picked = ref([]); const memo = ref(''); const photos = ref([])
const busy = ref(false); const submitted = ref(false)
const error = ref(''); const lost = ref(false)
const askRelease = ref(false); const releaseNote = ref('')
const done = ref(false)

onMounted(async () => {
  try { c.value = await getWorkerComplaint(id) } finally { loading.value = false }
  if (devModal('release')) askRelease.value = true
})

// 정형 조치를 하나라도 고르면 필수가 충족된다. 메모는 선택 (P-H).
const valid = computed(() => picked.value.length > 0)
const showErr = computed(() => submitted.value && !valid.value)
function toggle(label) {
  const i = picked.value.indexOf(label)
  i === -1 ? picked.value.push(label) : picked.value.splice(i, 1)
}

function onPhoto(e) {
  photos.value = [...photos.value, ...[...(e.target.files ?? [])].map((f) => f.name)]
  e.target.value = ''
}
const removePhoto = (i) => photos.value.splice(i, 1)

async function complete() {
  submitted.value = true
  if (!valid.value || busy.value) return
  busy.value = true; error.value = ''
  try {
    // 선택지와 메모를 한 문장으로 합쳐 넣는다 — API·ERD 는 그대로다.
    const content = picked.value.join(' · ') + (memo.value.trim() ? ` — ${memo.value.trim()}` : '')
    await completeComplaint(id, auth.state.user.id, { content, photos: photos.value })
    done.value = true
    router.replace('/worker/tasks?done=completed')
  } catch (e) {
    // 관리소장이 회수·재배정한 경우. 적던 내용은 지우지 않고, 나갈 길만 열어 준다.
    lost.value = e.code === 'NOT_ASSIGNEE'
    error.value = lost.value
      ? '이 작업은 더 이상 내 담당이 아닙니다. 관리소장이 담당을 바꿨습니다.'
      : e.message
  } finally { busy.value = false }
}

async function release() {
  busy.value = true
  try {
    await releaseComplaint(id, auth.state.user.id, releaseNote.value.trim() || null)
    done.value = true
    router.replace('/worker?done=released')
  } catch (e) { error.value = e.message; askRelease.value = false } finally { busy.value = false }
}

// 담당이 바뀐 뒤에는 남길 곳이 없다. 확인 없이 내 작업으로 보낸다.
function goTasks() { done.value = true; router.replace('/worker/tasks') }

// 작성 중 이탈 확인 — 아무것도 입력하지 않았다면 그냥 나간다
const dirty = computed(() => !done.value && (picked.value.length > 0 || memo.value.trim() || photos.value.length))
const leaveTo = ref(null)
onBeforeRouteLeave((to) => {
  if (!dirty.value || leaveTo.value) return true
  leaveTo.value = to
  return false
})
const stayHere = () => { leaveTo.value = null }
const leaveAnyway = () => { const to = leaveTo.value; done.value = true; router.push(to) }
</script>

<template>
  <StaffShell title="처리 결과 남기기">
    <template #sub>
      <span v-if="c" style="display: inline-flex; align-items: center; gap: 9px; flex-wrap: wrap">
        <StatusMark :status="c.status" />
        <strong style="color: var(--ink); font-size: 13.5px">{{ c.title }}</strong>
        <span>{{ c.floor }} {{ c.space }}</span>
        <span class="mono">{{ c.id }}</span>
      </span>
    </template>

    <div class="page page-narrow">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <div v-else-if="c" class="wcols">
        <section>
          <div class="field">
            <p class="label req">어떻게 조치했나요</p>
            <p class="hint" style="margin: -2px 0 8px">해당하는 것을 고르세요. 여러 개 고를 수 있습니다.</p>
            <div class="choices">
              <button v-for="a in RESOLUTION_ACTIONS" :key="a" type="button" class="ftog"
                :class="{ on: picked.includes(a) }" :aria-pressed="picked.includes(a)" @click="toggle(a)">{{ a }}</button>
            </div>
            <p v-if="showErr" class="ferr">조치 내용을 골라 주세요.</p>
          </div>

          <div class="field">
            <label class="label" for="memo">메모 <span class="hint" style="font-weight: 400">(선택)</span></label>
            <textarea id="memo" v-model="memo" class="textarea" style="min-height: 72px"
              placeholder="예) 배수 트랩 패킹 교체. 누수 없는 것 확인했습니다." />
          </div>

          <div class="field">
            <p class="label">조치 사진 <span class="hint" style="font-weight: 400">(선택)</span></p>
            <label class="btn line" style="display: inline-block">
              사진 첨부
              <input type="file" accept="image/*" multiple hidden @change="onPhoto" />
            </label>
            <div v-if="photos.length" class="filelist" style="max-width: 420px">
              <div v-for="(p, i) in photos" :key="`${p}-${i}`" class="f">
                <span class="mono">{{ p }}</span>
                <button type="button" class="fx-del" :aria-label="`${p} 제거`" @click="removePhoto(i)">×</button>
              </div>
            </div>
          </div>

          <div v-if="error" class="note warn" style="margin-top: 16px">
            {{ error }}
            <p v-if="lost" style="margin-top: 10px">
              <button class="btn line sm" @click="goTasks">내 작업으로</button>
            </p>
          </div>

          <!-- 주 행동은 폼 하단에. 비어 있어도 눌러 볼 수 있고 이유는 항목 아래에 뜬다 (WX-17) -->
          <div class="formfoot">
            <button class="btn" :disabled="busy" @click="complete">{{ busy ? '처리 중…' : '작업 완료' }}</button>
            <button class="btn line" :disabled="busy" @click="askRelease = true">{{ TERMS.release }}</button>
            <span class="hint">완료하면 신고자에게 그대로 보입니다. 처리 시간은 접수 시각부터 자동으로 계산됩니다.</span>
          </div>
        </section>

        <!-- 보조 열 — 원문을 보러 화면을 나갈 필요가 없게 한다 (WX-16) -->
        <aside>
          <div class="aside-box">
            <div class="ak">신고 내용</div>
            <div class="av">{{ c.content }}</div>
          </div>
          <div class="aside-box">
            <div class="ak">위치 · 설비</div>
            <div class="av"><strong style="color: var(--ink)">{{ c.floor }} {{ c.space }}</strong> · {{ categoryName(c.categoryCode) }}</div>
          </div>
          <div class="aside-box">
            <div class="ak">첨부 사진</div>
            <div v-if="c.photos?.length" class="filelist">
              <div v-for="(p, i) in c.photos" :key="i" class="f"><span class="mono">{{ p.fileUrl ?? p }}</span></div>
            </div>
            <div v-else class="av">첨부 사진 없음</div>
          </div>
          <div class="aside-box">
            <div class="ak">처리 이력</div>
            <div class="timeline" style="margin-top: 10px">
              <div v-for="(h, i) in c.history" :key="i" class="ev">
                <div class="act">{{ actionLabel(h.action) }}</div>
                <div class="at">{{ formatDateTime(h.at) }} · {{ h.actorName }}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <!-- E-04 반납 확인 -->
    <AppDialog v-if="askRelease" title="이 민원을 반납할까요?"
      message="지금 적던 내용은 저장되지 않습니다. 이 민원은 미배정 목록으로 돌아가 다른 기사가 맡을 수 있게 됩니다."
      @close="askRelease = false">
      <template #body>
        <label class="label" for="rel-note">반납 사유 <span class="hint" style="font-weight: 400">(선택)</span></label>
        <input id="rel-note" v-model="releaseNote" class="input" maxlength="60"
          placeholder="예) 부품이 없어 오늘 처리 불가" />
        <p class="hint" style="margin-top: 6px">적어 두면 관리소장이 재배정할 때 참고합니다.</p>
      </template>
      <template #actions>
        <button class="btn line" data-autofocus @click="askRelease = false">계속 하기</button>
        <button class="btn" :disabled="busy" @click="release">{{ TERMS.release }}</button>
      </template>
    </AppDialog>

    <AppDialog v-if="leaveTo" title="작성을 그만둘까요?"
      message="작성 중인 결과가 사라집니다." @close="stayHere">
      <template #actions>
        <button class="btn line" data-autofocus @click="stayHere">계속 작성</button>
        <button class="btn warn" @click="leaveAnyway">나가기</button>
      </template>
    </AppDialog>
  </StaffShell>
</template>
