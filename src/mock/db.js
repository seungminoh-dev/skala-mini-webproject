// 목 데이터 저장소. 실제 구현에서는 서버 DB가 담당하는 영역이다.
// localStorage에 유지되므로 새로고침해도 상태가 남는다. resetDb()로 초기화.

const STORAGE_KEY = 'ofc-mock-db-v4'

const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000).toISOString()

export const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 혼동 문자(I,O,0,1) 제외

// 민원 번호: M-YYMMDD-XXXXXX
// 순차 증가값을 쓰지 않는다 — 열람이 공개이므로 번호 추측으로 타인 민원이 열리는 것을 막는다.
export function generateComplaintId(date = new Date()) {
  const yy = String(date.getFullYear()).slice(2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  let suffix = ''
  for (let i = 0; i < 6; i += 1) {
    suffix += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  }
  return `M-${yy}${mm}${dd}-${suffix}`
}

function seedUsers() {
  return [
    { id: 'S001', employeeNo: 'S001', password: '1234', name: '정영배', role: 'ADMIN', categories: [] },
    { id: 'W001', employeeNo: 'W001', password: '1234', name: '김도현', role: 'WORKER', categories: ['WATER'] },
    { id: 'W002', employeeNo: 'W002', password: '1234', name: '이상철', role: 'WORKER', categories: ['HVAC'] },
    { id: 'W003', employeeNo: 'W003', password: '1234', name: '박정훈', role: 'WORKER', categories: ['ELEC'] },
    { id: 'W004', employeeNo: 'W004', password: '1234', name: '한승우', role: 'WORKER', categories: ['WATER'] },
    // 다목적 작업자 — 전 카테고리 담당 (기술서 1.1 운영 인력 구성)
    { id: 'W005', employeeNo: 'W005', password: '1234', name: '정민수', role: 'WORKER', categories: ['ELEC', 'WATER', 'HVAC', 'ELEV', 'SEC', 'FURN'] }
  ]
}

function h(at, actorType, actorName, action, note = null) {
  return { at, actorType, actorName, action, note }
}

// 시드는 하루 15~20건이 오가는 실제 규모를 가정한다 — 목록 밀도·정렬·필터가 의미를 갖는 최소 조건.
// 미배정 10건(층·설비·긴급도 혼합) · 사진 있는 민원 · 반납 이력 · 김도현 완료 이력 · 오분류(ETC) 건을 포함한다.
function seedComplaints() {
  return [
    {
      id: 'M-260915-C9M4T7',
      title: '7층 회의실 냉방 작동 안 함',
      content: '7층 회의실 에어컨을 켜도 찬바람이 나오지 않습니다. 오전 내내 동일한 증상입니다.',
      floor: '7층', space: '회의실', categoryCode: 'HVAC', priority: 'URGENT',
      status: 'RECEIVED', password: '1111', photos: ['IMG_4821.jpg', 'IMG_4822.jpg'],
      assigneeId: null, createdAt: minutesAgo(78), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [h(minutesAgo(78), 'USER', '신고자', 'REGISTER')]
    },
    {
      id: 'M-260915-A7K2Q9',
      title: '6층 화장실 세면대 누수',
      content: '6층 남자 화장실 가장 안쪽 세면대 하부에서 물이 계속 떨어집니다.',
      floor: '6층', space: '화장실', categoryCode: 'WATER', priority: 'NORMAL',
      status: 'IN_PROGRESS', password: '1234', photos: ['세면대하부.jpg'],
      assigneeId: 'W001', createdAt: minutesAgo(42), assignedAt: minutesAgo(20), completedAt: null,
      resolution: null, reject: null,
      history: [
        h(minutesAgo(42), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(20), 'WORKER', '김도현', 'CLAIM')
      ]
    },
    {
      id: 'M-260915-B4N9R2',
      title: '6층 화장실 변기 물 안 내려감',
      content: '6층 화장실 두 번째 칸 변기 물이 내려가지 않습니다.',
      floor: '6층', space: '화장실', categoryCode: 'WATER', priority: 'NORMAL',
      status: 'RECEIVED', password: '2222', photos: [],
      assigneeId: null, createdAt: minutesAgo(15), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [h(minutesAgo(15), 'USER', '신고자', 'REGISTER')]
    },
    // 오분류(ETC) — 신고자가 어느 설비인지 모르는 건. P-01 담당 외 선점의 실제 사례.
    {
      id: 'M-260915-T5X8C3',
      title: '3층 사무구역 천장에서 물이 떨어짐',
      content: '3층 창가 쪽 천장 타일에서 물방울이 떨어집니다. 바닥에 양동이를 받쳐 뒀습니다. 어느 쪽 문제인지 모르겠습니다.',
      floor: '3층', space: '사무구역', categoryCode: 'ETC', priority: 'URGENT',
      status: 'RECEIVED', password: '1313', photos: ['천장누수.jpg', '바닥.jpg'],
      assigneeId: null, createdAt: minutesAgo(35), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [h(minutesAgo(35), 'USER', '신고자', 'REGISTER')]
    },
    // 반납 이력이 있는 건 — 반납 후 접수 시각 기준으로 지연 판정된다 (P-B)
    {
      id: 'M-260915-H2D6V1',
      title: '지하 1층 기계실 배전반 경고등 점등',
      content: '기계실 배전반에 빨간 경고등이 들어와 있습니다.',
      floor: '지하 1층', space: '기계실', categoryCode: 'ELEC', priority: 'URGENT',
      status: 'RECEIVED', password: '1414', photos: [],
      assigneeId: null, createdAt: minutesAgo(140), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [
        h(minutesAgo(140), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(110), 'WORKER', '정민수', 'CLAIM'),
        h(minutesAgo(70), 'WORKER', '정민수', 'RELEASE', '승강기 점검 일정과 겹쳐 처리 불가')
      ]
    },
    {
      id: 'M-260914-D2H8L5',
      title: '2층 출입문 카드 인식 오류',
      content: '2층 출입문에서 사원증이 인식되지 않습니다.',
      floor: '2층', space: '로비', categoryCode: 'SEC', priority: 'NORMAL',
      status: 'COMPLETED', password: '3333', photos: [],
      assigneeId: 'W005', createdAt: minutesAgo(1600), assignedAt: minutesAgo(1520), completedAt: minutesAgo(1460),
      resolution: { content: '부품 교체 — 카드 리더기 접촉 불량으로 커넥터 재결선 완료. 인식 테스트 정상.', photos: [] },
      reject: null,
      history: [
        h(minutesAgo(1600), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(1520), 'WORKER', '정민수', 'CLAIM'),
        h(minutesAgo(1460), 'WORKER', '정민수', 'COMPLETE')
      ]
    },
    {
      id: 'M-260915-F6P1W8',
      title: '3층 복도 전등 깜빡임',
      content: '3층 복도 중앙 전등이 계속 깜빡입니다.',
      floor: '3층', space: '복도', categoryCode: 'ELEC', priority: 'LOW',
      status: 'IN_PROGRESS', password: '4444', photos: [],
      assigneeId: 'W003', createdAt: minutesAgo(300), assignedAt: minutesAgo(90), completedAt: null,
      resolution: null, reject: null,
      history: [
        h(minutesAgo(300), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(90), 'WORKER', '박정훈', 'CLAIM')
      ]
    },
    {
      id: 'M-260915-G3T7Y4',
      title: '5층 탕비실 정수기 온수 안 나옴',
      content: '5층 탕비실 정수기에서 온수가 나오지 않습니다.',
      floor: '5층', space: '탕비실', categoryCode: 'FURN', priority: 'LOW',
      status: 'RECEIVED', password: '5555', photos: [],
      assigneeId: null, createdAt: minutesAgo(200), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [h(minutesAgo(200), 'USER', '신고자', 'REGISTER')]
    },
    {
      id: 'M-260915-J8K3M2',
      title: '1층 승강기 소음',
      content: '1층에서 승강기 문이 닫힐 때 금속 마찰음이 크게 납니다.',
      floor: '1층', space: '로비', categoryCode: 'ELEV', priority: 'URGENT',
      status: 'IN_PROGRESS', password: '6666', photos: [],
      assigneeId: 'W005', createdAt: minutesAgo(180), assignedAt: minutesAgo(150), completedAt: null,
      resolution: null, reject: null,
      history: [
        h(minutesAgo(180), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(150), 'WORKER', '정민수', 'CLAIM')
      ]
    },
    // 김도현(W001) 완료 이력 — 내 작업 완료 탭이 비어 보이지 않게 한다
    {
      id: 'M-260915-S4J7L9',
      title: '4층 탕비실 싱크대 수전 누수',
      content: '4층 탕비실 싱크대 수전 아래쪽에서 물이 새어 나옵니다.',
      floor: '4층', space: '탕비실', categoryCode: 'WATER', priority: 'NORMAL',
      status: 'COMPLETED', password: '1515', photos: ['수전누수.jpg'],
      assigneeId: 'W001', createdAt: minutesAgo(520), assignedAt: minutesAgo(460), completedAt: minutesAgo(415),
      resolution: {
        content: '부품 교체 — 수전 카트리지 교체. 10분간 통수해 누수 없는 것 확인했습니다.',
        photos: ['조치후_수전.jpg']
      },
      reject: null,
      history: [
        h(minutesAgo(520), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(460), 'WORKER', '김도현', 'CLAIM'),
        h(minutesAgo(415), 'WORKER', '김도현', 'COMPLETE')
      ]
    },
    {
      id: 'M-260914-W6B2N8',
      title: '8층 화장실 소변기 자동 센서 오작동',
      content: '8층 남자 화장실 소변기 센서가 반응하지 않습니다.',
      floor: '8층', space: '화장실', categoryCode: 'WATER', priority: 'LOW',
      status: 'COMPLETED', password: '1616', photos: [],
      assigneeId: 'W001', createdAt: minutesAgo(2400), assignedAt: minutesAgo(2300), completedAt: minutesAgo(2255),
      resolution: { content: '청소·이물 제거 — 센서 렌즈 이물 제거 후 정상 작동 확인.', photos: [] },
      reject: null,
      history: [
        h(minutesAgo(2400), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(2300), 'WORKER', '김도현', 'CLAIM'),
        h(minutesAgo(2255), 'WORKER', '김도현', 'COMPLETE')
      ]
    },
    {
      id: 'M-260914-K5R9N3',
      title: '4층 사무구역 냉방 과다',
      content: '4층 창가 자리가 너무 춥습니다. 온도 조절 부탁드립니다.',
      floor: '4층', space: '사무구역', categoryCode: 'HVAC', priority: 'LOW',
      status: 'COMPLETED', password: '7777', photos: [],
      assigneeId: 'W002', createdAt: minutesAgo(1800), assignedAt: minutesAgo(1700), completedAt: minutesAgo(1640),
      resolution: { content: '조정·재설정 — 해당 구역 디퓨저 풍량 조절 및 설정 온도 2도 상향.', photos: [] },
      reject: null,
      history: [
        h(minutesAgo(1800), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(1700), 'WORKER', '이상철', 'CLAIM'),
        h(minutesAgo(1640), 'WORKER', '이상철', 'COMPLETE')
      ]
    },
    {
      id: 'M-260914-L2V6X9',
      title: '6층 화장실 세면대 누수',
      content: '6층 화장실 세면대에서 물이 샙니다.',
      floor: '6층', space: '화장실', categoryCode: 'WATER', priority: 'NORMAL',
      status: 'REJECTED', password: '8888', photos: [],
      assigneeId: null, createdAt: minutesAgo(1400), assignedAt: null, completedAt: null,
      resolution: null,
      reject: { reasonType: 'DUPLICATE', reason: '동일 위치·동일 증상 민원이 이미 접수되어 있습니다.', originalComplaintId: 'M-260915-A7K2Q9', at: minutesAgo(1380) },
      history: [
        h(minutesAgo(1400), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(1380), 'ADMIN', '정영배', 'REJECT', '같은 건 — 원본 M-260915-A7K2Q9')
      ]
    },
    {
      id: 'M-260913-P4Q8Z6',
      title: '8층 회의실 조명 일부 점등 안 됨',
      content: '8층 대회의실 조명 6개 중 2개가 켜지지 않습니다.',
      floor: '8층', space: '회의실', categoryCode: 'ELEC', priority: 'NORMAL',
      status: 'COMPLETED', password: '9999', photos: [],
      assigneeId: 'W003', createdAt: minutesAgo(3000), assignedAt: minutesAgo(2900), completedAt: minutesAgo(2810),
      resolution: { content: '부품 교체 — LED 모듈 2개 교체 완료.', photos: [] },
      reject: null,
      history: [
        h(minutesAgo(3000), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(2900), 'WORKER', '박정훈', 'CLAIM'),
        h(minutesAgo(2810), 'WORKER', '박정훈', 'COMPLETE')
      ]
    },
    {
      id: 'M-260913-R7S2T5',
      title: '지하 주차장 조명 어두움',
      content: '주차장 B구역 조명이 어둡습니다.',
      floor: '지하 1층', space: '주차장', categoryCode: 'ELEC', priority: 'LOW',
      status: 'CANCELED', password: '1010', photos: [],
      assigneeId: null, createdAt: minutesAgo(3200), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [
        h(minutesAgo(3200), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(3100), 'USER', '신고자', 'CANCEL')
      ]
    },
    // 관리소장이 회수한 건 — 회수 확인·이력 표시 검증용
    {
      id: 'M-260915-D7F2M5',
      title: '7층 탕비실 전자레인지 작동 안 함',
      content: '7층 탕비실 전자레인지가 전원은 들어오는데 가열이 되지 않습니다.',
      floor: '7층', space: '탕비실', categoryCode: 'FURN', priority: 'LOW',
      status: 'RECEIVED', password: '2323', photos: [],
      assigneeId: null, createdAt: minutesAgo(330), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [
        h(minutesAgo(330), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(250), 'ADMIN', '정영배', 'ASSIGN', '박정훈에게 배정'),
        h(minutesAgo(120), 'ADMIN', '정영배', 'REVOKE', '승강기 긴급 건 우선 처리로 회수')
      ]
    },
    // 관리 대상 외 반려 — 반려 사유 섹션의 비중복 분기 검증용
    {
      id: 'M-260914-Y3B8Q2',
      title: '길 건너 주차 단속 문의',
      content: '건물 앞 도로에 불법 주차가 많습니다. 단속해 주세요.',
      floor: '1층', space: '로비', categoryCode: 'ETC', priority: 'LOW',
      status: 'REJECTED', password: '2424', photos: [],
      assigneeId: null, createdAt: minutesAgo(2100), assignedAt: null, completedAt: null,
      resolution: null,
      reject: {
        reasonType: 'OUT_OF_SCOPE',
        reason: '건물 외부 도로는 관리 범위가 아닙니다. 관할 구청 주차단속과로 문의해 주세요.',
        originalComplaintId: null, at: minutesAgo(2040)
      },
      history: [
        h(minutesAgo(2100), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(2040), 'ADMIN', '정영배', 'REJECT')
      ]
    },
    // 정민수 두 번째 보유 건 — 기사 현황의 '외 N건' 표시 검증용
    {
      id: 'M-260915-C4H9T8',
      title: '지하 1층 기계실 급수 펌프 소음',
      content: '기계실 급수 펌프에서 평소보다 큰 소리가 납니다.',
      floor: '지하 1층', space: '기계실', categoryCode: 'WATER', priority: 'NORMAL',
      status: 'IN_PROGRESS', password: '2525', photos: [],
      assigneeId: 'W005', createdAt: minutesAgo(260), assignedAt: minutesAgo(65), completedAt: null,
      resolution: null, reject: null,
      history: [
        h(minutesAgo(260), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(65), 'WORKER', '정민수', 'CLAIM')
      ]
    },
    {
      id: 'M-260915-N9W4B7',
      title: '2층 탕비실 싱크대 배수 불량',
      content: '물이 잘 내려가지 않고 고입니다.',
      floor: '2층', space: '탕비실', categoryCode: 'WATER', priority: 'NORMAL',
      status: 'RECEIVED', password: '1212', photos: [],
      assigneeId: null, createdAt: minutesAgo(30), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [h(minutesAgo(30), 'USER', '신고자', 'REGISTER')]
    },
    {
      id: 'M-260915-M3C7F2',
      title: '8층 사무구역 콘센트 전원 안 들어옴',
      content: '8층 사무구역 창가 열 콘센트 3구 모두 전원이 들어오지 않습니다.',
      floor: '8층', space: '사무구역', categoryCode: 'ELEC', priority: 'NORMAL',
      status: 'RECEIVED', password: '1717', photos: [],
      assigneeId: null, createdAt: minutesAgo(95), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [h(minutesAgo(95), 'USER', '신고자', 'REGISTER')]
    },
    {
      id: 'M-260915-V8Y4H6',
      title: '지하 2층 주차장 출입 차단기 미작동',
      content: '지하 2층 주차장 차단기가 카드를 대도 열리지 않습니다.',
      floor: '지하 2층', space: '주차장', categoryCode: 'SEC', priority: 'NORMAL',
      status: 'RECEIVED', password: '1818', photos: [],
      assigneeId: null, createdAt: minutesAgo(410), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [h(minutesAgo(410), 'USER', '신고자', 'REGISTER')]
    },
    {
      id: 'M-260915-Q2L5D8',
      title: '1층 로비 의자 등받이 파손',
      content: '1층 로비 대기 의자 등받이가 부러져 있습니다. 앉으면 위험할 것 같습니다.',
      floor: '1층', space: '로비', categoryCode: 'FURN', priority: 'LOW',
      status: 'RECEIVED', password: '1919', photos: ['의자.jpg'],
      assigneeId: null, createdAt: minutesAgo(58), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [h(minutesAgo(58), 'USER', '신고자', 'REGISTER')]
    },
    {
      id: 'M-260915-Z6N3K4',
      title: '5층 화장실 온수 안 나옴',
      content: '5층 여자 화장실 온수가 나오지 않고 찬물만 나옵니다.',
      floor: '5층', space: '화장실', categoryCode: 'WATER', priority: 'URGENT',
      status: 'RECEIVED', password: '2020', photos: [],
      assigneeId: null, createdAt: minutesAgo(22), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [h(minutesAgo(22), 'USER', '신고자', 'REGISTER')]
    },
    {
      id: 'M-260915-X9G2P7',
      title: '2층 회의실 환기 안 됨',
      content: '2층 소회의실에 사람이 몇 명만 있어도 금방 답답해집니다. 환기가 되지 않는 것 같습니다.',
      floor: '2층', space: '회의실', categoryCode: 'HVAC', priority: 'LOW',
      status: 'RECEIVED', password: '2121', photos: [],
      assigneeId: null, createdAt: minutesAgo(640), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [h(minutesAgo(640), 'USER', '신고자', 'REGISTER')]
    }
  ]
}

function seedDb() {
  return { users: seedUsers(), complaints: seedComplaints() }
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    // 저장소 접근 불가 시 시드 데이터로 동작한다.
  }
  return seedDb()
}

export const db = load()

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch (e) {
    // 무시 — 메모리 상태로만 동작
  }
}

export function resetDb() {
  const fresh = seedDb()
  db.users = fresh.users
  db.complaints = fresh.complaints
  persist()
}
