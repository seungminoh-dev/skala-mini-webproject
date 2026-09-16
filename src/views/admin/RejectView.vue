<script setup>
// A-05 민원 반려 — 원문과 같은 위치의 민원을 보면서 사유를 남긴다 (ADMIN 개편 기획 6.4)
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import StaffShell from '@/components/StaffShell.vue'
import StatusMark from '@/components/StatusMark.vue'
import AppDialog from '@/components/AppDialog.vue'
import { getAdminComplaint, listComplaints, rejectComplaint } from '@/mock/api'
import { REJECT_REASONS, categoryName } from '@/mock/constants'
import { TERMS } from '@/utils/labels'
import { auth } from '@/stores/auth'

const route = useRoute(); const router = useRouter()
const id = route.params.id
const c = ref(null); const loading = ref(true)
const reasonType = ref('DUPLICATE'); const reason = ref('')
const keyword = ref(''); const found = ref([]); const searched = ref(false)
const original = ref(null)
const busy = ref(false); const error = ref(''); const submitted = ref(false); const done = ref(false)

const listQuery = computed(() => {
  const q = { ...route.query }
  delete q.capture; delete q.devrole
  return q
})
const backTo = computed(() => ({ name: 'admin-complaint', params: { id }, query: listQuery.value }))

onMounted(async () => {
  try { c.value = await getAdminComplaint(id) } finally { loading.value = false }
})

const needOriginal = computed(() => reasonType.value === 'DUPLICATE')
watch(reasonType, (v) => { if (v !== 'DUPLICATE') original.value = null })

// 기본 후보는 같은 층·공간·설비의 미종료 민원이다. 검색은 그 다음 수단 (AX-23).
const nearby = computed(() => c.value?.relatedActive ?? [])
async function search() {
  const list = await listComplaints({ keyword: keyword.value.trim() || null })
  found.value = list.filter((x) => x.id !== id && ['RECEIVED', 'IN_PROGRESS', 'COMPLETED'].includes(x.status))
  searched.value = true
}

const errReason = computed(() => submitted.value && !reason.value.trim())
const errOriginal = computed(() => submitted.value && needOriginal.value && !original.value)

async function submit() {
  submitted.value = true
  if (errReason.value || errOriginal.value || busy.value) return
  busy.value = true; error.value = ''
  try {
    await rejectComplaint(
      id,
      { reasonType: reasonType.value, reason: reason.value, originalComplaintId: original.value?.id ?? null },
      auth.state.user.name
    )
    done.value = true
    router.replace({ name: 'admin-complaint', params: { id }, query: { ...listQuery.value, done: 'rejected' } })
  } catch (e) { error.value = e.message } finally { busy.value = false }
}

