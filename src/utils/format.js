const ACTION_LABEL = {
  REGISTER: '민원 접수',
  UPDATE: '신고 내용 수정',
  CANCEL: '신고자 취소',
  CLAIM: '담당 기사 배정',
  RELEASE: '작업 반납',
  COMPLETE: '처리 완료',
  ASSIGN: '관리소장 배정',
  REASSIGN: '재배정',
  REVOKE: '배정 회수',
  UPDATE_CLASSIFICATION: '분류 정보 수정',
  REJECT: '반려'
}

export const actionLabel = (a) => ACTION_LABEL[a] ?? a

export function formatDateTime(iso) {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// 경과 시간을 "전" 없이 길이로만 말한다 — `맡은 지 20분` 처럼 앞말과 이어 쓰는 자리용.
export function elapsedShort(iso) {
  if (!iso) return '—'
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  if (h < 24) return m % 60 ? `${h}시간 ${m % 60}분` : `${h}시간`
  return `${Math.floor(h / 24)}일`
}

// 처리 시간은 접수 → 완료 간격 하나로 말한다. 작업 시간을 따로 두지 않는다 (P-G).
export const minutesBetween = (from, to) =>
  Math.max(0, Math.round((new Date(to) - new Date(from)) / 60000))

export function durationLabel(minutes) {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}분`
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}
