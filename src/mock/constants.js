// 도메인 상수 — 기술서 1.1 / 9.x 정책과 1:1로 대응한다.

// desc: 신고자 화면에서만 붙이는 풀이말 — "공조?"처럼 용어를 모르는 사용자를 위한 것.
export const CATEGORIES = [
  { code: 'ELEC', name: '전기·조명', desc: '전등·콘센트·스위치' },
  { code: 'WATER', name: '급배수·위생', desc: '세면대·변기·싱크대·누수' },
  { code: 'HVAC', name: '공조', desc: '냉난방·환기' },
  { code: 'ELEV', name: '승강기', desc: '엘리베이터' },
  { code: 'SEC', name: '출입·보안', desc: '출입문·카드 인식' },
  { code: 'FURN', name: '집기·비품', desc: '책상·의자·정수기 등' },
  { code: 'ETC', name: '기타·모름', desc: '어디 문제인지 모르겠어요' }
]

// 지하 2층(주차장·기계실) ~ 지상 8층. floor_no 는 지하를 음수로 둔다.
export const FLOORS = ['지하 2층', '지하 1층', ...Array.from({ length: 8 }, (_, i) => `${i + 1}층`)]

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

// 처리 결과의 정형 조치. 탭 한 번으로 필수 항목을 채우기 위한 목록이다 (P-H).
// 자유 서술(메모)은 선택이며, 저장 시 `선택지 — 메모` 로 합쳐 resolution.content 에 들어간다.
export const RESOLUTION_ACTIONS = [
  '부품 교체',
  '조정·재설정',
  '청소·이물 제거',
  '확인 결과 이상 없음',
  '임시 조치 · 후속 필요'
]

// 분류 정보 항목의 표시 이름. 이력 note 에 내부 필드명을 남기지 않는다 (AX-18).
export const CLASSIFICATION_FIELDS = {
  floor: '층',
  space: '공간',
  categoryCode: '설비',
  priority: '긴급도'
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
