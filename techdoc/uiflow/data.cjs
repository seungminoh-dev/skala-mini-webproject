// UI Flow 페이지 데이터.
//
// PAGES  — 화면 상세 (23화면). rect 는 캡처 이미지 기준 [x, y, w, h] (%), 실측값이다.
//          kind: api(연결 API) | ui(동작·이동) | rule(정책). api 필드는 kind 와 무관하게 표기된다.
//          crop — 캡처에서 실을 세로 비율. 전 페이지가 같은 띠 높이(1440 기준 640px)를 갖도록 640/캡처높이 로 잡았다.
// FLOWS  — 액터별 화면 전이도 3장.
// MATRIX — openapi.yaml 전 엔드포인트 × 사용 화면 (부록).
//
// 설명(d)은 1~2문장으로 짧게 — 설계 근거의 상세는 기술서 본문이 담당한다.

const S = {
  common: 'UI 흐름 — 공통',
  user: 'UI 흐름 — 건물 사용자',
  worker: 'UI 흐름 — 시설기사',
  admin: 'UI 흐름 — 관리소장',
  except: 'UI 흐름 — 예외 상태'
}

module.exports.PAGES = [
  /* ── 공통 ───────────────────────────────────────────── */
  {
    id: 'W-01', actor: 'COMMON', section: S.common,
    title: '직원 로그인', designName: '직원 로그인',
    img: '../../docs/img/pc/W-01.png', imgSize: [2880, 1400], crop: 0.914,
    lead: 'ADMIN 과 WORKER 가 공유하는 단 하나의 인증 화면 — 역할에 따라 진입 화면이 갈린다.',
    fr: ['FR-001'], policies: [],
    flow: { from: '(직접 진입)', to: ['W-02 미배정 민원 (WORKER)', 'A-01 운영 현황 (ADMIN)'] },
    db: 'user_account (id, password_hash, role) 조회 — 쓰기 없음',
    notes: [
      { kind: 'ui', rect: [39.5, 36.8, 21, 9.5],
        t: '사번',
        d: '신고자와 달리 직원은 사번으로 식별한다. placeholder 를 `예) W001` 로 두어 실제 값처럼 읽히지 않게 했다.' },
      { kind: 'ui', rect: [39.5, 48.5, 21, 9.5],
        t: '비밀번호',
        d: '직원 계정은 구축 시점에 관리자가 등록한다 — 회원가입 절차를 두지 않는다 (8장 가정).' },
      { kind: 'api', rect: [39.5, 60.6, 21, 7.3],
        t: '로그인',
        api: 'POST /auth/login',
        d: '역할에 따라 W-02 또는 A-01 로 보낸다. 실패는 `401 LOGIN_FAILED` 하나뿐 — 무엇이 틀렸는지 알려주지 않는다.' },
      { kind: 'rule', rect: [37.5, 21.7, 25, 57.3],
        t: '인증 범위',
        d: '역할 기반 권한 체계는 존재하는 것으로 가정하되, 명세에 Security Schemes 는 기술하지 않는다 (8장).' }
    ]
  },

  /* ── 건물 사용자 (USER) ──────────────────────────────── */
  {
    id: 'U-01', actor: 'USER', section: S.user,
    title: '사용자 홈', designName: '신고자 진입점',
    img: '../../docs/img/pc/U-01.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '건물 사용자는 로그인하지 않는다 — 접수와 조회, 두 갈래만 제시한다.',
    fr: ['FR-101', 'FR-102'], policies: [],
    flow: { from: '(공개 진입)', to: ['U-02 민원 등록', 'U-05 민원 상세 (번호 조회)'] },
    db: '조회 시 complaint 단건 select — 이 화면 자체는 쓰기 없음',
    notes: [
      { kind: 'rule', rect: [0, 0, 100, 7.4],
        t: '비인증 공개 셸',
        d: 'USER 는 계정을 만들지 않는다. 상단에 로그인 대신 `직원 로그인` 링크만 두어 두 세계를 분리했다.' },
      { kind: 'ui', rect: [12.5, 42.2, 9.8, 7.5],
        t: '민원 등록하기 → U-02',
        d: '접수 누락 방지가 첫 번째 가치이므로, 등록 경로를 가장 큰 조작 단위로 둔다.' },
      { kind: 'api', rect: [55.1, 41.5, 32.4, 7],
        t: '번호로 조회',
        api: 'GET /complaints/{id}',
        d: '민원 번호만으로 상태를 본다. 없는 번호는 `404 COMPLAINT_NOT_FOUND` — 입력칸 아래에 문장으로 돌려준다.' },
      { kind: 'rule', rect: [12.5, 58, 75, 7.5],
        t: '긴급 직통 안내',
        d: '온라인 접수는 즉시 출동을 보장하지 않는다. 안전 위험은 전화가 정확한 경로라는 사실을 먼저 말한다.' }
    ]
  },
  {
    id: 'U-02', actor: 'USER', section: S.user,
    title: '민원 등록', designName: '민원 접수 폼',
    img: '../../docs/img/pc/U-02.png', imgSize: [2880, 3000], crop: 0.427,
    lead: '접수 누락 방지의 출발점 — 어디가 어떻게 불편한지만 물어 한 페이지로 끝낸다.',
    fr: ['FR-101'], policies: ['P-01'],
    flow: { from: 'U-01 사용자 홈', to: ['U-03 접수 완료'] },
    db: 'complaint INSERT + history(REGISTER) INSERT — 한 트랜잭션',
    notes: [
      { kind: 'api', rect: [28.5, 18.9, 43.1, 15.7],
        t: '민원 등록',
        api: 'POST /complaints',
        d: '여기서 고른 층·공간·설비·긴급도가 그대로 민원의 분류 정보가 된다. 필수 항목이 비면 `400 INVALID_PAYLOAD`.' },
      { kind: 'ui', rect: [28.5, 22.1, 43.1, 4.8],
        t: '층 · 공간',
        d: '위치는 두 드롭다운으로 받는다. 지하 2층부터 지상 8층까지, 자유 입력을 허용하지 않아 통계가 집계 가능한 형태로 남는다.' },
      { kind: 'rule', rect: [28.5, 29.8, 43.1, 3],
        t: '기타 · 모름 허용',
        d: '설비를 모르는 신고자를 위해 남겨 둔다. 오분류는 관리소장이 정정하고(FR-307), 그 전에도 기사가 맡을 수 있다 (P-01).' },
      { kind: 'ui', rect: [28.5, 36.9, 43.1, 5.4],
        t: '신고 원문',
        d: '제목·내용·사진은 신고자의 진술 기록이다. 관리소장도 이 부분은 수정할 수 없다 (10.4).' },
      { kind: 'ui', rect: [0, 0, 100, 3.5],
        t: '로그인 없이 접수',
        d: '계정 대신 숫자 4자리 비밀번호를 받는다. 인증 수단이 아니라 수정·취소 때 쓰는 본인 확인 수단이다.' }
    ]
  },
  {
    id: 'U-03', actor: 'USER', section: S.user,
    title: '접수 완료', designName: '접수증',
    img: '../../docs/img/pc/U-03.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '민원 번호가 이후 조회·수정·취소의 유일한 열쇠 — 보관을 명시적으로 안내한다.',
    fr: ['FR-101'], policies: [],
    flow: { from: 'U-02 민원 등록', to: ['U-05 민원 상세'] },
    db: 'complaint INSERT 직후의 응답을 그대로 렌더 — 추가 조회 없음',
    notes: [
      { kind: 'ui', rect: [30.5, 36.6, 39, 3.7],
        t: '접수된 제목',
        d: '방금 접수한 내용을 그대로 되비춰 오등록을 즉시 알아채게 한다.' },
      { kind: 'ui', rect: [30.5, 40.9, 39, 3],
        t: '위치 · 설비 · 접수 시각',
        d: '분류 정보를 한 줄로 확인시킨다. 틀렸으면 이 화면에서 바로 U-05 → 수정으로 갈 수 있다.' },
      { kind: 'rule', rect: [30.5, 46.5, 39, 11.7],
        t: '민원 번호',
        api: 'M-YYMMDD-XXXXXX',
        d: '순차 증가값을 쓰지 않는다. 열람이 공개이므로 인접 번호로 타인의 민원이 열리는 것을 막아야 한다 (16.1).' },
      { kind: 'api', rect: [28.5, 32.7, 43.1, 29.3],
        t: '접수 응답',
        api: 'POST /complaints → 201',
        d: '생성된 민원의 URI 를 Location 헤더로, 본문은 ComplaintDetail 로 돌려준다.' }
    ]
  },
  {
    id: 'U-04', actor: 'USER', section: S.user,
    title: '민원 조회', designName: '번호 조회',
    img: '../../docs/img/pc/U-04.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '상태 공유의 입구 — 비밀번호 없이 번호만으로 진행 상황을 연다.',
    fr: ['FR-102'], policies: [],
    flow: { from: 'U-01 사용자 홈', to: ['U-05 민원 상세'] },
    db: 'complaint 단건 select (pk) — 쓰기 없음',
    notes: [
      { kind: 'ui', rect: [0, 0, 100, 7.4],
        t: '공개 셸',
        d: '조회는 인증 대상이 아니다. 로그인 화면을 거치지 않고 바로 닿는다.' },
      { kind: 'ui', rect: [28.5, 19.1, 43.1, 5.1],
        t: '접수 내역 조회',
        d: '홈에도 같은 입력이 있지만, 링크로 공유받아 들어오는 경로를 위해 독립 화면을 둔다.' },
      { kind: 'api', rect: [28.5, 36.2, 43.1, 7.5],
        t: '번호 조회',
        api: 'GET /complaints/{id}',
        d: '형식이 어긋나면 호출 전에 막고, 없는 번호는 `404` 를 받아 같은 자리에 문장으로 돌려준다.' },
      { kind: 'rule', rect: [28.5, 46.9, 43.1, 6],
        t: '열람은 공개',
        d: '비밀번호는 조회에 쓰지 않는다. 수정·취소에서만 본인 확인 수단으로 쓴다 — 그래서 번호가 비순차여야 한다.' }
    ]
  },
  {
    id: 'U-05', actor: 'USER', section: S.user,
    title: '민원 상세', designName: '처리 상황',
    img: '../../docs/img/pc/U-05.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '상태 공유의 본체 — 지금 어디까지 왔는지를 문장으로 먼저 말한다.',
    fr: ['FR-102', 'FR-103', 'FR-104'], policies: [],
    flow: { from: 'U-03 접수 완료 · U-04 민원 조회', to: ['U-06 본인 확인 (수정·취소)'] },
    db: 'complaint + history 조인 조회 — 타임라인이 이력을 그대로 렌더',
    notes: [
      { kind: 'ui', rect: [12.5, 18.9, 61.4, 4.9],
        t: '상태를 문장으로',
        d: '상태명과 설명을 두 줄로 나눠 말한다. `RECEIVED` 같은 코드값은 화면에 쓰지 않는다.' },
      { kind: 'ui', rect: [12.5, 35.3, 75, 3],
        t: '번호 · 복사',
        d: '민원 번호와 조회 링크를 복사할 수 있다. 번호를 잃으면 접근 경로가 사라지기 때문이다.' },
      { kind: 'ui', rect: [75.3, 38.3, 12.2, 5.8],
        t: '민원 수정 · 취소',
        d: '`RECEIVED` 일 때만 나타난다. 담당 기사가 배정되면 이 두 버튼이 사라진다 (E-02).' },
      { kind: 'api', rect: [12.5, 51.2, 43.2, 3.7],
        t: '상세 조회',
        api: 'GET /complaints/{id}',
        d: '완료된 건은 조치 결과가 등록한 내용보다 먼저 온다 — 신고자가 가장 알고 싶은 것이 결과이기 때문이다.' },
      { kind: 'rule', rect: [58.7, 56.6, 28.8, 5.4],
        t: '처리 이력',
        d: '이력의 내부 note(`담당 외 설비` 등)는 신고자에게 보이지 않는다. 운영 정보와 신고자에게 줄 정보를 나눈다.' }
    ]
  },
  {
    id: 'U-06', actor: 'USER', section: S.user,
    title: '수정·취소 본인 확인', designName: '비밀번호 확인',
    img: '../../docs/img/pc/U-06.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '열람과 변경 사이의 유일한 관문 — 접수 때 정한 숫자 4자리를 확인한다.',
    fr: ['FR-103', 'FR-104'], policies: [],
    flow: { from: 'U-05 민원 상세', to: ['U-07 민원 수정', 'E-03 민원 취소 확인'] },
    db: 'password_hash 비교만 — 상태 전이 없음',
    notes: [
      { kind: 'ui', rect: [34.8, 34.4, 30.4, 10.4],
        t: '무엇을 하려는지 먼저',
        d: '제목이 수정용인지 취소용인지를 말한다. 같은 대화상자를 두 행위가 공유하기 때문이다.' },
      { kind: 'ui', rect: [36.3, 47.4, 27.4, 7],
        t: '숫자 4자리',
        d: '4자리를 채우기 전에는 확인 버튼이 눌리지 않는다. 오타로 실패 횟수를 쌓지 않게 한다.' },
      { kind: 'api', rect: [34.8, 56.9, 30.4, 8.7],
        t: '본인 확인',
        api: 'POST /complaints/{id}/password-verification',
        d: '통과하면 수정 화면 또는 취소 확인으로 넘어간다. 확인만 하고 상태는 바꾸지 않는다.' },
      { kind: 'rule', rect: [34.7, 34.2, 30.6, 31.6],
        t: '두 가지 실패',
        d: '`401 PASSWORD_MISMATCH` 는 입력칸 아래에, `409 NOT_EDITABLE` 은 대화상자를 닫고 상세에 안내한다.' }
    ]
  },
  {
    id: 'U-07', actor: 'USER', section: S.user,
    title: '민원 수정', designName: '신고 원문 수정',
    img: '../../docs/img/pc/U-07.png', imgSize: [2880, 2480], crop: 0.516,
    lead: '신고자만 원문을 고칠 수 있고, 고칠 수 있는 시점은 배정 전까지다.',
    fr: ['FR-103'], policies: [],
    flow: { from: 'U-06 본인 확인', to: ['U-05 민원 상세 (저장 후)'] },
    db: 'complaint UPDATE + history(UPDATE) — 상태는 RECEIVED 그대로',
    notes: [
      { kind: 'ui', rect: [0, 0, 100, 4.2],
        t: '같은 공개 셸',
        d: '수정도 로그인 없이 이뤄진다. 직전 화면에서 확인한 비밀번호를 세션에 들고 온다.' },
      { kind: 'api', rect: [28.5, 20.2, 43.1, 16.8],
        t: '원문 수정',
        api: 'PATCH /complaints/{id}',
        d: '전달한 필드만 수정된다. 비밀번호는 본인 확인용이며 변경 대상이 아니다.' },
      { kind: 'ui', rect: [28.5, 26.2, 21.2, 3.6],
        t: '층',
        d: '위치를 잘못 골랐다면 여기서 고친다. 같은 값을 관리소장도 FR-307 로 고칠 수 있지만 경로와 권한이 다르다.' },
      { kind: 'ui', rect: [28.5, 33.4, 43.1, 3.6],
        t: '설비',
        d: '`기타·모름`으로 접수했더라도 나중에 알게 되면 신고자가 직접 바로잡을 수 있다.' },
      { kind: 'rule', rect: [28.5, 39.7, 43.1, 8],
        t: '배정 전까지만',
        d: '저장 시점에 이미 배정됐다면 `409 NOT_EDITABLE`. 기사가 본 지시와 기록이 어긋나지 않게 한다.' }
    ]
  },

  /* ── 시설기사 (WORKER) ───────────────────────────────── */
  {
    id: 'W-02', actor: 'WORKER', section: S.worker,
    title: '미배정 민원', designName: '미배정 민원 목록',
    img: '../../docs/img/pc/W-02.png', imgSize: [2880, 2120], crop: 0.604,
    lead: '선점(Pull) 방식의 출발점 — 접수된 민원이 곧바로 노출되고, 기사가 직접 골라 가져간다.',
    fr: ['FR-201'], policies: ['P-01', 'P-02'],
    flow: { from: 'W-01 직원 로그인', to: ['W-03 민원 상세 (행 클릭)', 'W-05 내 작업 (좌측 레일)'] },
    db: 'idx_complaint_unassigned 로 정렬 조회 — 쓰기 없음',
    notes: [
      { kind: 'ui', rect: [0, 15.6, 15.6, 3.7],
        t: '내 작업 → W-05',
        api: 'GET /complaints?assignee=me',
        d: '내가 맡아 진행 중인 민원만 분리해 본다. 같은 목록 API 를 질의 조건만 바꿔 재사용한다.' },
      { kind: 'rule', rect: [17.6, 19.1, 9.2, 5.9],
        t: '긴급도와 지연',
        d: '긴급 1시간 · 보통 6시간 · 낮음 24시간을 넘기면 서버가 지연으로 판정한다 (P-02). 관리소장 개입의 기준이다.' },
      { kind: 'ui', rect: [17.5, 9.6, 44, 3],
        t: '내 담당 · 설비 필터',
        d: '내 담당을 첫 자리에 두되 기본은 전체다. 담당 외 민원도 맡을 수 있어 오분류 건이 방치되지 않는다 (P-01).' },
      { kind: 'api', rect: [17.5, 15.7, 80.6, 44],
        t: '미배정 목록 조회',
        api: 'GET /complaints?status=RECEIVED',
        d: '긴급도 → 오래 기다린 순이 기본 정렬이다. 맨 위가 지금 가장 먼저 처리해야 할 민원이다.' },
      { kind: 'ui', rect: [81.3, 9.6, 16.7, 3],
        t: '정렬 선택',
        d: '긴급한 순 · 오래된 순 · 위치 순을 기사가 고른다. 표시 계층에서만 바꾸고 API 정렬은 그대로다.' }
    ]
  },
  {
    id: 'W-03', actor: 'WORKER', section: S.worker,
    title: '민원 상세', designName: '민원 상세 (선점 · 작업 중 · 완료 열람)',
    img: '../../docs/img/pc/W-03.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '맡기 전에는 판단 근거, 맡은 뒤에는 작업 지시서, 끝난 뒤에는 기록 — 한 화면이 상태에 따라 역할을 바꾼다.',
    fr: ['FR-202', 'FR-206'], policies: ['P-01'],
    flow: { from: 'W-02 미배정 민원 · W-05 내 작업', to: ['W-04 담당 외 확인', 'W-05 내 작업 (맡기 후)', 'W-06 처리 결과 등록'] },
    db: 'complaint + history + 동일 위치 진행 중 민원 조회 — 쓰기 없음',
    notes: [
      { kind: 'ui', rect: [83.1, 29.5, 6.9, 5.8],
        t: '이 작업 맡기',
        api: 'POST /complaints/{id}/claim',
        d: '상태별로 행동이 바뀐다 — 미배정은 맡기, 작업 중(본인)은 결과 남기기·반납, 완료는 행동 없음.' },
      { kind: 'ui', rect: [17.5, 32.2, 64.3, 3.2],
        t: '한 줄 메타',
        d: '위치를 굵게 앞에 두고 설비·긴급도·경과·번호를 한 줄로 잇는다. 균등 분할 박스를 쓰지 않는다.' },
      { kind: 'rule', rect: [17.5, 40.7, 72.5, 6.6],
        t: '담당 외 설비',
        d: '담당 기사를 사실로 알려줄 뿐 막지 않는다. 오분류된 민원이 정정 전까지 방치되는 것을 막기 위한 정책이다 (P-01).' },
      { kind: 'api', rect: [17.5, 69.7, 29.2, 10.7],
        t: '첨부 사진',
        api: 'GET /complaints/{id}',
        d: '현장에 가기 전에 무엇을 보는지 확인한다. 없으면 `첨부 사진 없음` 한 줄 — 없다는 것도 정보다.' },
      { kind: 'ui', rect: [67.8, 56.4, 22.2, 5.4],
        t: '처리 이력',
        d: '누가 언제 무엇을 했는지가 이 테이블 하나에 쌓인다. 기사 화면에서는 내부 note 까지 보여 준다.' }
    ]
  },
  {
    id: 'W-04', actor: 'WORKER', section: S.worker,
    title: '담당 외 설비 경고', designName: '담당 외 선점 확인',
    img: '../../docs/img/pc/W-04.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '막는 장치가 아니라 확인 장치 — 담당 외 선점을 허용하되 흔적을 남긴다.',
    fr: ['FR-202'], policies: ['P-01'],
    flow: { from: 'W-03 민원 상세', to: ['W-05 내 작업 (맡기)', 'W-03 민원 상세 (돌아가기)'] },
    db: 'complaint_history(CLAIM, note=담당 외 설비) INSERT',
    notes: [
      { kind: 'ui', rect: [34.8, 40.4, 30.4, 10.4],
        t: '결과만 말한다',
        d: '상세 화면이 이미 담당 기사를 알려줬으므로 같은 문장을 되풀이하지 않는다. 맡으면 무슨 일이 일어나는지만 말한다.' },
      { kind: 'api', rect: [34.8, 50.9, 30.4, 8.7],
        t: '맡기',
        api: 'POST /complaints/{id}/claim',
        d: '담당 외 여부는 서버가 판단해 이력 note 에 `담당 외 설비` 로 남긴다. 화면이 보내는 값이 아니다.' },
      { kind: 'rule', rect: [34.7, 40.3, 30.6, 19.4],
        t: 'P-01 선점 자격',
        d: '작업자는 카테고리와 무관하게 모든 미배정 민원을 선점할 수 있다. 경고는 진행 여부를 확인하는 단계일 뿐이다.' },
      { kind: 'ui', rect: [83.1, 29.5, 6.9, 5.8],
        t: '여기서 열린다',
        d: '담당 설비가 일치하면 이 대화상자 없이 곧바로 선점된다 — 확인은 예외 경로에만 붙는다.' }
    ]
  },
  {
    id: 'W-05', actor: 'WORKER', section: S.worker,
    title: '내 작업', designName: '내 작업 목록',
    img: '../../docs/img/pc/W-05.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '내가 맡은 것과 끝낸 것 — 끝낸 것도 다시 열어볼 수 있어야 이력이 쓸모를 갖는다.',
    fr: ['FR-204'], policies: [],
    flow: { from: 'W-02 미배정 민원 · W-03 맡기 직후', to: ['W-03 민원 상세 (행 클릭)', 'W-06 처리 결과 등록'] },
    db: 'idx_complaint_assignee (assignee_id, status) 로 조회 — 쓰기 없음',
    notes: [
      { kind: 'ui', rect: [0, 23.6, 15.6, 5.6],
        t: '레일 메뉴',
        d: '기사의 업무는 두 가지뿐이다 — 고르기(미배정 민원)와 처리하기(내 작업). 메뉴도 둘로 끝낸다.' },
      { kind: 'ui', rect: [17.5, 14.6, 7.7, 4.5],
        t: '작업 중 / 완료 탭',
        d: '탭에 따라 열 구성이 달라진다. 작업 중은 맡은 지, 완료는 완료 시각과 조치 요약을 보여 준다.' },
      { kind: 'api', rect: [17.6, 29, 80.4, 9.1],
        t: '내 작업 조회',
        api: 'GET /complaints?assignee=me&status=IN_PROGRESS',
        d: '목록 엔드포인트 하나가 네 화면을 담당한다 — 질의 조건만 다르다 (15.2).' },
      { kind: 'ui', rect: [78, 23.9, 8.5, 5.1],
        t: '맡은 지',
        d: 'assigned_at 기준 경과. 오래 붙잡고 있는 건이 위로 오도록 작업 중 탭만 정렬을 뒤집는다.' },
      { kind: 'ui', rect: [86.5, 23.9, 9.2, 5.1],
        t: '결과 남기기 → W-06',
        d: '행 클릭은 상세(지시서)로, 버튼은 결과 입력으로 간다. 읽는 동선과 쓰는 동선을 분리했다.' }
    ]
  },
  {
    id: 'W-06', actor: 'WORKER', section: S.worker,
    title: '처리 결과 등록', designName: '작업 일지',
    img: '../../docs/img/pc/W-06.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '이력 축적의 실질 — 바쁜 현장에서 몇 초 안에 끝나면서도 내용이 남아야 한다.',
    fr: ['FR-203', 'FR-205'], policies: [],
    flow: { from: 'W-05 내 작업 · W-03 민원 상세', to: ['W-05 내 작업 (완료)', 'E-04 반납 확인'] },
    db: 'complaint UPDATE(조치 결과 · 완료 시각) + history(COMPLETE)',
    notes: [
      { kind: 'rule', rect: [17.5, 23.6, 47.2, 5.8],
        t: '정형 조치 선택지',
        d: '자유 서술만 요구하면 현장에서는 "찍고 넘기기"가 된다. 탭 한 번으로 필수를 채우되 내용은 남는 절충이다.' },
      { kind: 'ui', rect: [17.5, 35.2, 47.2, 10.3],
        t: '메모 (선택)',
        d: '저장할 때 `선택지 — 메모` 로 합쳐 `resolution_content` 한 필드에 넣는다. ERD·API 는 바뀌지 않는다.' },
      { kind: 'ui', rect: [17.5, 48.7, 47.2, 9.3],
        t: '조치 사진 (선택)',
        d: '개별 제거가 가능하다. 프로토타입은 파일명만 저장하고, 실제 구현은 사전 업로드된 URL 을 받는다.' },
      { kind: 'api', rect: [17.5, 62, 47.2, 8.6],
        t: '작업 완료',
        api: 'POST /complaints/{id}/completion',
        d: '처리 시간은 입력받지 않고 접수 → 완료 간격으로 산출한다. 조치 내용이 비면 `400 RESOLUTION_REQUIRED`.' },
      { kind: 'ui', rect: [67.8, 16.5, 22.2, 14.7],
        t: '원문 병기',
        d: '신고 내용·위치·사진·이력을 보조 열에 함께 둔다. 결과를 쓰려고 화면을 나갈 필요가 없다.' }
    ]
  },

  /* ── 관리소장 (ADMIN) ────────────────────────────────── */
  {
    id: 'A-01', actor: 'ADMIN', section: S.admin,
    title: '운영 현황', designName: '현황판',
    img: '../../docs/img/pc/A-01.png', imgSize: [2880, 1760], crop: 0.727,
    lead: '개입이 필요한 것과 지금 누가 무엇을 하는지 — 스크롤 없이 한 화면에서 판단한다.',
    fr: ['FR-301', 'FR-302', 'FR-303'], policies: ['P-02'],
    flow: { from: 'W-01 직원 로그인', to: ['A-02 전체 민원 (조건 링크)', 'A-03 민원 상세 (행 클릭)', 'A-04 배정 (행의 배정)'] },
    db: '상태별 count + 지연 목록 + 작업자별 보유·현재 작업을 한 번의 호출로 구성',
    notes: [
      { kind: 'ui', rect: [17.5, 6.3, 19.2, 2.2],
        t: '사실 문장 + 조건 링크',
        d: '균등한 수치 타일 네 개를 없앴다. 미배정·작업 중·오늘 완료는 문장 안의 숫자이고, 누르면 그 조건의 A-02 가 열린다.' },
      { kind: 'rule', rect: [17.5, 12.9, 80.6, 3.7],
        t: '지연 민원',
        d: '한 화면의 큰 숫자는 하나뿐 — 개입 기준인 지연 건수다 (P-02). 나머지 지표는 위계를 낮췄다.' },
      { kind: 'api', rect: [17.5, 18, 80.6, 22],
        t: '현황 조회',
        api: 'GET /dashboard',
        d: '한 화면을 한 번의 호출로 채운다. 정식 지연 조회는 A-02 의 `지연만` 조건이 담당하고 여기는 상위 6건 요약이다.' },
      { kind: 'ui', rect: [82.6, 18.1, 9.2, 7.2],
        t: '인라인 배정',
        d: '행에서 바로 배정 대화상자를 연다. 개입 동선을 상세 화면 경유에서 한 단계 줄였다.' },
      { kind: 'ui', rect: [17.5, 48.7, 80.6, 22],
        t: '기사 현황',
        api: 'workers[].current[]',
        d: '보유 건수만으로는 누가 무엇을 하는지 알 수 없다. 현재 맡은 민원·위치·맡은 지를 함께 주고 활동 중인 기사를 위에 둔다.' }
    ]
  },
  {
    id: 'A-02', actor: 'ADMIN', section: S.admin,
    title: '전체 민원', designName: '민원 대장',
    img: '../../docs/img/pc/A-02.png', imgSize: [2880, 2310], crop: 0.554,
    lead: '조건을 걸어 찾는 대장 — 무엇이 걸려 있는지 화면이 항상 먼저 말한다.',
    fr: ['FR-301', 'FR-302'], policies: ['P-02'],
    flow: { from: 'A-01 운영 현황 · A-06 통계 (막대 클릭)', to: ['A-03 민원 상세 (행 클릭)'] },
    db: '상태·설비·층·긴급도·담당자·기간·지연·검색어 조합 조회 — 쓰기 없음',
    notes: [
      { kind: 'ui', rect: [17.5, 8.8, 19.8, 3.6],
        t: '검색',
        d: '제목 또는 민원 번호 부분 일치. 버튼과 Enter 둘 다 동작하고, 검색어도 조건 요약에 함께 나열된다.' },
      { kind: 'ui', rect: [38.3, 9.3, 29.1, 2.7],
        t: '상태 · 지연만',
        d: '지연은 상태가 아니라 경과 조건이다. 같은 줄에 두되 세그먼트와 스위치로 층위를 나눴다 (P-02).' },
      { kind: 'ui', rect: [17.5, 13.1, 79.5, 2.7],
        t: '설비 · 층 · 긴급도 · 기간',
        d: 'FR-301 이 요구하는 조건을 모두 제공한다. 기간은 접수 시각 기준이며 명세에 `from`·`to` 를 추가했다.' },
      { kind: 'ui', rect: [15.6, 16.8, 83.4, 4.3],
        t: '조건 요약 · 정렬',
        d: '걸린 조건을 사실로 나열하고 `필터 해제`가 검색어까지 지운다. 모든 조건은 URL 쿼리와 동기화되어 새로고침에도 살아 있다.' },
      { kind: 'api', rect: [15.6, 21.1, 83.4, 31.1],
        t: '전체 민원 조회',
        api: 'GET /complaints',
        d: '열 순서는 상태 → 긴급도 → 위치 → 요청 내용 → 설비 → 담당 기사 → 접수. 관리자는 전 상태를 보므로 상태 열을 유지한다.' }
    ]
  },
  {
    id: 'A-03', actor: 'ADMIN', section: S.admin,
    title: '민원 상세 (관리)', designName: '결정 화면',
    img: '../../docs/img/pc/A-03.png', imgSize: [2880, 1720], crop: 0.744,
    lead: '상태에 따라 할 수 있는 행동만 보이고, 결정에 필요한 근거가 옆에 있다.',
    fr: ['FR-304', 'FR-305', 'FR-306', 'FR-307'], policies: ['D-01'],
    flow: { from: 'A-01 운영 현황 · A-02 전체 민원', to: ['A-04 배정 · 재배정', 'A-05 민원 반려', '배정 회수 확인 (대화상자)'] },
    db: 'complaint UPDATE(담당 또는 분류) + complaint_history INSERT',
    notes: [
      { kind: 'ui', rect: [74.3, 22.7, 15.7, 4.8],
        t: '상태별 행동',
        d: '미배정은 배정·반려, 작업 중은 재배정·회수·반려, 완료와 반려는 행동이 없다. 버튼은 뷰포트가 아니라 제목 블록 우측에 둔다.' },
      { kind: 'ui', rect: [17.5, 24.8, 55.4, 2.6],
        t: '한 줄 메타',
        d: '위치·설비·긴급도·경과·담당·번호를 한 줄로. USER·WORKER 상세와 같은 위계 규칙을 쓴다.' },
      { kind: 'api', rect: [17.5, 59.8, 47.2, 7.5],
        t: '같은 위치 민원',
        api: 'GET /complaints/{id}/related',
        d: '중복 판단의 근거다. 등록 시 자동 탐지는 하지 않고 사후 반려 + 원본 연결로 처리한다 (D-01).' },
      { kind: 'ui', rect: [67.8, 55.2, 22.2, 9.3],
        t: '담당 기사',
        d: '담당 설비·보유 건수·맡은 지를 함께 둔다. 회수나 재배정이 맞는 판단인지 여기서 가늠한다.' },
      { kind: 'ui', rect: [17.5, 71.3, 47.2, 3],
        t: '분류 정보 수정',
        api: 'PATCH /complaints/{id}/classification',
        d: '상태와 무관하게 가능하지만 보조 행동이므로 접어 둔다. 신고 원문은 대상이 아니고, 이력에는 바뀐 항목을 한글 라벨로 남긴다.' }
    ]
  },
  {
    id: 'A-04', actor: 'ADMIN', section: S.admin,
    title: '배정 · 재배정', designName: '담당 기사 선택',
    img: '../../docs/img/pc/A-04.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '선점이 기본이고 배정은 예외 경로 — 그 예외가 성립하려면 고를 근거가 화면에 있어야 한다.',
    fr: ['FR-304', 'FR-305'], policies: [],
    flow: { from: 'A-01 운영 현황 · A-03 민원 상세', to: ['A-03 민원 상세 (배정 후)'] },
    db: 'complaint UPDATE(담당 · 배정 시각) + history(ASSIGN|REASSIGN)',
    notes: [
      { kind: 'ui', rect: [34.8, 13.4, 30.4, 10.4],
        t: '제목이 갈린다',
        d: '미배정이면 `담당 기사 배정`, 작업 중이면 `담당 기사 재배정`. 같은 엔드포인트지만 관리소장이 하는 일은 다르다.' },
      { kind: 'rule', rect: [36.4, 26.6, 27.2, 8.9],
        t: '설비 일치 표식',
        d: '이 민원의 설비를 담당하는 기사에 `●` 를 붙인다. 선점과 달리 배정에는 카테고리 제약이 없지만, 기본 선택지는 담당자여야 한다.' },
      { kind: 'ui', rect: [36.3, 26.4, 27.4, 44.9],
        t: '정렬 기준',
        api: 'GET /workers',
        d: '설비 일치 → 보유 적은 순 → 이름순. 재배정이면 현재 담당은 `현재 담당` 으로 표시하고 선택할 수 없다.' },
      { kind: 'api', rect: [34.8, 77.9, 30.4, 8.7],
        t: '배정',
        api: 'POST /complaints/{id}/assignment',
        d: '배정할 수 없는 상태면 `409` 를 대화상자 안에 문장으로 돌려주고, 닫을 때 상세를 다시 읽는다.' }
    ]
  },
  {
    id: 'A-05', actor: 'ADMIN', section: S.admin,
    title: '민원 반려', designName: '반려 사유 등록',
    img: '../../docs/img/pc/A-05.png', imgSize: [2880, 1640], crop: 0.78,
    lead: '처리하지 않기로 한 이유가 신고자에게 그대로 간다 — 그래서 근거를 옆에 두고 쓴다.',
    fr: ['FR-308'], policies: ['D-01'],
    flow: { from: 'A-03 민원 상세', to: ['A-03 민원 상세 (반려 후)'] },
    db: 'complaint UPDATE(rejection_*) + history(REJECT) INSERT',
    notes: [
      { kind: 'ui', rect: [17.5, 18.9, 22.2, 38.2],
        t: '판단 근거',
        d: '신고 원문·첨부 사진·같은 위치에서 진행 중인 민원을 왼쪽에 둔다. 제목과 번호만으로는 중복인지 알 수 없다.' },
      { kind: 'ui', rect: [42.8, 21.9, 47.2, 3.8],
        t: '반려 사유',
        d: '중복 민원 · 관리 대상 외 · 내용 확인 불가 세 가지. 라벨은 질문형이 아니라 용어형으로 쓴다.' },
      { kind: 'ui', rect: [42.8, 30.6, 47.2, 13.4],
        t: '신고자에게 보일 설명',
        d: '이 문장이 U-05 의 반려 사유 섹션에 그대로 노출된다. 비어 있으면 항목 아래 오류를 띄운다.' },
      { kind: 'rule', rect: [42.8, 52.9, 47.2, 7.9],
        t: '원본 민원 (D-01)',
        d: '기본 후보는 같은 층·공간·설비의 미종료 민원, 검색은 보조다. 원본이 없으면 `400 ORIGINAL_REQUIRED`.' },
      { kind: 'api', rect: [42.8, 74.2, 47.2, 3.8],
        t: '반려',
        api: 'POST /complaints/{id}/rejection',
        d: '주 행동은 폼 하단에 경고색으로. `RECEIVED` 와 `IN_PROGRESS` 에서만 가능하다.' }
    ]
  },
  {
    id: 'A-06', actor: 'ADMIN', section: S.admin,
    title: '민원 통계', designName: '정비 근거 자료',
    img: '../../docs/img/pc/A-06.png', imgSize: [2880, 1600], crop: 0.8,
    lead: '이력 축적이 돌아오는 자리 — 기간을 고르고 숫자를 읽고, 눌러서 대장으로 내려간다.',
    fr: ['FR-309'], policies: [],
    flow: { from: 'W-01 직원 로그인 (레일 메뉴)', to: ['A-02 전체 민원 (막대 클릭)'] },
    db: 'history 의 REGISTER ~ COMPLETE 간격으로 평균 처리 시간 산출',
    notes: [
      { kind: 'ui', rect: [19.5, 10.5, 15.3, 3.9],
        t: '기간 프리셋',
        d: '전체 기간 · 이번 달 · 최근 3개월 셋이면 한 줄에 들어간다. `전체 기간` 이 곧 해제 버튼이다.' },
      { kind: 'ui', rect: [92.9, 11.3, 5.1, 2.4],
        t: '적용 중인 기간',
        d: '지금 보고 있는 숫자가 어느 기간의 것인지 항상 우측에 적어 둔다.' },
      { kind: 'api', rect: [17.5, 19.2, 72.5, 4.9],
        t: '통계 조회',
        api: 'GET /statistics',
        d: '큰 숫자는 총 접수 하나. 완료·반려·처리 중은 같은 문장 안의 숫자로 내려 위계를 만든다.' },
      { kind: 'ui', rect: [17.5, 37, 34.7, 25.1],
        t: '막대 → 대장',
        d: '설비 막대를 누르면 그 조건과 기간을 그대로 들고 A-02 로 내려간다. 수치에서 개별 민원까지 한 번에 닿는다.' },
      { kind: 'ui', rect: [81.5, 32.3, 8.5, 3.9],
        t: '층 순서 토글',
        d: '건수순과 건물 순서(지하 2층 → 8층)를 바꿔 본다. 동률일 때 순서가 임의로 보이지 않게 한다.' }
    ]
  },

  /* ── 예외 상태 ───────────────────────────────────────── */
  {
    id: 'E-01', actor: 'WORKER', section: S.except,
    title: '선점 충돌', designName: '동시 선점 경합 (409)',
    img: '../../docs/img/pc/E-01.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '두 기사가 같은 민원을 거의 동시에 눌렀을 때 — 먼저 도달한 요청만 성공한다.',
    fr: ['FR-202'], policies: [],
    flow: { from: 'W-03 민원 상세 (맡기)', to: ['W-02 미배정 민원 (목록 새로 읽기)'] },
    db: 'status = RECEIVED 조건부 UPDATE — 조건 불일치 시 전이 없음',
    notes: [
      { kind: 'ui', rect: [34.8, 40.4, 30.4, 10.4],
        t: '무슨 일이 일어났는지',
        d: '실패가 아니라 남이 먼저 가져갔다는 사실을 말한다. 기사의 잘못이 아니므로 사과나 오류 코드를 쓰지 않는다.' },
      { kind: 'api', rect: [34.8, 50.9, 30.4, 8.7],
        t: '목록으로',
        api: '409 ALREADY_CLAIMED',
        d: '되돌릴 수 있는 선택지를 주지 않는다. 이미 남의 작업이므로 목록을 새로 읽는 것 외에 할 일이 없다.' },
      { kind: 'rule', rect: [34.7, 40.3, 30.6, 19.4],
        t: '선점 경합',
        d: '낙관적 잠금 — 상태가 `RECEIVED` 일 때만 전이가 일어나고, 나머지 요청은 전부 409 를 받는다 (9.3).' },
      { kind: 'ui', rect: [83.1, 29.5, 6.9, 5.8],
        t: '이 버튼에서',
        d: 'Esc 나 배경 클릭도 같은 곳으로 보낸다. 닫았을 때 이미 사라진 작업의 상세에 남아 있지 않게 한다.' }
    ]
  },
  {
    id: 'E-02', actor: 'USER', section: S.except,
    title: '배정 후 수정·취소 제한', designName: '수정 불가 상태',
    img: '../../docs/img/pc/E-02.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '별도 오류 화면이 아니라 상태 그 자체 — 배정되는 순간 두 버튼이 사라진다.',
    fr: ['FR-103', 'FR-104'], policies: [],
    flow: { from: 'U-05 민원 상세 (작업 중 상태)', to: ['(관리실 전화 안내)'] },
    db: 'status != RECEIVED 이면 수정·취소 경로 자체가 닫힌다',
    notes: [
      { kind: 'ui', rect: [12.5, 18.9, 75, 4.9],
        t: '작업 중',
        d: '누가 맡고 있는지를 이름으로 말한다. 기다리라는 말보다 진행 중이라는 사실이 신고자에게 쓸모 있다.' },
      { kind: 'ui', rect: [12.5, 35.3, 75, 3],
        t: '버튼이 없는 자리',
        d: '수정·취소 버튼을 비활성으로 남기지 않고 아예 걷어낸다. 누를 수 없는 것을 보여주지 않는 편이 낫다.' },
      { kind: 'rule', rect: [12.5, 69.6, 43.2, 3],
        t: '왜 막는가',
        d: '작업이 시작된 뒤 원문이 바뀌면 기사가 본 지시와 남는 기록이 어긋난다. 추가 전달은 관리실 전화로 안내한다.' },
      { kind: 'api', rect: [58.7, 56.6, 28.8, 12.8],
        t: '상태의 근거',
        api: 'GET /complaints/{id}',
        d: '언제 누구에게 배정됐는지가 이력에 남아 있어, 신고자가 화면만 보고도 납득할 수 있다.' }
    ]
  },
  {
    id: 'E-03', actor: 'USER', section: S.except,
    title: '민원 취소 확인', designName: '접수 철회 확인',
    img: '../../docs/img/pc/E-03.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '되돌릴 수 없는 행위 — 비밀번호 확인에 더해 대상을 보여주고 한 번 더 묻는다.',
    fr: ['FR-104'], policies: [],
    flow: { from: 'U-06 본인 확인', to: ['U-05 민원 상세 (취소됨)'] },
    db: 'complaint UPDATE(status=CANCELED) + history(CANCEL) — 삭제 아님',
    notes: [
      { kind: 'ui', rect: [34.8, 34.5, 30.4, 10.4],
        t: '되돌릴 수 없다',
        d: '다시 접수하려면 새 민원을 등록해야 한다는 사실을 미리 말한다.' },
      { kind: 'ui', rect: [34.8, 45, 30.4, 11.8],
        t: '대상 확인',
        d: '제목·위치·번호를 보여 준다. 여러 건을 조회하다 엉뚱한 민원을 취소하는 일을 막는다.' },
      { kind: 'api', rect: [34.8, 56.8, 30.4, 8.7],
        t: '민원 취소',
        api: 'POST /complaints/{id}/cancel',
        d: 'DELETE 가 아니라 POST 다 — 요청 본문으로 비밀번호를 보내야 하고, 취소가 물리 삭제도 아니기 때문이다 (16.1).' },
      { kind: 'rule', rect: [34.7, 34.4, 30.6, 31.2],
        t: '이력 보존',
        d: '삭제하지 않고 `CANCELED` 상태로 남긴다. 취소된 접수도 통계와 이력의 일부다.' }
    ]
  },
  {
    id: 'E-04', actor: 'WORKER', section: S.except,
    title: '작업 반납 확인', designName: '반납 확인',
    img: '../../docs/img/pc/E-04.png', imgSize: [2880, 1400], crop: 0.914,
    lead: '맡은 것을 되돌려 놓는 유일한 경로 — 기사 간 직접 이관은 만들지 않았다.',
    fr: ['FR-203'], policies: [],
    flow: { from: 'W-06 처리 결과 등록 · W-03 민원 상세', to: ['W-02 미배정 민원'] },
    db: 'complaint UPDATE(담당 해제) + history(RELEASE, note)',
    notes: [
      { kind: 'ui', rect: [34.8, 29.8, 30.4, 13.4],
        t: '무엇이 사라지는가',
        d: '적던 결과가 저장되지 않는다는 것과, 다른 기사가 맡을 수 있게 된다는 것을 함께 말한다.' },
      { kind: 'ui', rect: [34.8, 43.3, 30.4, 18.2],
        t: '반납 사유 (선택)',
        d: '관리소장이 재배정을 판단할 때 쓰는 근거다. 선택 입력이며 처리 이력의 note 로 남는다.' },
      { kind: 'api', rect: [34.8, 61.5, 30.4, 8.7],
        t: '반납',
        api: 'POST /complaints/{id}/release',
        d: '`IN_PROGRESS → RECEIVED`. 본인이 담당 중이 아니면 `409 NOT_ASSIGNEE`.' },
      { kind: 'rule', rect: [34.7, 29.7, 30.6, 40.6],
        t: '"취소"라 쓰지 않는다',
        d: '신고자의 민원 취소(`CANCELED`)와 혼동되기 때문이다. 기사의 행위는 기술서 용어대로 반납이다.' }
    ]
  }
]

