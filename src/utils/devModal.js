// 개발 모드 전용. ?modal=<key> 로 모달 상태를 열어 문서용 캡처를 만든다.
export function devModal(key) {
  if (!import.meta.env.DEV) return false
  return new URLSearchParams(location.search).get('modal') === key
}
