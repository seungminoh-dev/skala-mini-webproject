# 오피스 시설 민원 처리 서비스 — 프론트엔드

오피스 빌딩 시설물 민원의 접수부터 처리 완료까지를 다루는 모바일 우선 반응형 웹 서비스.
백엔드 없이 **목 API**로 동작하며, 기술서의 상태 전이·정책을 목 계층에서 그대로 강제한다.

## 실행

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # dist/
```

## 목 계정 (비밀번호 모두 `1234`)

| 사번 | 이름 | 역할 | 담당 카테고리 |
| --- | --- | --- | --- |
| `S001` | 정영배 | ADMIN | — |
| `W001` | 김도현 | WORKER | 급배수·위생 |
| `W002` | 이상철 | WORKER | 공조 |
| `W003` | 박정훈 | WORKER | 전기·조명 |
| `W004` | 한승우 | WORKER | 급배수·위생 |
| `W005` | 정민수 | WORKER | 전 카테고리 |

신고자(`USER`)는 **로그인하지 않는다.** 민원 열람은 공개이며, 수정·취소에만 접수 시 입력한
4자리 비밀번호가 필요하다.

시드 민원 예시: `M-260915-A7K2Q9`(처리중, 비번 `1234`), `M-260915-B4N9R2`(접수됨, 비번 `2222`)

## 구조

```
src/
  mock/
    constants.js   도메인 상수 (카테고리 · 우선순위 · 상태 · 지연 임계값)
    db.js          시드 데이터 · 민원 번호 발급 · localStorage 영속화
    api.js         목 API. 주석의 METHOD /path 가 OAS 명세 대상 엔드포인트
  stores/
    auth.js        직원 세션 (sessionStorage)
    verify.js      본인 확인 통과 상태 (메모리, 새로고침 시 소멸)
  components/      AppBar · TabBar · StatusBadge · ComplaintCard · ModalSheet · DevBar
  views/
    user/          U-01~U-07  (비인증)
    staff/         W-01 로그인 (ADMIN·WORKER 공용)
    worker/        W-02~W-06
    admin/         A-01~A-06
```

## 반응형

모바일 우선. `768px` 이상에서 하단 탭바가 상단 내비게이션으로 바뀌고, 목록은 다열 그리드로 흐른다.
폼과 상세는 `640px`, 목록과 대시보드는 `1080px`로 폭을 제한한다.

## 목 API가 강제하는 규칙

| 규칙 | 동작 |
| --- | --- |
| 상태 전이 (9.2) | `RECEIVED ↔ IN_PROGRESS → COMPLETED`, `REJECTED` / `CANCELED`로 종료 |
| P-01 선점 자격 | 담당 외 카테고리도 선점 가능. UI에서 경고 후 진행 |
| P-02 지연 판정 | 긴급 1시간 / 보통 6시간 / 낮음 24시간 초과 시 지연 표시 |
| 선점 경합 | 이미 선점된 민원 재선점 시 `409 ALREADY_CLAIMED` |
| 본인 확인 | 비밀번호 불일치 `401`, 배정 후 수정·취소 시도 `409` |
| FR-307 수정 범위 | 관리소장은 분류 정보만 수정. 신고 원문은 수정 대상 아님 |
| D-01 중복 반려 | 중복 사유 선택 시 원본 민원 연결 필수 (`400 ORIGINAL_REQUIRED`) |

민원 번호는 순차 증가값이 아닌 `M-YYMMDD-XXXXXX` 형식으로 발급한다. 열람이 공개이므로
번호 추측으로 타인의 민원이 열리는 것을 막기 위함이다.

## 개발 도구

- 화면 좌하단 **DevBar** — 역할별 화면 이동, 목 데이터 초기화. 개발 모드에서만 렌더된다.
- 콘솔 `window.__api` — 선점 경합처럼 UI만으로 재현하기 어려운 경로 확인용 (개발 모드 한정)

```js
await window.__api.claimComplaint('M-260915-A7K2Q9', 'W002')  // 409 ALREADY_CLAIMED
```

## 실제 API 연결 시

`src/mock/api.js`의 함수 시그니처를 유지한 채 내부를 `fetch` 호출로 교체하면 된다.
각 함수 주석의 `METHOD /path`가 대응 엔드포인트이고, 던지는 `ApiError(status, code, message)`의
상태 코드가 OAS에 정의할 응답 코드다.
