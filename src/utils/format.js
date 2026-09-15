const ACTION_LABEL = {
  REGISTER: '민원 접수',
  UPDATE: '신고 내용 수정',
  CANCEL: '신고자 취소',
  CLAIM: '작업자 선점',
  RELEASE: '작업자 반납',
  COMPLETE: '처리 완료',
  ASSIGN: '관리소장 배정',
  REASSIGN: '관리소장 재배정',
  REVOKE: '관리소장 배정 회수',
  UPDATE_CLASSIFICATION: '분류 정보 수정',
  REJECT: '관리소장 반려'
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