/* ── 액터별 화면 전이도 ──────────────────────────────────
   col/row 는 격자 좌표(1부터). edges 는 노드 사이 화살표.
   kind: main(주 경로) | alt(대체·복귀) | err(예외)                    */

module.exports.FLOWS = [
  {
    id: 'FLOW-USER', actor: 'USER', section: S.user,
    title: '건물 사용자 흐름', designName: 'USER 화면 전이도',
    lead: '로그인 없이 시작해 민원 번호 하나로 접수·조회·수정·취소까지 닿는다.',
    fr: ['FR-101', 'FR-102', 'FR-103', 'FR-104'],
    cols: 5,
    nodes: [
      { id: 'U-01', title: '사용자 홈', col: 1, row: 2 },
      { id: 'U-02', title: '민원 등록', col: 2, row: 1 },
      { id: 'U-04', title: '민원 조회', col: 2, row: 3 },
      { id: 'U-03', title: '접수 완료', col: 3, row: 1 },
      { id: 'U-05', title: '민원 상세', col: 3, row: 3, hub: true },
      { id: 'U-06', title: '본인 확인', col: 4, row: 2 },
      { id: 'U-07', title: '민원 수정', col: 5, row: 1 },
      { id: 'E-03', title: '취소 확인', col: 5, row: 3, kind: 'err' }
    ],
    edges: [
      { from: 'U-01', to: 'U-02', label: '민원 등록하기' },
      { from: 'U-01', to: 'U-04', label: '번호 조회' },
      { from: 'U-02', to: 'U-03', label: '접수', lt: 0.5 },
      { from: 'U-03', to: 'U-05', label: '처리 상황' },
      { from: 'U-04', to: 'U-05', label: '조회' },
      { from: 'U-05', to: 'U-06', label: '수정 · 취소' },
      { from: 'U-06', to: 'U-07', label: '확인' },
      { from: 'U-06', to: 'E-03', label: '확인', kind: 'err' },
      { from: 'U-07', to: 'U-05', label: '저장', kind: 'alt', route: 'top' },
      { from: 'E-03', to: 'U-05', label: '취소 확정', kind: 'alt', route: 'bottom' }
    ],
    notes: [
      '민원 번호가 유일한 열쇠다 — 비밀번호는 수정·취소에서만 쓴다.',
      'U-05 가 허브다. 접수·조회 어느 쪽에서 오든 여기로 모이고, 변경 행위는 전부 여기서 출발한다.',
      '배정된 뒤에는 U-05 에서 수정·취소 버튼이 사라진다 (E-02) — 별도 오류 화면을 만들지 않았다.'
    ]
  },
  {
    id: 'FLOW-WORKER', actor: 'WORKER', section: S.worker,
    title: '시설기사 흐름', designName: 'WORKER 화면 전이도',
    lead: '고르고 · 현장에 가고 · 결과를 남긴다. 세 동작이 끊기지 않게 배치했다.',
    fr: ['FR-201', 'FR-202', 'FR-203', 'FR-204', 'FR-205', 'FR-206'],
    cols: 5,
    nodes: [
      { id: 'W-01', title: '직원 로그인', col: 1, row: 2 },
      { id: 'W-02', title: '미배정 민원', col: 2, row: 2, hub: true },
      { id: 'E-01', title: '선점 충돌', col: 2, row: 3, kind: 'err' },
      { id: 'W-03', title: '민원 상세', col: 3, row: 2, hub: true },
      { id: 'W-04', title: '담당 외 확인', col: 3, row: 3 },
      { id: 'W-05', title: '내 작업', col: 4, row: 2 },
      { id: 'W-06', title: '처리 결과 등록', col: 5, row: 1 },
      { id: 'E-04', title: '반납 확인', col: 5, row: 3, kind: 'err' }
    ],
    edges: [
      { from: 'W-01', to: 'W-02', label: '로그인' },
      { from: 'W-02', to: 'W-03', label: '행 클릭', lt: 0.5 },
      { from: 'W-03', to: 'W-04', label: '담당 외' },
      { from: 'W-03', to: 'E-01', label: '409', kind: 'err' },
      { from: 'W-03', to: 'W-05', label: '맡기', dy: -7, lt: 0.32 },
      { from: 'W-04', to: 'W-05', label: '맡기' },
      { from: 'E-01', to: 'W-02', label: '목록으로', kind: 'alt' },
      { from: 'W-05', to: 'W-03', label: '지시서', kind: 'alt', dy: 7, lt: 0.68 },
      { from: 'W-05', to: 'W-06', label: '결과 남기기' },
      { from: 'W-06', to: 'E-04', label: '반납', kind: 'err' },
      { from: 'W-06', to: 'W-05', label: '작업 완료', kind: 'alt', route: 'top' },
      { from: 'E-04', to: 'W-02', label: '반납 확정', kind: 'alt', route: 'bottom' }
    ],
    notes: [
      'W-03 은 상태에 따라 세 역할을 한다 — 미배정은 선점 판단, 작업 중은 지시서, 완료는 기록 열람.',
      '반납은 W-06 과 W-03 두 곳에서 열리지만 도착지는 하나다 — 미배정 목록으로 돌아간다.',
      '기사 간 직접 이관 경로는 만들지 않았다. 반납 후 재선점, 또는 관리소장 재배정만 존재한다.'
    ]
  },
  {
    id: 'FLOW-ADMIN', actor: 'ADMIN', section: S.admin,
    title: '관리소장 흐름', designName: 'ADMIN 화면 전이도',
    lead: '개입 시점을 알아채고 · 근거를 보고 결정하고 · 결정이 이력에 남는다.',
    fr: ['FR-301', 'FR-302', 'FR-303', 'FR-304', 'FR-305', 'FR-306', 'FR-307', 'FR-308', 'FR-309'],
    cols: 5,
    nodes: [
      { id: 'W-01', title: '직원 로그인', col: 1, row: 2 },
      { id: 'A-01', title: '운영 현황', col: 2, row: 1, hub: true },
      { id: 'A-06', title: '민원 통계', col: 2, row: 3 },
      { id: 'A-02', title: '전체 민원', col: 3, row: 2, hub: true },
      { id: 'A-03', title: '민원 상세', col: 4, row: 2, hub: true },
      { id: 'A-04', title: '배정 · 재배정', col: 5, row: 1 },
      { id: 'A-05', title: '민원 반려', col: 5, row: 3 }
    ],
    edges: [
      { from: 'W-01', to: 'A-01', label: '로그인' },
      { from: 'A-01', to: 'A-02', label: '조건 링크' },
      { from: 'A-01', to: 'A-04', label: '행의 배정', lt: 0.5 },
      { from: 'A-06', to: 'A-02', label: '막대 클릭', kind: 'alt' },
      { from: 'A-02', to: 'A-03', label: '행 클릭', lt: 0.5 },
      { from: 'A-03', to: 'A-04', label: '배정 · 재배정', dy: -6 },
      { from: 'A-03', to: 'A-05', label: '반려', dy: -6 },
      { from: 'A-04', to: 'A-03', label: '배정 완료', kind: 'alt', dy: 6 },
      { from: 'A-05', to: 'A-03', label: '반려 완료', kind: 'alt', dy: 6 }
    ],
    notes: [
      'A-01 은 요약이고 정식 조회는 A-02 다 — 지연 조회가 두 곳에 혼재하지 않게 역할을 나눴다.',
      '배정 회수는 별도 화면이 아니라 A-03 안의 확인 대화상자다. 사유는 선택 입력으로 이력에 남는다.',
      'A-06 → A-02 → A-03 이 "수치에서 개별 민원까지" 내려가는 경로다. 이력 축적이 정비 근거로 돌아온다.'
    ]
  }
]

