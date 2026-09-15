// 본인 확인을 통과한 민원의 비밀번호를 메모리에만 잠시 보관한다.
// 새로고침하면 사라지므로, 수정 화면은 다시 본인 확인을 요구한다.
const verified = new Map()

export const verifyStore = {
  set: (id, password) => verified.set(id, password),
  get: (id) => verified.get(id) ?? null,
  clear: (id) => verified.delete(id)
}
