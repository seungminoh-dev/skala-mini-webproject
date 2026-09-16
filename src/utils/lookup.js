// 민원 번호 조회 — 홈과 독립 조회 화면이 같은 규칙을 쓴다 (개편 기획 6.4).
import { getComplaint } from '@/mock/api'

export const COMPLAINT_NO_EXAMPLE = 'M-260915-A7K2Q9'
const FORMAT = /^M-\d{6}-[A-Z0-9]{6}$/

export const normalizeNo = (v) => v.trim().toUpperCase()

// 반환: { ok: true, id } | { ok: false, message }
export async function lookupComplaint(raw) {
  const no = normalizeNo(raw ?? '')
  if (!no) return { ok: false, message: '민원 번호를 입력해 주세요.' }
  if (!FORMAT.test(no)) {
    return { ok: false, message: `민원 번호 형식을 확인해 주세요. 예: ${COMPLAINT_NO_EXAMPLE}` }
  }
  try {
    await getComplaint(no)
    return { ok: true, id: no }
  } catch {
    return { ok: false, message: '해당 번호의 민원을 찾을 수 없습니다. 번호를 확인해 주세요.' }
  }
}
