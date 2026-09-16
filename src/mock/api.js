// 목 API. 각 함수 주석의 METHOD /path 는 6단계 OAS 명세로 그대로 옮길 엔드포인트다.
// 상태 전이 규칙(9.2), 선점 정책(9.3), 중복 처리(9.4)를 이 계층에서 강제한다.

import { db, persist, generateComplaintId, resetDb } from './db'
import { DELAY_THRESHOLD_MINUTES } from './constants'

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

const LATENCY = [180, 420]
const delay = () =>
  new Promise((r) => setTimeout(r, LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0])))

const clone = (v) => JSON.parse(JSON.stringify(v))
const nowIso = () => new Date().toISOString()
const minutesSince = (iso) => Math.floor((Date.now() - new Date(iso).getTime()) / 60000)

function find(id) {
  const c = db.complaints.find((x) => x.id === id)
  if (!c) throw new ApiError(404, 'COMPLAINT_NOT_FOUND', '해당 민원 번호를 찾을 수 없습니다.')
  return c
}

function userById(id) {
  return db.users.find((u) => u.id === id) ?? null
}

function pushHistory(c, actorType, actorName, action, note = null) {
  c.history.push({ at: nowIso(), actorType, actorName, action, note })
}

// P-02 지연 판정: 미배정 상태로 임계 시간을 초과한 건
export function isDelayed(c) {
  if (c.status !== 'RECEIVED') return false
  return minutesSince(c.createdAt) > DELAY_THRESHOLD_MINUTES[c.priority]
}

