<script setup>
// U-07 민원 수정 — 등록 폼과 같은 구성·검증 (개편 기획 6.7)
import { computed, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import PubShell from '@/components/PubShell.vue'
import AppDialog from '@/components/AppDialog.vue'
import { CATEGORIES, FLOORS, PRIORITIES, SPACES } from '@/mock/constants'
import { getComplaint, updateComplaint } from '@/mock/api'
import { verifyStore } from '@/stores/verify'
import { devModal } from '@/utils/devModal'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const password = verifyStore.get(id) ?? (devModal('edit') ? '2222' : null)
const form = ref(null); const initial = ref('')
const loading = ref(true); const saving = ref(false)
const apiError = ref(''); const raced = ref(false)
const submitted = ref(false)
const touched = reactive({})
const saved = ref(false)
const fieldEls = {}
const setEl = (k) => (el) => { fieldEls[k] = el }

onMounted(async () => {
  if (!password) { router.replace({ name: 'complaint', params: { id } }); return }
  try {
    const c = await getComplaint(id)
    form.value = { title: c.title, content: c.content, floor: c.floor, space: c.space,
      categoryCode: c.categoryCode, priority: c.priority, photos: [...(c.photos ?? [])] }
    initial.value = JSON.stringify(form.value)
  } catch (e) { apiError.value = e.message } finally { loading.value = false }
})

function validate(f) {
  const e = {}
  if (!f.floor) e.floor = '층을 선택해 주세요.'
  if (!f.space) e.space = '공간을 선택해 주세요.'
  if (!f.categoryCode) e.categoryCode = '설비를 선택해 주세요.'
  if (!f.title.trim()) e.title = '한 줄 요약을 입력해 주세요.'
  if (!f.content.trim()) e.content = '자세한 증상을 입력해 주세요.'
  return e
}
const errors = computed(() => (form.value ? validate(form.value) : {}))
const showErr = (k) => (touched[k] || submitted.value) && errors.value[k]
const dirty = computed(() => form.value && !saved.value && JSON.stringify(form.value) !== initial.value)

function onPhoto(e) {
  form.value.photos = [...form.value.photos, ...[...(e.target.files ?? [])].map((f) => f.name)]
  e.target.value = ''
}
const removePhoto = (i) => form.value.photos.splice(i, 1)

async function save() {
  if (saving.value) return
  submitted.value = true
  const e = validate(form.value)
  if (Object.keys(e).length) { fieldEls[Object.keys(e)[0]]?.focus(); return }
  saving.value = true; apiError.value = ''
  try {
    await updateComplaint(id, password, form.value)
    saved.value = true
    verifyStore.clear(id)
    router.replace({ name: 'complaint', params: { id }, query: { updated: 1 } })
  } catch (err) {
    if (err.code === 'NOT_EDITABLE') raced.value = true // 저장 도중 배정됨 — 작성 내용은 지우지 않는다
    else apiError.value = err.message
  } finally { saving.value = false }
}
function goDetail() { saved.value = true; router.replace({ name: 'complaint', params: { id } }) }

const leaveTo = ref(null)
onBeforeRouteLeave((to) => {
  if (!dirty.value || leaveTo.value) return true
  leaveTo.value = to
  return false
})
const stayHere = () => { leaveTo.value = null }
const leaveAnyway = () => { const to = leaveTo.value; router.push(to) }
</script>

<template>
  <PubShell narrow>
    <p v-if="loading" class="empty">불러오는 중…</p>
    <template v-else-if="form">
      <div style="padding: 18px 0 24px; border-bottom: 1px solid var(--line-2)">
        <p class="eyebrow">본인 확인 완료</p>
        <h1 class="display" style="font-size: 28px; margin-top: 10px">민원 수정</h1>
        <p class="lede" style="font-size: 14px; margin-top: 8px">
          <span class="mono">{{ id }}</span> · 담당 기사가 배정되기 전까지만 고칠 수 있습니다.
        </p>
      </div>

      <div style="padding: 26px 0 0">
        <div class="fgroup">
          <p class="gt">위치와 설비</p>
          <div class="field">
            <div class="row2">
              <div>
                <label class="label req" for="e-floor">층</label>
                <select id="e-floor" :ref="setEl('floor')" v-model="form.floor" class="select" :class="{ invalid: showErr('floor') }" @blur="touched.floor = true">
                  <option v-for="f in FLOORS" :key="f" :value="f">{{ f }}</option>
                </select>
              </div>
              <div>
                <label class="label req" for="e-space">공간</label>
                <select id="e-space" :ref="setEl('space')" v-model="form.space" class="select" :class="{ invalid: showErr('space') }" @blur="touched.space = true">
                  <option v-for="s in SPACES" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
            </div>
          </div>
          <div class="field">
            <label class="label req" for="e-cat">어떤 설비인가요</label>
            <select id="e-cat" :ref="setEl('categoryCode')" v-model="form.categoryCode" class="select" :class="{ invalid: showErr('categoryCode') }" @blur="touched.categoryCode = true">
              <option v-for="cat in CATEGORIES" :key="cat.code" :value="cat.code">{{ cat.name }} ({{ cat.desc }})</option>
            </select>
          </div>
        </div>

        <div class="fgroup">
          <p class="gt">불편한 내용</p>
          <div class="field">
            <label class="label req" for="e-title">한 줄 요약</label>
            <input id="e-title" :ref="setEl('title')" v-model="form.title" class="input" :class="{ invalid: showErr('title') }" maxlength="60" @blur="touched.title = true" />
            <div style="display: flex; gap: 10px; margin-top: 6px">
              <p v-if="showErr('title')" class="ferr" style="margin: 0">{{ errors.title }}</p>
              <span class="hint mono" style="margin-left: auto">{{ form.title.length }}/60</span>
            </div>
          </div>
          <div class="field">
            <label class="label req" for="e-content">자세한 증상</label>
            <textarea id="e-content" :ref="setEl('content')" v-model="form.content" class="textarea" :class="{ invalid: showErr('content') }" @blur="touched.content = true" />
            <p v-if="showErr('content')" class="ferr">{{ errors.content }}</p>
          </div>
          <div class="field">
            <label class="label">사진 <span class="hint" style="font-weight: 400">(선택)</span></label>
            <label class="btn line wide" style="text-align: center; display: block">
              사진 추가
              <input type="file" accept="image/*" multiple hidden @change="onPhoto" />
            </label>
            <div v-if="form.photos.length" class="filelist">
              <div v-for="(p, i) in form.photos" :key="`${p}-${i}`" class="f">
                <span class="mono">{{ p.fileUrl ?? p }}</span>
                <button type="button" class="fx-del" :aria-label="`${p.fileUrl ?? p} 제거`" @click="removePhoto(i)">×</button>
              </div>
            </div>
          </div>
        </div>

        <div class="fgroup">
          <p class="gt">긴급도</p>
          <div class="field">
            <div class="filters" role="radiogroup" aria-label="긴급도">
              <button v-for="p in PRIORITIES" :key="p.code" type="button" class="ftog"
                :class="{ on: form.priority === p.code, alert: p.code === 'URGENT' && form.priority === 'URGENT' }"
                role="radio" :aria-checked="form.priority === p.code"
                @click="form.priority = p.code">{{ p.name }}</button>
            </div>
          </div>
        </div>

        <p v-if="apiError" class="note warn" style="margin-top: 18px">{{ apiError }}</p>

        <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--line-2); display: flex; align-items: center; gap: 14px">
          <button class="btn lg" :disabled="saving" @click="save">{{ saving ? '저장 중…' : '수정 완료' }}</button>
          <router-link :to="{ name: 'complaint', params: { id } }" class="backlink">수정 취소</router-link>
        </div>
      </div>

      <!-- 저장 도중 배정 경합 — 작성 내용을 즉시 비우지 않는다 -->
      <AppDialog v-if="raced" danger title="지금은 수정할 수 없습니다"
        message="저장하는 사이 담당 기사가 배정됐습니다. 배정 후에는 내용을 바꿀 수 없습니다."
        @close="raced = false">
        <template #actions>
          <button class="btn line" @click="raced = false">작성 내용 보기</button>
          <button class="btn" @click="goDetail">최신 상태 확인</button>
        </template>
      </AppDialog>

      <AppDialog v-if="leaveTo" title="수정을 그만둘까요?"
        message="저장하지 않은 변경 내용이 사라집니다." @close="stayHere">
        <template #actions>
          <button class="btn line" @click="stayHere">계속 수정</button>
          <button class="btn warn" @click="leaveAnyway">저장하지 않고 나가기</button>
        </template>
      </AppDialog>
    </template>
    <p v-else-if="apiError" class="note warn" style="margin-top: 24px">{{ apiError }}</p>
  </PubShell>
</template>