// 작성 중 이탈 확인 — 아무것도 입력하지 않았다면 그냥 나간다
const dirty = computed(() => !done.value && (reason.value.trim() || original.value))
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
  <StaffShell title="민원 반려">
    <template #sub>
      <span v-if="c" style="display: inline-flex; align-items: center; gap: 9px; flex-wrap: wrap">
        <StatusMark :status="c.status" :late="c.delayed" />
        <strong style="color: var(--ink); font-size: 13.5px">{{ c.title }}</strong>
        <span>{{ c.floor }} {{ c.space }} · {{ categoryName(c.categoryCode) }}</span>
        <span class="mono">{{ c.id }}</span>
      </span>
    </template>

    <div class="page page-narrow">
      <p v-if="loading" class="empty">불러오는 중…</p>

      <template v-else-if="c">
        <router-link :to="backTo" class="backlink">← 민원 상세</router-link>

        <!-- 근거를 왼쪽에 두고 오른쪽에서 결정한다 (AX-22) -->
        <div class="wcols wcols-r" style="margin-top: 18px">
          <aside>
            <div class="aside-box">
              <div class="ak">신고 내용</div>
              <div class="av">{{ c.content }}</div>
            </div>
            <div class="aside-box">
              <div class="ak">첨부 사진</div>
              <div v-if="c.photos?.length" class="filelist">
                <div v-for="(p, i) in c.photos" :key="i" class="f"><span class="mono">{{ p.fileUrl ?? p }}</span></div>
              </div>
              <div v-else class="av">첨부 사진 없음</div>
            </div>
            <div v-if="nearby.length" class="aside-box">
              <div class="ak">같은 위치에서 진행 중인 민원</div>
              <div v-for="r in nearby" :key="r.id" style="margin-top: 10px">
                <StatusMark :status="r.status" :late="r.delayed" />
                <div class="title" style="margin-top: 3px; font-size: 13.5px">{{ r.title }}</div>
                <div class="num" style="font-family: var(--mono); font-size: 12px; color: var(--muted)">
                  {{ r.id }}<template v-if="r.assigneeName"> · {{ r.assigneeName }}</template>
                </div>
              </div>
            </div>
          </aside>

          <section>
            <div class="field">
              <p class="label req">{{ TERMS.rejectReason }}</p>
              <div class="filters">
                <button v-for="r in REJECT_REASONS" :key="r.code" type="button" class="ftog"
                  :class="{ on: reasonType === r.code }" @click="reasonType = r.code">{{ r.name }}</button>
              </div>
            </div>

            <div class="field">
              <label class="label req" for="rj-reason">신고자에게 보일 설명</label>
              <textarea id="rj-reason" v-model="reason" class="textarea" :class="{ invalid: errReason }"
                placeholder="예) 같은 자리 누수가 이미 접수되어 처리 중입니다." />
              <p v-if="errReason" class="ferr">설명을 입력해 주세요.</p>
            </div>

            <div v-if="needOriginal" class="field">
              <p class="label req">{{ TERMS.originalComplaint }}</p>
              <p class="hint" style="margin: -2px 0 8px">신고자는 원본 민원에서 진행 상황을 봅니다.</p>

              <div v-if="original" class="tbl-wrap">
                <table class="tbl">
                  <tbody>
                    <tr class="sel">
                      <td style="width: 104px"><StatusMark :status="original.status" /></td>
                      <td><div class="title">{{ original.title }}</div><div class="num">{{ original.id }}</div></td>
                      <td class="right" style="width: 78px">
                        <button class="btn line sm nowrap" @click="original = null">해제</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <template v-else>
                <div v-if="nearby.length" class="tbl-wrap">
                  <table class="tbl">
                    <tbody>
                      <tr v-for="x in nearby" :key="x.id" style="cursor: pointer" @click="original = x">
                        <td style="width: 104px"><StatusMark :status="x.status" :late="x.delayed" /></td>
                        <td>
                          <div class="title">{{ x.title }}</div>
                          <div class="num">{{ x.id }}<template v-if="x.assigneeName"> · {{ x.assigneeName }}</template></div>
                        </td>
                        <td class="right" style="width: 78px"><span class="btn line sm nowrap">선택</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p v-else class="hint">같은 위치에서 진행 중인 민원이 없습니다. 아래에서 찾아 주세요.</p>

                <p class="label" style="margin-top: 16px">다른 민원 찾기</p>
                <div class="lookup-row" style="max-width: 420px">
                  <input v-model="keyword" class="input" placeholder="제목 또는 민원 번호" @keyup.enter="search" />
                  <button class="btn line nowrap" @click="search">검색</button>
                </div>
                <p v-if="searched && !found.length" class="hint" style="margin-top: 8px">검색 결과가 없습니다.</p>
                <div v-else-if="found.length" class="tbl-wrap" style="margin-top: 10px">
                  <table class="tbl">
                    <tbody>
                      <tr v-for="x in found.slice(0, 6)" :key="x.id" style="cursor: pointer" @click="original = x">
                        <td style="width: 104px"><StatusMark :status="x.status" :late="x.delayed" /></td>
                        <td>
                          <div class="title">{{ x.title }}</div>
                          <div class="num">{{ x.id }} · {{ categoryName(x.categoryCode) }}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>

              <p v-if="errOriginal" class="ferr">원본 민원을 선택해 주세요.</p>
            </div>

            <p v-if="error" class="note warn" style="margin-top: 16px">{{ error }}</p>

            <!-- 주 행동은 폼 하단. 비어 있어도 눌러 볼 수 있고 이유는 항목 아래에 뜬다 -->
            <div class="formfoot">
              <button class="btn warn" :disabled="busy" @click="submit">{{ busy ? '처리 중…' : TERMS.reject }}</button>
              <router-link :to="backTo" class="btn line" style="display: inline-block">그만두기</router-link>
              <span class="hint">반려하면 신고자에게 사유가 그대로 보입니다.</span>
            </div>
          </section>
        </div>
      </template>
    </div>

    <AppDialog v-if="leaveTo" title="반려를 그만둘까요?"
      message="작성 중인 사유가 사라집니다." @close="stayHere">
      <template #actions>
        <button class="btn line" data-autofocus @click="stayHere">계속 작성</button>
        <button class="btn warn" @click="leaveAnyway">나가기</button>
      </template>
    </AppDialog>
  </StaffShell>
</template>
