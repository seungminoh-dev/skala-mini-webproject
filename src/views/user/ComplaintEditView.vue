<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PubShell from '@/components/PubShell.vue'
import { CATEGORIES, FLOORS, PRIORITIES, SPACES } from '@/mock/constants'
import { getComplaint, updateComplaint } from '@/mock/api'
import { verifyStore } from '@/stores/verify'
import { devModal } from '@/utils/devModal'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const password = verifyStore.get(id) ?? (devModal('edit') ? '2222' : null)
const form = ref(null); const loading = ref(true); const saving = ref(false); const error = ref('')

onMounted(async () => {
  if (!password) { router.replace({ name: 'complaint', params: { id } }); return }
  try {
    const c = await getComplaint(id)
    form.value = { title: c.title, content: c.content, floor: c.floor, space: c.space,
      categoryCode: c.categoryCode, priority: c.priority, photos: [...(c.photos ?? [])] }
  } catch (e) { error.value = e.message } finally { loading.value = false }
})
const valid = computed(() => { const f = form.value; return f && f.floor && f.space && f.categoryCode && f.title.trim() && f.content.trim() })
async function save() {
  if (!valid.value || saving.value) return
  saving.value = true; error.value = ''
  try { await updateComplaint(id, password, form.value); verifyStore.clear(id); router.replace({ name: 'complaint', params: { id } }) }
  catch (e) { error.value = e.message } finally { saving.value = false }
}
</script>

<template>
  <PubShell narrow>
    <p v-if="loading" class="empty">불러오는 중…</p>
    <template v-else-if="form">
      <div style="padding: 44px 0 24px; border-bottom: 1px solid var(--line-2)">
        <p class="eyebrow">본인 확인 완료</p>
        <h1 class="display" style="font-size: 28px; margin-top: 10px">민원 수정</h1>
        <p class="lede" style="font-size: 13.5px; margin-top: 8px">
          <span class="mono">{{ id }}</span> · 담당 기사가 배정되기 전까지만 고칠 수 있습니다.
        </p>
      </div>

      <div style="padding: 24px 0 0">
        <div class="field">
          <label class="label">위치</label>
          <div class="row2">
            <select v-model="form.floor" class="select"><option v-for="f in FLOORS" :key="f" :value="f">{{ f }}</option></select>
            <select v-model="form.space" class="select"><option v-for="s in SPACES" :key="s" :value="s">{{ s }}</option></select>
          </div>
        </div>
        <div class="field">
          <label class="label">설비</label>
          <select v-model="form.categoryCode" class="select">
            <option v-for="c in CATEGORIES" :key="c.code" :value="c.code">{{ c.name }} ({{ c.desc }})</option>
          </select>
        </div>
        <div class="field">
          <label class="label">긴급도</label>
          <div class="filters">
            <button v-for="p in PRIORITIES" :key="p.code" class="ftog" :class="{ on: form.priority === p.code }"
              @click="form.priority = p.code">{{ p.name }}</button>
          </div>
        </div>
        <div class="field"><label class="label">한 줄 요약</label><input v-model="form.title" class="input" maxlength="60" /></div>
        <div class="field"><label class="label">자세한 증상</label><textarea v-model="form.content" class="textarea" /></div>

        <p v-if="error" class="note warn" style="margin-top: 18px">{{ error }}</p>
        <div style="margin-top: 26px; padding-top: 20px; border-top: 1px solid var(--line-2); display: flex; align-items: center; gap: 14px">
          <button class="btn lg" :disabled="!valid || saving" @click="save">{{ saving ? '저장 중…' : '수정 완료' }}</button>
          <router-link :to="{ name: 'complaint', params: { id } }" class="backlink">수정 취소하고 돌아가기</router-link>
        </div>
      </div>
    </template>
  </PubShell>
</template>