/* ── API 커버리지 매트릭스 (부록) ────────────────────── */

module.exports.MATRIX = {
  id: 'APPX-API', section: '부록 — API 커버리지',
  title: 'API 커버리지 매트릭스', designName: '엔드포인트 × 사용 화면',
  lead: 'openapi.yaml 의 전 엔드포인트가 어느 화면에서 쓰이는지, 쓰이지 않는 것은 무엇인지 드러낸다.',
  rows: [
    { m: 'POST', p: '/complaints', op: 'createComplaint', fr: 'FR-101', screens: ['U-02'] },
    { m: 'GET', p: '/complaints', op: 'listComplaints', fr: 'FR-201·204·301·302', screens: ['W-02', 'W-05', 'A-01', 'A-02', 'A-05'] },
    { m: 'GET', p: '/complaints/{id}', op: 'getComplaint', fr: 'FR-102·206', screens: ['U-03', 'U-05', 'U-07', 'W-03', 'W-06', 'A-03', 'A-05', 'E-02'] },
    { m: 'PATCH', p: '/complaints/{id}', op: 'updateComplaint', fr: 'FR-103', screens: ['U-07'] },
    { m: 'POST', p: '/complaints/{id}/password-verification', op: 'verifyComplaintPassword', fr: 'FR-103·104', screens: ['U-06'] },
    { m: 'POST', p: '/complaints/{id}/cancel', op: 'cancelComplaint', fr: 'FR-104', screens: ['E-03'] },
    { m: 'POST', p: '/auth/login', op: 'login', fr: 'FR-001', screens: ['W-01'] },
    { m: 'GET', p: '/complaints/{id}/related', op: 'getRelatedComplaints', fr: 'FR-206', screens: ['W-03', 'A-03', 'A-05'] },
    { m: 'POST', p: '/complaints/{id}/claim', op: 'claimComplaint', fr: 'FR-202', screens: ['W-03', 'W-04', 'E-01'] },
    { m: 'POST', p: '/complaints/{id}/release', op: 'releaseComplaint', fr: 'FR-203', screens: ['E-04'] },
    { m: 'POST', p: '/complaints/{id}/completion', op: 'completeComplaint', fr: 'FR-205', screens: ['W-06'] },
    { m: 'GET', p: '/dashboard', op: 'getDashboard', fr: 'FR-301·302·303', screens: ['A-01'] },
    { m: 'GET', p: '/workers', op: 'listWorkers', fr: 'FR-303', screens: ['A-02', 'A-03', 'A-04'] },
    { m: 'POST', p: '/complaints/{id}/assignment', op: 'assignComplaint', fr: 'FR-304·305', screens: ['A-04'] },
    { m: 'DELETE', p: '/complaints/{id}/assignment', op: 'revokeAssignment', fr: 'FR-306', screens: ['A-03'] },
    { m: 'PATCH', p: '/complaints/{id}/classification', op: 'updateClassification', fr: 'FR-307', screens: ['A-03'] },
    { m: 'POST', p: '/complaints/{id}/rejection', op: 'rejectComplaint', fr: 'FR-308', screens: ['A-05'] },
    { m: 'GET', p: '/statistics', op: 'getStatistics', fr: 'FR-309', screens: ['A-06'] },
    { m: 'GET', p: '/categories', op: 'listCategories', fr: '기준 데이터', screens: [] }
  ],
  gaps: [
    { t: '화면에서 호출하지 않는 엔드포인트', d: '`GET /categories` 하나. 프로토타입은 설비 목록을 `constants.js` 상수로 들고 있다. 실제 구현에서는 U-02·U-07 의 설비 선택지와 A-02·A-03 의 설비 필터를 이 엔드포인트로 채운다.' },
    { t: 'API 를 부르지 않는 조작', d: 'W-02 · A-02 의 정렬 선택, A-06 의 층 순서 토글, W-05 의 탭 전환은 표시 계층에서만 동작한다. 서버 정렬과 기본 질의를 바꾸지 않겠다는 결정의 결과다.' },
    { t: '한 엔드포인트가 여러 화면', d: '`GET /complaints` 가 미배정 목록 · 내 작업 · 전체 민원 · 지연 민원 네 화면을 담당한다. 화면별로 질의 조건만 다르다 (15.2).' },
    { t: '상세 조회의 짝', d: '`GET /complaints/{id}` 와 `/related` 는 W-03 · A-03 · A-05 에서 항상 함께 호출된다 — 중복 판단에 같은 위치 민원이 필요하기 때문이다.' }
  ]
}