export function elapsedLabel(iso) {
  const m = minutesSince(iso)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 ${m % 60}분 전`
  const d = Math.floor(h / 24)
  return d === 1 ? '어제' : `${d}일 전`
}

function decorate(c) {
  const assignee = c.assigneeId ? userById(c.assigneeId) : null
  return {
    ...clone(c),
    password: undefined, // 비밀번호는 응답에 포함하지 않는다
    assigneeName: assignee?.name ?? null,
    delayed: isDelayed(c),
    elapsed: elapsedLabel(c.createdAt)
  }
}

/* ── USER (비인증) ─────────────────────────────────────────── */

// POST /complaints — FR-101
export async function registerComplaint(payload) {
  await delay()
  const required = ['title', 'content', 'floor', 'space', 'categoryCode', 'priority', 'password']
  for (const k of required) {
    if (!payload[k]) throw new ApiError(400, 'INVALID_PAYLOAD', '필수 입력값이 비어 있습니다.')
  }
  if (!/^\d{4}$/.test(payload.password)) {
    throw new ApiError(400, 'INVALID_PASSWORD_FORMAT', '비밀번호는 숫자 4자리여야 합니다.')
  }
  const complaint = {
    id: generateComplaintId(),
    title: payload.title,
    content: payload.content,
    floor: payload.floor,
    space: payload.space,
    categoryCode: payload.categoryCode,
    priority: payload.priority,
    status: 'RECEIVED',
    password: payload.password,
    photos: payload.photos ?? [],
    assigneeId: null,
    createdAt: nowIso(),
    assignedAt: null,
    completedAt: null,
    resolution: null,
    reject: null,
    history: []
  }
  pushHistory(complaint, 'USER', '신고자', 'REGISTER')
  db.complaints.unshift(complaint)
  persist()
  return decorate(complaint)
}

// GET /complaints/{id} — FR-102 (열람 공개: 비밀번호 불필요)
export async function getComplaint(id) {
  await delay()
  const c = find(id)
  const original = c.reject?.originalComplaintId
    ? db.complaints.find((x) => x.id === c.reject.originalComplaintId)
    : null
  return {
    ...decorate(c),
    originalComplaint: original ? { id: original.id, title: original.title, status: original.status } : null
  }
}

// POST /complaints/{id}/password-verification — 수정·취소 진입 전 본인 확인
export async function verifyPassword(id, password) {
  await delay()
  const c = find(id)
  if (c.password !== password) {
    throw new ApiError(401, 'PASSWORD_MISMATCH', '비밀번호가 일치하지 않습니다.')
  }
  if (c.status !== 'RECEIVED') {
    throw new ApiError(409, 'NOT_EDITABLE', '이미 배정되어 수정·취소할 수 없습니다.')
  }
  return { ok: true }
}

// PATCH /complaints/{id} — FR-103 (신고자 원문 수정, RECEIVED 상태만)
export async function updateComplaint(id, password, patch) {
  await delay()
  const c = find(id)
  if (c.password !== password) throw new ApiError(401, 'PASSWORD_MISMATCH', '비밀번호가 일치하지 않습니다.')
  if (c.status !== 'RECEIVED') throw new ApiError(409, 'NOT_EDITABLE', '이미 배정되어 수정할 수 없습니다.')
  const fields = ['title', 'content', 'floor', 'space', 'categoryCode', 'priority', 'photos']
  fields.forEach((f) => {
    if (patch[f] !== undefined) c[f] = patch[f]
  })
  pushHistory(c, 'USER', '신고자', 'UPDATE')
  persist()
  return decorate(c)
}

// POST /complaints/{id}/cancel — FR-104 (취소. 이력 보존을 위해 CANCELED 상태로 전환)
export async function cancelComplaint(id, password) {
  await delay()
  const c = find(id)
  if (c.password !== password) throw new ApiError(401, 'PASSWORD_MISMATCH', '비밀번호가 일치하지 않습니다.')
  if (c.status !== 'RECEIVED') throw new ApiError(409, 'NOT_CANCELABLE', '이미 배정되어 취소할 수 없습니다.')
  c.status = 'CANCELED'
  pushHistory(c, 'USER', '신고자', 'CANCEL')
  persist()
  return decorate(c)
}

/* ── 인증 (ADMIN / WORKER) ─────────────────────────────────── */

// POST /auth/login — FR-001
export async function login(employeeNo, password) {
  await delay()
  const u = db.users.find((x) => x.employeeNo === employeeNo && x.password === password)
  if (!u) throw new ApiError(401, 'LOGIN_FAILED', '사번 또는 비밀번호가 올바르지 않습니다.')
  return { id: u.id, name: u.name, role: u.role, categories: clone(u.categories) }
}

/* ── WORKER ────────────────────────────────────────────────── */

// GET /complaints?status=RECEIVED — FR-201
export async function listUnassigned({ categoryCode = null } = {}) {
  await delay()
  return db.complaints
    .filter((c) => c.status === 'RECEIVED')
    .filter((c) => !categoryCode || c.categoryCode === categoryCode)
    .map(decorate)
    .sort((a, b) => {
      const w = { URGENT: 0, NORMAL: 1, LOW: 2 }
      if (w[a.priority] !== w[b.priority]) return w[a.priority] - w[b.priority]
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
}

// GET /complaints/{id} + GET /complaints/{id}/related — FR-206
// 동일 위치·카테고리의 진행 중 민원을 함께 반환한다 (AS-04 사후 정리 근거).
export async function getWorkerComplaint(id) {
  await delay()
  const c = find(id)
  const related = db.complaints
    .filter(
      (x) =>
        x.id !== c.id &&
        x.floor === c.floor &&
        x.space === c.space &&
        x.categoryCode === c.categoryCode &&
        ['RECEIVED', 'IN_PROGRESS'].includes(x.status)
    )
    .map(decorate)
  return { ...decorate(c), relatedActive: related }
}

// POST /complaints/{id}/claim — FR-202
// 선점 경합 시 409. P-01에 따라 담당 외 카테고리도 선점 자체는 허용한다.
export async function claimComplaint(id, workerId) {
  await delay()
  const c = find(id)
  if (c.status !== 'RECEIVED') {
    throw new ApiError(409, 'ALREADY_CLAIMED', '이미 다른 작업자가 선점한 민원입니다.')
  }
  const w = userById(workerId)
  c.status = 'IN_PROGRESS'
  c.assigneeId = workerId
  c.assignedAt = nowIso()
  const offCategory = w && w.categories.length > 0 && !w.categories.includes(c.categoryCode)
  pushHistory(c, 'WORKER', w?.name ?? workerId, 'CLAIM', offCategory ? '담당 외 설비' : null)
  persist()
  return decorate(c)
}

// POST /complaints/{id}/release — FR-203
export async function releaseComplaint(id, workerId) {
  await delay()
  const c = find(id)
  if (c.status !== 'IN_PROGRESS' || c.assigneeId !== workerId) {
    throw new ApiError(409, 'NOT_ASSIGNEE', '본인이 담당 중인 민원이 아닙니다.')
  }
  const w = userById(workerId)
  c.status = 'RECEIVED'
  c.assigneeId = null
  c.assignedAt = null
  pushHistory(c, 'WORKER', w?.name ?? workerId, 'RELEASE')
  persist()
  return decorate(c)
}

// GET /complaints?assignee=me — FR-204
export async function listMyTasks(workerId, status = 'IN_PROGRESS') {
  await delay()
  return db.complaints
    .filter((c) => c.assigneeId === workerId && c.status === status)
    .map(decorate)
    .sort((a, b) => new Date(b.assignedAt ?? b.createdAt) - new Date(a.assignedAt ?? a.createdAt))
}

// POST /complaints/{id}/completion — FR-205
export async function completeComplaint(id, workerId, resolution) {
  await delay()
  const c = find(id)
  if (c.status !== 'IN_PROGRESS' || c.assigneeId !== workerId) {
    throw new ApiError(409, 'NOT_ASSIGNEE', '본인이 담당 중인 민원이 아닙니다.')
  }
  if (!resolution?.content) {
    throw new ApiError(400, 'RESOLUTION_REQUIRED', '조치 내용을 입력해야 합니다.')
  }
  const w = userById(workerId)
  c.status = 'COMPLETED'
  c.completedAt = nowIso()
  c.resolution = {
    content: resolution.content,
    photos: resolution.photos ?? [],
    durationMinutes: Number(resolution.durationMinutes) || 0
  }
  pushHistory(c, 'WORKER', w?.name ?? workerId, 'COMPLETE')
  persist()
  return decorate(c)
}

/* ── ADMIN ─────────────────────────────────────────────────── */

// GET /dashboard — FR-301, FR-302, FR-303
export async function getDashboard() {
  await delay()
  const received = db.complaints.filter((c) => c.status === 'RECEIVED')
  const inProgress = db.complaints.filter((c) => c.status === 'IN_PROGRESS')
  const todayDone = db.complaints.filter(
    (c) => c.status === 'COMPLETED' && c.completedAt && minutesSince(c.completedAt) < 1440
  )
  const delayed = received.filter(isDelayed)
  const workers = db.users
    .filter((u) => u.role === 'WORKER')
    .map((u) => ({
      id: u.id,
      name: u.name,
      categories: clone(u.categories),
      // '진행/대기' 구분은 두지 않는다 — 상태 모델에 ASSIGNED가 없으므로 보유 건수만 제공한다.
      holding: inProgress.filter((c) => c.assigneeId === u.id).length
    }))
    .sort((a, b) => a.holding - b.holding)
  return {
    counts: {
      received: received.length,
      inProgress: inProgress.length,
      delayed: delayed.length,
      completedToday: todayDone.length
    },
    delayed: delayed.map(decorate),
    workers
  }
}

// GET /complaints — FR-301
export async function listComplaints(filters = {}) {
  await delay()
  const { status, categoryCode, floor, priority, delayedOnly, keyword } = filters
  return db.complaints
    .filter((c) => !status || c.status === status)
    .filter((c) => !categoryCode || c.categoryCode === categoryCode)
    .filter((c) => !floor || c.floor === floor)
    .filter((c) => !priority || c.priority === priority)
    .filter((c) => !delayedOnly || isDelayed(c))
    .filter((c) => !keyword || c.title.includes(keyword) || c.id.includes(keyword.toUpperCase()))
    .map(decorate)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// GET /workers — FR-303 (강제 배정 대상 선택용)
export async function listWorkers() {
  await delay()
  const inProgress = db.complaints.filter((c) => c.status === 'IN_PROGRESS')
  return db.users
    .filter((u) => u.role === 'WORKER')
    .map((u) => ({
      id: u.id,
      name: u.name,
      categories: clone(u.categories),
      holding: inProgress.filter((c) => c.assigneeId === u.id).length
    }))
}

// POST /complaints/{id}/assignment — FR-304(강제 배정) / FR-305(재배정)
export async function assignComplaint(id, workerId, adminName) {
  await delay()
  const c = find(id)
  if (!['RECEIVED', 'IN_PROGRESS'].includes(c.status)) {
    throw new ApiError(409, 'INVALID_STATE', '배정할 수 없는 상태입니다.')
  }
  const w = userById(workerId)
  if (!w) throw new ApiError(404, 'WORKER_NOT_FOUND', '작업자를 찾을 수 없습니다.')
  const reassign = c.status === 'IN_PROGRESS'
  c.status = 'IN_PROGRESS'
  c.assigneeId = workerId
  c.assignedAt = nowIso()
  pushHistory(c, 'ADMIN', adminName, reassign ? 'REASSIGN' : 'ASSIGN', `${w.name}에게 배정`)
  persist()
  return decorate(c)
}

// DELETE /complaints/{id}/assignment — FR-306
export async function revokeAssignment(id, adminName) {
  await delay()
  const c = find(id)
  if (c.status !== 'IN_PROGRESS') {
    throw new ApiError(409, 'INVALID_STATE', '배정된 민원이 아닙니다.')
  }
  c.status = 'RECEIVED'
  c.assigneeId = null
  c.assignedAt = null
  pushHistory(c, 'ADMIN', adminName, 'REVOKE')
  persist()
  return decorate(c)
}

// PATCH /complaints/{id}/classification — FR-307
// 분류 정보만 수정한다. 신고 원문(제목·내용·사진)은 대상이 아니다.
export async function updateClassification(id, patch, adminName) {
  await delay()
  const c = find(id)
  const allowed = ['floor', 'space', 'categoryCode', 'priority']
  const changed = []
  allowed.forEach((f) => {
    if (patch[f] !== undefined && patch[f] !== c[f]) {
      changed.push(f)
      c[f] = patch[f]
    }
  })
  if (changed.length === 0) return decorate(c)
  pushHistory(c, 'ADMIN', adminName, 'UPDATE_CLASSIFICATION', changed.join(', '))
  persist()
  return decorate(c)
}

// POST /complaints/{id}/rejection — FR-308
export async function rejectComplaint(id, payload, adminName) {
  await delay()
  const c = find(id)
  if (!['RECEIVED', 'IN_PROGRESS'].includes(c.status)) {
    throw new ApiError(409, 'INVALID_STATE', '반려할 수 없는 상태입니다.')
  }
  if (!payload.reason) throw new ApiError(400, 'REASON_REQUIRED', '반려 사유를 입력해야 합니다.')
  if (payload.reasonType === 'DUPLICATE' && !payload.originalComplaintId) {
    throw new ApiError(400, 'ORIGINAL_REQUIRED', '중복 반려는 원본 민원을 연결해야 합니다.')
  }
  if (payload.originalComplaintId) {
    if (payload.originalComplaintId === c.id) {
      throw new ApiError(400, 'INVALID_ORIGINAL', '자기 자신을 원본으로 연결할 수 없습니다.')
    }
    find(payload.originalComplaintId)
  }
  c.status = 'REJECTED'
  c.assigneeId = null
  c.reject = {
    reasonType: payload.reasonType,
    reason: payload.reason,
    originalComplaintId: payload.originalComplaintId ?? null,
    at: nowIso()
  }
  pushHistory(c, 'ADMIN', adminName, 'REJECT', payload.originalComplaintId ? `원본 ${payload.originalComplaintId}` : null)
  persist()
  return decorate(c)
}

// GET /statistics — FR-309
export async function getStats({ from = null, to = null } = {}) {
  await delay()
  const inRange = (c) => {
    const t = new Date(c.createdAt).getTime()
    if (from && t < new Date(from).getTime()) return false
    if (to && t > new Date(to).getTime() + 86400000) return false
    return true
  }
  const target = db.complaints.filter(inRange)
  const completed = target.filter((c) => c.status === 'COMPLETED')
  const rejected = target.filter((c) => c.status === 'REJECTED')
  const avgMinutes = completed.length
    ? Math.round(
        completed.reduce(
          (sum, c) => sum + (new Date(c.completedAt) - new Date(c.createdAt)) / 60000,
          0
        ) / completed.length
      )
    : 0
  const byKey = (keyFn) => {
    const map = new Map()
    target.forEach((c) => {
      const k = keyFn(c)
      map.set(k, (map.get(k) ?? 0) + 1)
    })
    return [...map.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
  }
  return {
    total: target.length,
    completed: completed.length,
    avgMinutes,
    rejectRate: target.length ? Math.round((rejected.length / target.length) * 1000) / 10 : 0,
    byCategory: byKey((c) => c.categoryCode),
    byFloor: byKey((c) => c.floor)
  }
}

export { resetDb }
