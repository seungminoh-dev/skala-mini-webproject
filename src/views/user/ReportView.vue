<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppBar from '@/components/AppBar.vue'
import TabBar from '@/components/TabBar.vue'
import { CATEGORIES, FLOORS, PRIORITIES, SPACES } from '@/mock/constants'
import { registerComplaint } from '@/mock/api'

const router = useRouter()
const form = ref({
  floor: '', space: '', categoryCode: '', priority: 'NORMAL',
  title: '', content: '', photos: [], password: ''
})
const submitting = ref(false)
const error = ref('')

const valid = computed(() => {
  const f = form.value
  return f.floor && f.space && f.categoryCode && f.title.trim() && f.content.trim() && /^\d{4}$/.test(f.password)
})

function onPhoto(e) {
  const files = [...(e.target.files ?? [])]
  form.value.photos = [...form.value.photos, ...files.map((f) => f.name)]
  e.target.value = ''
}

async function submit() {
  if (!valid.value || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    const created = await registerComplaint(form.value)
    router.replace({ name: 'report-done', params: { id: created.id } })
  } catch (e) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppBar title="민원 신고" :back="{ path: '/' }" />

  <main class="screen narrow">
    <div class="field">
      <label class="label">위치</label>
      <div class="row2">
        <select v-model="form.floor" class="select">
          <option value="">층 선택</option>
          <option v-for="f in FLOORS" :key="f" :value="f">{{ f }}</option>
        </select>
        <select v-model="form.space" class="select">
          <option value="">공간 선택</option>
          <option v-for="s in SPACES" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
    </div>

    <div class="field">
      <label class="label">설비 카테고리</label>
      <select v-model="form.categoryCode" class="select">
        <option value="">카테고리 선택</option>
        <option v-for="c in CATEGORIES" :key="c.code" :value="c.code">{{ c.name }}</option>
      </select>
    </div>

    <div class="field">
      <label class="label">체감 우선순위</label>
      <div class="chips">
        <button
          v-for="p in PRIORITIES"
          :key="p.code"
          class="chip"
          :class="{ on: form.priority === p.code }"
          @click="form.priority = p.code"
        >
          {{ p.name }}
        </button>
      </div>
    </div>

    <div class="field">
      <label class="label">제목</label>
      <input v-model="form.title" class="input" placeholder="불편 사항을 짧게 입력" maxlength="60" />
    </div>

    <div class="field">
      <label class="label">상세 내용</label>
      <textarea v-model="form.content" class="textarea" placeholder="발생 위치와 증상을 자세히 입력" />
    </div>

    <div class="field">
      <label class="label">사진</label>
      <label
        class="card"
        style="display: grid; place-items: center; color: var(--text-3); font-size: 13px; cursor: pointer; padding: 22px"
      >
        ＋ 사진 첨부
        <input type="file" accept="image/*" multiple hidden @change="onPhoto" />
      </label>
      <div v-if="form.photos.length" class="chips" style="margin-top: 8px">
        <span v-for="(p, i) in form.photos" :key="i" class="chip">{{ p }}</span>
      </div>
    </div>

    <div class="field">
      <label class="label">수정·취소용 4자리 비밀번호</label>
      <input
        v-model="form.password"
        class="input"
        inputmode="numeric"
        maxlength="4"
        placeholder="●●●●"
      />
      <p class="hint" style="margin-top: 6px">조회할 때는 비밀번호가 필요하지 않습니다.</p>
    </div>

    <p v-if="error" class="notice error" style="margin-top: 12px">{{ error }}</p>

    <button class="btn" style="margin-top: 16px" :disabled="!valid || submitting" @click="submit">
      {{ submitting ? '접수 중…' : '접수하기' }}
    </button>
  </main>

  <TabBar role="USER" />
</template>
