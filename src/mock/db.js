// 목 데이터 저장소. 실제 구현에서는 서버 DB가 담당하는 영역이다.
// localStorage에 유지되므로 새로고침해도 상태가 남는다. resetDb()로 초기화.

const STORAGE_KEY = 'ofc-mock-db-v2'

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

function seedComplaints() {
  return [
    {
      id: 'M-260915-C9M4T7',
      title: '7층 회의실 냉방 작동 안 함',
      content: '7층 회의실 에어컨을 켜도 찬바람이 나오지 않습니다. 오전 내내 동일한 증상입니다.',
      floor: '7층', space: '회의실', categoryCode: 'HVAC', priority: 'URGENT',
      status: 'RECEIVED', password: '1111', photos: [],
      assigneeId: null, createdAt: minutesAgo(78), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [h(minutesAgo(78), 'USER', '신고자', 'REGISTER')]
    },
    {
      id: 'M-260915-A7K2Q9',
      title: '6층 화장실 세면대 누수',
      content: '6층 남자 화장실 가장 안쪽 세면대 하부에서 물이 계속 떨어집니다.',
      floor: '6층', space: '화장실', categoryCode: 'WATER', priority: 'NORMAL',
      status: 'IN_PROGRESS', password: '1234', photos: [],
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
    {
      id: 'M-260914-D2H8L5',
      title: '2층 출입문 카드 인식 오류',
      content: '2층 출입문에서 사원증이 인식되지 않습니다.',
      floor: '2층', space: '로비', categoryCode: 'SEC', priority: 'NORMAL',
      status: 'COMPLETED', password: '3333', photos: [],
      assigneeId: 'W005', createdAt: minutesAgo(1600), assignedAt: minutesAgo(1520), completedAt: minutesAgo(1460),
      resolution: { content: '카드 리더기 접촉 불량으로 커넥터 재결선 완료. 인식 테스트 정상.', photos: [], durationMinutes: 60 },
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
    {
      id: 'M-260914-K5R9N3',
      title: '4층 사무구역 냉방 과다',
      content: '4층 창가 자리가 너무 춥습니다. 온도 조절 부탁드립니다.',
      floor: '4층', space: '사무구역', categoryCode: 'HVAC', priority: 'LOW',
      status: 'COMPLETED', password: '7777', photos: [],
      assigneeId: 'W002', createdAt: minutesAgo(1800), assignedAt: minutesAgo(1700), completedAt: minutesAgo(1640),
      resolution: { content: '해당 구역 디퓨저 풍량 조절 및 설정 온도 2도 상향.', photos: [], durationMinutes: 60 },
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
      resolution: { content: 'LED 모듈 2개 교체 완료.', photos: [], durationMinutes: 90 },
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
      floor: '1층', space: '주차장', categoryCode: 'ELEC', priority: 'LOW',
      status: 'CANCELED', password: '1010', photos: [],
      assigneeId: null, createdAt: minutesAgo(3200), assignedAt: null, completedAt: null,
      resolution: null, reject: null,
      history: [
        h(minutesAgo(3200), 'USER', '신고자', 'REGISTER'),
        h(minutesAgo(3100), 'USER', '신고자', 'CANCEL')
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
