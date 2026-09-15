// 도메인 상수 — 기술서 1.1 / 9.x 정책과 1:1로 대응한다.

export const CATEGORIES = [
  { code: 'ELEC', name: '전기·조명' },
  { code: 'WATER', name: '급배수·위생' },
  { code: 'HVAC', name: '공조' },
  { code: 'ELEV', name: '승강기' },
  { code: 'SEC', name: '출입·보안' },
  { code: 'FURN', name: '집기·비품' }
]

export const FLOORS = Array.from({ length: 8 }, (_, i) => `${i + 1}층`)

export const SPACES = ['사무구역', '화장실', '탕비실', '회의실', '복도', '기계실', '로비', '주차장']

export const PRIORITIES = [
  { code: 'URGENT', name: '긴급' },
  { code: 'NORMAL', name: '보통' },
  { code: 'LOW', name: '낮음' }
]

export const STATUSES = [
  { code: 'RECEIVED', name: '접수됨' },
  { code: 'IN_PROGRESS', name: '처리중' },
  { code: 'COMPLETED', name: '처리완료' },
  { code: 'REJECTED', name: '반려' },
  { code: 'CANCELED', name: '취소됨' }
]

// P-02 지연 판정 임계값 (분)
export const DELAY_THRESHOLD_MINUTES = {
  URGENT: 60,
  NORMAL: 360,
  LOW: 1440
}

export const REJECT_REASONS = [
  { code: 'DUPLICATE', name: '중복 민원' },
  { code: 'OUT_OF_SCOPE', name: '관리 대상 외' },
  { code: 'INVALID', name: '내용 확인 불가' }
]

export const categoryName = (code) => CATEGORIES.find((c) => c.code === code)?.name ?? code
export const priorityName = (code) => PRIORITIES.find((p) => p.code === code)?.name ?? code
export const statusName = (code) => STATUSES.find((s) => s.code === code)?.name ?? code
export const rejectReasonName = (code) => REJECT_REASONS.find((r) => r.code === code)?.name ?? code
