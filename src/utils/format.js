const ACTION_LABEL = {
  REGISTER: '민원 접수',
  UPDATE: '신고 내용 수정',
  CANCEL: '신고자 취소',
  CLAIM: '담당 기사 배정',
  RELEASE: '작업 넘김',
  COMPLETE: '처리 완료',
  ASSIGN: '관리소장이 담당자 지정',
  REASSIGN: '담당자 변경',
  REVOKE: '담당 해제',
  UPDATE_CLASSIFICATION: '요청 정보 정정',
  REJECT: '반려'
}

export const actionLabel = (a) => ACTION_LABEL[a] ?? a

export function formatDateTime(iso) {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function durationLabel(minutes) {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}분`
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}
