<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PubShell from '@/components/PubShell.vue'
import { CATEGORIES, FLOORS, PRIORITIES, SPACES } from '@/mock/constants'
import { registerComplaint } from '@/mock/api'

const router = useRouter()
const form = ref({ floor: '', space: '', categoryCode: '', priority: 'NORMAL', title: '', content: '', photos: [], password: '' })
const busy = ref(false)
const error = ref('')

const valid = computed(() => {
  const f = form.value
  return f.floor && f.space && f.categoryCode && f.title.trim() && f.content.trim() && /^\d{4}$/.test(f.password)
})
function onPhoto(e) {
  form.value.photos = [...form.value.photos, ...[...(e.target.files ?? [])].map((f) => f.name)]
  e.target.value = ''
}
async function submit() {
  if (!valid.value || busy.value) return
  busy.value = true; error.value = ''
  try {
    const c = await registerComplaint(form.value)
    router.replace({ name: 'report-done', params: { id: c.id } })
  } catch (e) { error.value = e.message } finally { busy.value = false }
}
</script>

<template>
  <PubShell narrow>
    <div style="padding: 40px 0 26px; border-bottom: 1px solid var(--line-2)">
      <h1 class="display" style="font-size: 30px">민원 등록</h1>
      <p class="lede" style="font-size: 14px; margin-top: 8px">어디가, 어떻게 불편한지 알려주세요.</p>
    </div>

    <div style="padding: 26px 0 0">
      <div class="field">
        <label class="label">위치</label>
        <div class="row2">
          <select v-model="form.floor" class="select">
            <option value="">층</option>
            <option v-for="f in FLOORS" :key="f" :value="f">{{ f }}</option>
          </select>
          <select v-model="form.space" class="select">
            <option value="">공간</option>
            <option v-for="s in SPACES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="label">어떤 설비인가요</label>
        <select v-model="form.categoryCode" class="select">
          <option value="">설비 선택 — 모르면 "기타·모름"을 고르세요</option>
          <option v-for="c in CATEGORIES" :key="c.code" :value="c.code">{{ c.name }} ({{ c.desc }})</option>
        </select>
        <p class="hint" style="margin-top: 6px">잘못 골라도 됩니다. 관리소장이 확인 후 바로잡습니다.</p>
      </div>

      <div class="field">
        <label class="label">긴급도</label>
        <div class="filters">
          <button v-for="p in PRIORITIES" :key="p.code" class="ftog"
            :class="{ on: form.priority === p.code, alert: p.code === 'URGENT' && form.priority === 'URGENT' }"
            @click="form.priority = p.code">{{ p.name }}</button>
        </div>
      </div>

      <div class="field">
        <label class="label">한 줄 요약</label>
        <input v-model="form.title" class="input" maxlength="60" placeholder="예) 6층 화장실 세면대 물이 샙니다" />
      </div>

      <div class="field">
        <label class="label">자세한 증상</label>
        <textarea v-model="form.content" class="textarea" placeholder="언제부터, 어떤 상태인지 적어주시면 기사가 준비해서 갑니다" />
      </div>

      <div class="field">
        <label class="label">사진 <span class="hint" style="font-weight: 400">(선택)</span></label>
        <label class="btn line wide" style="text-align: center; display: block">
          사진 첨부
          <input type="file" accept="image/*" multiple hidden @change="onPhoto" />
        </label>
        <p v-if="form.photos.length" class="hint mono" style="margin-top: 6px">{{ form.photos.join(', ') }}</p>
      </div>

      <div class="field">
        <label class="label">수정·취소용 비밀번호</label>
        <input v-model="form.password" class="input mono" inputmode="numeric" maxlength="4" placeholder="숫자 4자리" style="max-width: 140px" />
        <p class="hint" style="margin-top: 6px">이 민원을 나중에 수정하거나 취소할 때 확인하는 번호입니다.</p>
      </div>

      <p v-if="error" class="note warn" style="margin-top: 18px">{{ error }}</p>

      <div style="margin-top: 26px; padding-top: 20px; border-top: 1px solid var(--line-2); display: flex; align-items: center; gap: 14px">
        <button class="btn lg" :disabled="!valid || busy" @click="submit">
          {{ busy ? '접수 중…' : '접수하기' }}
        </button>
        <router-link to="/" class="backlink">작성 취소하고 처음으로</router-link>
      </div>
    </div>
  </PubShell>
</template>
