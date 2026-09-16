<script setup>
// U-02 민원 등록 — 단일 페이지, 4개 묶음 (개편 기획 6.2)
import { computed, reactive, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import PubShell from '@/components/PubShell.vue'
import AppDialog from '@/components/AppDialog.vue'
import { CATEGORIES, FLOORS, PRIORITIES, SPACES } from '@/mock/constants'
import { registerComplaint } from '@/mock/api'

const router = useRouter()
const form = ref({ floor: '', space: '', categoryCode: '', priority: 'NORMAL', title: '', content: '', photos: [], password: '' })
const busy = ref(false)
const apiError = ref('')
const submitted = ref(false)
const touched = reactive({})
const done = ref(false)
const fieldEls = {}
const setEl = (k) => (el) => { fieldEls[k] = el }

const PRIORITY_DESC = {
  URGENT: '안전 위험이 있거나 피해가 빠르게 커지고 있어요.',
  NORMAL: '시설 이용이 불편해 확인과 조치가 필요해요.',
  LOW: '이용은 가능하지만 점검이 필요해요.'
}

function validate(f) {
  const e = {}
  if (!f.floor) e.floor = '층을 선택해 주세요.'
  if (!f.space) e.space = '공간을 선택해 주세요.'
  if (!f.categoryCode) e.categoryCode = '설비를 선택해 주세요. 모르면 "기타·모름"을 고르세요.'
  if (!f.title.trim()) e.title = '한 줄 요약을 입력해 주세요.'
  if (!f.content.trim()) e.content = '자세한 증상을 입력해 주세요.'
  if (!/^\d{4}$/.test(f.password)) e.password = '숫자 4자리를 입력해 주세요.'
  return e
}
const errors = computed(() => validate(form.value))
const showErr = (k) => (touched[k] || submitted.value) && errors.value[k]

const dirty = computed(() =>
  !done.value && JSON.stringify(form.value) !==
  JSON.stringify({ floor: '', space: '', categoryCode: '', priority: 'NORMAL', title: '', content: '', photos: [], password: '' }))

function onPhoto(e) {
  form.value.photos = [...form.value.photos, ...[...(e.target.files ?? [])].map((f) => f.name)]
  e.target.value = ''
}
const removePhoto = (i) => form.value.photos.splice(i, 1)

async function submit() {
  if (busy.value) return
  submitted.value = true
  const e = validate(form.value)
  if (Object.keys(e).length) {
    fieldEls[Object.keys(e)[0]]?.focus()
    return
  }
  busy.value = true; apiError.value = ''
  try {
    const c = await registerComplaint(form.value)
    done.value = true
    router.replace({ name: 'report-done', params: { id: c.id } })
  } catch (err) { apiError.value = err.message } finally { busy.value = false }
}

// 작성 중 이탈 확인 — 아무것도 입력하지 않았다면 그냥 나간다
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
    <router-link to="/" class="backlink">← 처음으로</router-link>
    <div style="padding: 18px 0 24px; border-bottom: 1px solid var(--line-2)">
      <h1 class="display" style="font-size: 30px">민원 등록</h1>
      <p class="lede" style="font-size: 14.5px; margin-top: 8px">어디가, 어떻게 불편한지 알려주세요.</p>
      <p class="hint" style="margin-top: 10px">필수 항목(<span style="color: var(--alert); font-weight: 700">*</span>)을 입력해 주세요. 사진은 선택입니다.</p>
    </div>

    <div style="padding: 28px 0 0">
      <div class="fgroup">
        <p class="gt">위치와 설비</p>
        <div class="field">
          <div class="row2">
            <div>
              <label class="label req" for="f-floor">층</label>
              <select id="f-floor" :ref="setEl('floor')" v-model="form.floor" class="select" :class="{ invalid: showErr('floor') }"
                @blur="touched.floor = true">
                <option value="">선택</option>
                <option v-for="f in FLOORS" :key="f" :value="f">{{ f }}</option>
              </select>
              <p v-if="showErr('floor')" class="ferr">{{ errors.floor }}</p>
            </div>
            <div>
              <label class="label req" for="f-space">공간</label>
              <select id="f-space" :ref="setEl('space')" v-model="form.space" class="select" :class="{ invalid: showErr('space') }"
                @blur="touched.space = true">
                <option value="">선택</option>
                <option v-for="s in SPACES" :key="s" :value="s">{{ s }}</option>
              </select>
              <p v-if="showErr('space')" class="ferr">{{ errors.space }}</p>
            </div>
          </div>
        </div>
        <div class="field">
          <label class="label req" for="f-cat">어떤 설비인가요</label>
          <select id="f-cat" :ref="setEl('categoryCode')" v-model="form.categoryCode" class="select" :class="{ invalid: showErr('categoryCode') }"
            @blur="touched.categoryCode = true">
            <option value="">선택</option>
            <option v-for="c in CATEGORIES" :key="c.code" :value="c.code">{{ c.name }} ({{ c.desc }})</option>
          </select>
          <p v-if="showErr('categoryCode')" class="ferr">{{ errors.categoryCode }}</p>
          <p v-else class="hint" style="margin-top: 6px">잘 모르겠으면 "기타·모름"을 선택해 주세요. 관리소장이 확인 후 바로잡습니다.</p>
        </div>
      </div>

      <div class="fgroup">
        <p class="gt">불편한 내용</p>
        <div class="field">
          <label class="label req" for="f-title">한 줄 요약</label>
          <input id="f-title" :ref="setEl('title')" v-model="form.title" class="input" :class="{ invalid: showErr('title') }"
            maxlength="60" placeholder="예) 6층 화장실 세면대 물이 샙니다" @blur="touched.title = true" />
          <div style="display: flex; gap: 10px; margin-top: 6px">
            <p v-if="showErr('title')" class="ferr" style="margin: 0">{{ errors.title }}</p>
            <span class="hint mono" style="margin-left: auto">{{ form.title.length }}/60</span>
          </div>
        </div>
        <div class="field">
          <label class="label req" for="f-content">자세한 증상</label>
          <textarea id="f-content" :ref="setEl('content')" v-model="form.content" class="textarea" :class="{ invalid: showErr('content') }"
            placeholder="언제부터, 어떤 상태인지 적어주시면 기사가 준비해서 갑니다" @blur="touched.content = true" />
          <p v-if="showErr('content')" class="ferr">{{ errors.content }}</p>
        </div>
        <div class="field">
          <label class="label">사진 <span class="hint" style="font-weight: 400">(선택)</span></label>
          <label class="btn line wide" style="text-align: center; display: block">
            사진 첨부
            <input type="file" accept="image/*" multiple hidden @change="onPhoto" />
          </label>
          <div v-if="form.photos.length" class="filelist">
            <div v-for="(p, i) in form.photos" :key="`${p}-${i}`" class="f">
              <span class="mono">{{ p }}</span>
              <button type="button" class="fx-del" :aria-label="`${p} 제거`" @click="removePhoto(i)">×</button>
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
          <!-- 긴급은 경고 박스가 같은 말을 더 강하게 하므로 설명 문장을 겹쳐 두지 않는다 (UX-04) -->
          <p v-if="form.priority !== 'URGENT'" class="hint" style="margin-top: 8px">{{ PRIORITY_DESC[form.priority] }}</p>
          <div v-else class="note warn" style="margin-top: 10px">
            안전 위험이나 큰 피해가 우려되면 먼저 긴급 직통
            <a href="tel:0234567899" class="mono" style="font-weight: 700; color: var(--alert)">02-3456-7899</a>로 연락해 주세요.
            온라인 접수는 즉시 출동을 보장하지 않습니다.
          </div>
        </div>
      </div>

      <div class="fgroup">
        <p class="gt">수정·취소 확인</p>
        <div class="field">
          <label class="label req" for="f-pw">비밀번호 (숫자 4자리)</label>
          <input id="f-pw" :ref="setEl('password')" v-model="form.password" class="input mono" :class="{ invalid: showErr('password') }"
            inputmode="numeric" maxlength="4" placeholder="0000" style="max-width: 150px" @blur="touched.password = true" />
          <p v-if="showErr('password')" class="ferr">{{ errors.password }}</p>
          <p v-else class="hint" style="margin-top: 6px">수정하거나 취소할 때 필요합니다. 조회할 때는 입력하지 않습니다.</p>
        </div>
      </div>

      <p v-if="apiError" class="note warn" style="margin-top: 18px">{{ apiError }}</p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--line-2); display: flex; align-items: center; gap: 14px">
        <button class="btn lg" :disabled="busy" @click="submit">{{ busy ? '접수 중…' : '접수하기' }}</button>
        <router-link to="/" class="backlink">작성 취소</router-link>
      </div>
    </div>

    <AppDialog v-if="leaveTo" title="작성을 그만둘까요?"
      message="지금 나가면 작성한 내용이 사라집니다." @close="stayHere">
      <template #actions>
        <button class="btn line" @click="stayHere">계속 작성</button>
        <button class="btn warn" @click="leaveAnyway">나가기</button>
      </template>
    </AppDialog>
  </PubShell>
</template>
