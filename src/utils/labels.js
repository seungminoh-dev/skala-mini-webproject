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
  claim: '이 작업 맡기',
  release: '작업 넘기기',
  assign: '담당자 지정',
  reassign: '담당자 변경',
  revoke: '담당 해제',
  unassigned: '담당자 없음',
  waitingList: '대기 중인 작업',
  priority: '긴급도',
  fixInfo: '요청 정보 바로잡기',
  worker: '시설기사',
  admin: '관리소장'
}
