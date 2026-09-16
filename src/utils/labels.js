// 화면에 노출되는 말은 현장 용어를 쓴다.
// 상태 코드(RECEIVED 등)와 정책명(P-01, D-01)은 코드와 문서에만 남긴다.
// 같은 상태라도 보는 사람에 따라 부르는 말이 다르다.

const STATUS = {
  RECEIVED:    { staff: '대기',    user: '접수 완료', mark: 'st-wait' },
  IN_PROGRESS: { staff: '작업 중',  user: '작업 중',   mark: 'st-work' },
  COMPLETED:   { staff: '완료',    user: '완료',      mark: 'st-done' },
  REJECTED:    { staff: '반려',    user: '반려',      mark: 'st-off'  },
  CANCELED:    { staff: '취소',    user: '취소',      mark: 'st-off'  }
}

export const statusLabel = (code, who = 'staff') => STATUS[code]?.[who] ?? code
export const statusMark = (code) => STATUS[code]?.mark ?? 'off'

// 현장 용어 ↔ 설계 용어
export const TERMS = {
  // '선점'은 기술서 용어지만 현장에서 쓰이지 않아 화면에서는 '맡기'로 둔다 (P-F).
  claim: '이 작업 맡기',
  release: '반납',
  assign: '배정',
  reassign: '재배정',
  revoke: '배정 회수',
  unassigned: '담당자 없음',
  unassignedList: '미배정 민원',
  myTasks: '내 작업',
  priority: '긴급도',
  // ADMIN 화면은 사용자 친화형이 아니라 용어형으로 간다 (P-B)
  classify: '분류 정보 수정',
  dashboard: '운영 현황',
  allComplaints: '전체 민원',
  delayedList: '지연 민원',
  stats: '통계',
  reject: '반려',
  rejectReason: '반려 사유',
  originalComplaint: '원본 민원',
  worker: '시설기사',
  admin: '관리소장'
}
