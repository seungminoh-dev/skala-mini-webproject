<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import AppDialog from '@/components/AppDialog.vue'
import { claimComplaint, getWorkerComplaint, listWorkers } from '@/mock/api'
import { categoryName, priorityName } from '@/mock/constants'
import { actionLabel, formatDateTime } from '@/utils/format'
import { auth } from '@/stores/auth'
import { devModal } from '@/utils/devModal'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const c = ref(null); const loading = ref(true)
const warn = ref(false); const taken = ref(false); const busy = ref(false)
const owners = ref([])

// 담당 외 설비일 때 정책을 설명하는 대신, 그 설비를 맡고 있는 기사를 보여준다.
const ownerNames = computed(() => owners.value.map((w) => w.name).join(' · ') || '지정된 기사 없음')

const offCategory = computed(() => {
  const cats = auth.state.user?.categories ?? []
  return c.value && cats.length > 0 && !cats.includes(c.value.categoryCode)
})

onMounted(load)
async function load() {
  loading.value = true
  try {
    c.value = await getWorkerComplaint(id)
    const all = await listWorkers()
    owners.value = all.filter((w) => w.categories.includes(c.value.categoryCode) && w.id !== auth.state.user?.id)
  } finally { loading.value = false }
  if (devModal('offcat')) warn.value = true
  if (devModal('conflict')) taken.value = true
}
function onTake() { offCategory.value ? (warn.value = true) : doTake() }
async function doTake() {
  busy.value = true; warn.value = false
  try { await claimComplaint(id, auth.state.user.id); router.replace('/worker/tasks') }
  catch (e) { if (e.status === 409) taken.value = true } finally { busy.value = false }
}
</script>

<template>
  <StaffShell title="요청 상세" sub="현장에 가기 전에 같은 위치의 진행 중 작업을 함께 확인하세요">
    <template #actions>
      <button class="btn line" @click="router.push('/worker')">목록</button>
      <button v-if="c && c.status === 'RECEIVED'" class="btn" :disabled="busy" @click="onTake">
        {{ busy ? '처리 중…' : '이 작업 맡기' }}
      </button>
    </template>

    <div class="page">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <template v-else-if="c">
        <div style="display: flex; align-items: center; gap: 12px">
          <StatusMark :status="c.status" :late="c.delayed" />
          <span class="mono hint">{{ c.id }}</span>
        </div>
        <h2 style="font-size: 23px; font-weight: 700; color: var(--ink); margin: 10px 0 20px; letter-spacing: -0.02em">
          {{ c.title }}
        </h2>

        <div class="defs">
          <div><dt>위치</dt><dd>{{ c.floor }} · {{ c.space }}</dd></div>
          <div><dt>설비</dt><dd>{{ categoryName(c.categoryCode) }}</dd></div>
          <div><dt>긴급도</dt><dd :class="{ urgent: c.priority === 'URGENT' }">{{ priorityName(c.priority) }}</dd></div>
          <div><dt>접수</dt><dd class="mono">{{ c.elapsed }}</dd></div>
        </div>

        <div v-if="offCategory" class="note" style="margin-top: 18px">
          <b>{{ categoryName(c.categoryCode) }}</b>
          담당 {{ ownerNames }}. 내 담당 설비는 아니지만 맡을 수 있습니다.
        </div>

        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 40px; margin-top: 30px; align-items: start">
          <section>
            <p class="sect">신고 내용</p>
            <p style="font-size: 14.5px; line-height: 1.75; white-space: pre-wrap">{{ c.content }}</p>

            <template v-if="c.relatedActive?.length">
              <p class="sect" style="margin-top: 30px">같은 위치에서 진행 중인 작업</p>
              <div class="note warn" style="margin-bottom: 10px">
                같은 자리에 이미 작업이 잡혀 있습니다. 같은 건이면 관리소장에게 알려 정리하세요.
              </div>
              <div class="tbl-wrap">
                <table class="tbl">
                  <tbody>
                    <tr v-for="r in c.relatedActive" :key="r.id" style="cursor: pointer"
                      @click="router.push({ name: 'worker-complaint', params: { id: r.id } })">
                      <td style="width: 104px"><StatusMark :status="r.status" /></td>
                      <td><div class="title">{{ r.title }}</div><div class="num">{{ r.id }}</div></td>
                      <td class="right" style="width: 90px">{{ r.assigneeName ?? '담당자 없음' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </section>

          <section>
            <p class="sect">처리 이력</p>
            <div class="timeline">
              <div v-for="(h, i) in c.history" :key="i" class="ev">
                <div class="act">{{ actionLabel(h.action) }}</div>
                <div class="at">{{ formatDateTime(h.at) }} · {{ h.actorName }}</div>
              </div>
            </div>
          </section>
        </div>
      </template>
    </div>

    <AppDialog v-if="warn" :title="`${categoryName(c.categoryCode)} 설비 요청입니다`"
      :message="`담당 ${ownerNames}. 맡으면 이 작업은 내 작업 목록으로 들어옵니다.`" @close="warn = false">
      <template #actions>
        <button class="btn line" @click="warn = false">그만두기</button>
        <button class="btn" :disabled="busy" @click="doTake">맡기</button>
      </template>
    </AppDialog>

    <AppDialog v-if="taken" title="다른 기사가 먼저 맡았습니다"
      message="거의 동시에 같은 작업을 선택했습니다. 목록을 새로 불러옵니다." @close="router.replace('/worker')">
      <template #actions>
        <button class="btn" @click="router.replace('/worker')">목록으로</button>
      </template>
    </AppDialog>
  </StaffShell>
</template>
