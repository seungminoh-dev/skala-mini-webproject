<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import AppDialog from '@/components/AppDialog.vue'
import { assignComplaint, getComplaint, listWorkers, revokeAssignment, updateClassification } from '@/mock/api'
import { CATEGORIES, FLOORS, PRIORITIES, SPACES, categoryName } from '@/mock/constants'
import { actionLabel, formatDateTime } from '@/utils/format'
import { auth } from '@/stores/auth'
import { devModal } from '@/utils/devModal'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const c = ref(null); const loading = ref(true); const busy = ref(false); const error = ref(''); const saved = ref('')
const cls = ref({ floor: '', space: '', categoryCode: '', priority: '' })
const pick = ref(false); const workers = ref([]); const chosen = ref('')

onMounted(load)
async function load() {
  loading.value = true
  try {
    const x = await getComplaint(id); c.value = x
    cls.value = { floor: x.floor, space: x.space, categoryCode: x.categoryCode, priority: x.priority }
  } catch (e) { error.value = e.message } finally { loading.value = false }
  if (devModal('assign')) await openPick()
}
async function saveCls() {
  busy.value = true; error.value = ''; saved.value = ''
  try { c.value = await updateClassification(id, cls.value, auth.state.user.name); saved.value = '고쳤습니다.' }
  catch (e) { error.value = e.message } finally { busy.value = false }
}
async function openPick() { workers.value = await listWorkers(); chosen.value = ''; pick.value = true }
async function doAssign() {
  if (!chosen.value) return
  busy.value = true
  try { await assignComplaint(id, chosen.value, auth.state.user.name); pick.value = false; await load() }
  catch (e) { error.value = e.message } finally { busy.value = false }
}
async function doRevoke() {
  busy.value = true
  try { await revokeAssignment(id, auth.state.user.name); await load() }
  catch (e) { error.value = e.message } finally { busy.value = false }
}
</script>

<template>
  <StaffShell title="민원 상세" sub="담당자를 정하거나, 잘못 들어온 정보를 바로잡습니다">
    <template #actions>
      <template v-if="c && ['RECEIVED', 'IN_PROGRESS'].includes(c.status)">
        <button class="btn warn-line" @click="router.push({ name: 'admin-reject', params: { id } })">반려</button>
        <button v-if="c.status === 'IN_PROGRESS'" class="btn line" :disabled="busy" @click="doRevoke">담당 해제</button>
        <button class="btn" :disabled="busy" @click="openPick">
          {{ c.status === 'RECEIVED' ? '담당자 지정' : '담당자 변경' }}
        </button>
      </template>
    </template>

    <div class="page">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <template v-else-if="c">
        <div style="display: flex; align-items: center; gap: 12px">
          <StatusMark :status="c.status" :late="c.delayed" />
          <span class="mono hint">{{ c.id }}</span>
        </div>
        <h2 style="font-size: 23px; font-weight: 700; color: var(--ink); margin: 10px 0 20px; letter-spacing: -0.02em">{{ c.title }}</h2>

        <div class="defs">
          <div><dt>위치</dt><dd>{{ c.floor }} · {{ c.space }}</dd></div>
          <div><dt>설비</dt><dd>{{ categoryName(c.categoryCode) }}</dd></div>
          <div><dt>담당 기사</dt><dd>{{ c.assigneeName ?? '없음' }}</dd></div>
          <div><dt>접수</dt><dd class="mono">{{ c.elapsed }}</dd></div>
        </div>

        <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 40px; margin-top: 32px; align-items: start">
          <section>
            <p class="sect">신고 내용</p>
            <p style="font-size: 14.5px; line-height: 1.75; white-space: pre-wrap">{{ c.content }}</p>

            <p class="sect" style="margin-top: 30px">요청 정보 바로잡기</p>
            <p class="hint" style="margin-bottom: 12px">
              신고자가 잘못 고른 위치·설비·긴급도를 고칠 수 있습니다.
              <strong style="color: var(--ink)">신고 내용 자체는 고치지 않습니다</strong> — 신고자가 적은 말은 그대로 둡니다.
            </p>
            <div style="max-width: 460px">
              <div class="row2" style="margin-bottom: 8px">
                <select v-model="cls.floor" class="select"><option v-for="f in FLOORS" :key="f" :value="f">{{ f }}</option></select>
                <select v-model="cls.space" class="select"><option v-for="s in SPACES" :key="s" :value="s">{{ s }}</option></select>
              </div>
              <select v-model="cls.categoryCode" class="select" style="margin-bottom: 8px">
                <option v-for="x in CATEGORIES" :key="x.code" :value="x.code">{{ x.name }}</option>
              </select>
              <div class="filters" style="margin-bottom: 12px">
                <button v-for="p in PRIORITIES" :key="p.code" class="ftog" :class="{ on: cls.priority === p.code }"
                  @click="cls.priority = p.code">{{ p.name }}</button>
              </div>
              <button class="btn line" :disabled="busy" @click="saveCls">바로잡기</button>
              <p v-if="saved" class="hint" style="color: var(--blue); margin-top: 8px">{{ saved }}</p>
            </div>

            <p v-if="error" class="note warn" style="margin-top: 16px">{{ error }}</p>
          </section>

          <section>
            <p class="sect">처리 이력</p>
            <div class="timeline">
              <div v-for="(h, i) in c.history" :key="i" class="ev">
                <div class="act">{{ actionLabel(h.action) }}</div>
                <div class="at">{{ formatDateTime(h.at) }} · {{ h.actorName }}{{ h.note ? ` · ${h.note}` : '' }}</div>
              </div>
            </div>
          </section>
        </div>
      </template>
    </div>

    <AppDialog v-if="pick" title="담당자 지정" message="지금 맡고 있는 작업 수를 보고 고르세요." @close="pick = false">
      <template #body>
        <div class="tbl-wrap">
          <table class="tbl">
            <tbody>
              <tr v-for="w in workers" :key="w.id" :class="{ sel: chosen === w.id }" style="cursor: pointer" @click="chosen = w.id">
                <td>
                  <div class="title">{{ w.name }}</div>
                  <div class="num">{{ w.categories.length > 3 ? '전 설비' : w.categories.map(categoryName).join(', ') }}</div>
                </td>
                <td class="right mono" style="width: 60px; font-weight: 700; color: var(--ink)">{{ w.holding }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <template #actions>
        <button class="btn line" @click="pick = false">닫기</button>
        <button class="btn" :disabled="!chosen || busy" @click="doAssign">지정하기</button>
      </template>
    </AppDialog>
  </StaffShell>
</template>
