<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppBar from '@/components/AppBar.vue'
import { CATEGORIES, FLOORS, PRIORITIES, SPACES } from '@/mock/constants'
import { getComplaint, updateComplaint } from '@/mock/api'
import { verifyStore } from '@/stores/verify'
import { devModal } from '@/utils/devModal'

const route = useRoute()
const router = useRouter()
const id = route.params.id
// 개발 모드에서 ?modal=edit 이면 본인 확인을 건너뛴다 (문서용 캡처).
const password = verifyStore.get(id) ?? (devModal('edit') ? '2222' : null)

const form = ref(null)
const loading = ref(true)
const saving = ref(false)
const error = ref('')

onMounted(async () => {
  // 본인 확인을 거치지 않았으면 상세 화면으로 되돌린다.
  if (!password) {
    router.replace({ name: 'complaint', params: { id } })
    return
  }
  try {
    const c = await getComplaint(id)
    form.value = {
      title: c.title, content: c.content, floor: c.floor, space: c.space,
      categoryCode: c.categoryCode, priority: c.priority, photos: [...(c.photos ?? [])]
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const valid = computed(() => {
  const f = form.value
  return f && f.floor && f.space && f.categoryCode && f.title.trim() && f.content.trim()
})

function onPhoto(e) {
  const files = [...(e.target.files ?? [])]
  form.value.photos = [...form.value.photos, ...files.map((f) => f.name)]
  e.target.value = ''
}

async function save() {
  if (!valid.value || saving.value) return
  saving.value = true
  error.value = ''
  try {
    await updateComplaint(id, password, form.value)
    verifyStore.clear(id)
    router.replace({ name: 'complaint', params: { id } })
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppBar title="민원 수정" :back="{ name: 'complaint', params: { id } }" />

  <main class="screen narrow">
    <p v-if="loading" class="empty">불러오는 중…</p>

    <template v-else-if="form">
      <div class="notice info">
        <strong>본인 확인이 완료되었습니다</strong><br />
        {{ id }} · 배정 전까지만 수정할 수 있습니다.
      </div>

      <div class="field" style="margin-top: 14px">
        <label class="label">위치</label>
        <div class="row2">
          <select v-model="form.floor" class="select">
            <option v-for="f in FLOORS" :key="f" :value="f">{{ f }}</option>
          </select>
          <select v-model="form.space" class="select">
            <option v-for="s in SPACES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="label">설비 카테고리</label>
        <select v-model="form.categoryCode" class="select">
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
        <input v-model="form.title" class="input" maxlength="60" />
      </div>

      <div class="field">
        <label class="label">상세 내용</label>
        <textarea v-model="form.content" class="textarea" />
      </div>

      <div class="field">
        <label class="label">사진</label>
        <label
          class="card"
          style="display: grid; place-items: center; color: var(--text-3); font-size: 13px; cursor: pointer; padding: 18px"
        >
          ＋ 사진 추가
          <input type="file" accept="image/*" multiple hidden @change="onPhoto" />
        </label>
        <div v-if="form.photos.length" class="chips" style="margin-top: 8px">
          <span v-for="(p, i) in form.photos" :key="i" class="chip">{{ p }}</span>
        </div>
      </div>

      <p v-if="error" class="notice error" style="margin-top: 12px">{{ error }}</p>

      <button class="btn" style="margin-top: 16px" :disabled="!valid || saving" @click="save">
        {{ saving ? '저장 중…' : '수정 완료' }}
      </button>
    </template>
  </main>
</template>
