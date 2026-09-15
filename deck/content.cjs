// 화면별 UI 흐름 슬라이드 데이터.
// anchor: 화면 이미지 세로 위치(0=상단, 1=하단) — 주석 카드가 그 높이에 맞춰 배치된다.
// kind: api(빨강) | ui(초록) | rule(호박)

module.exports.SCREENS = [
  { actor: 'USER', id: 'U-01', name: '사용자 홈', img: 'U-01.png',
    lead: '로그인 없이 시작한다. 가입 절차 자체가 새로운 접수 장벽이 되기 때문이다.',
    notes: [
      { a: 0.30, kind: 'ui', t: '신고 진입', d: '가입·로그인 없이 바로 신고. C-1(접수 채널이 사람에 의존) 해소의 출발점' },
      { a: 0.55, kind: 'api', t: 'GET /complaints/{id}', d: '민원 번호만으로 접수 내역 조회. 비밀번호를 요구하지 않는다' },
      { a: 0.93, kind: 'ui', t: '직원 진입점 분리', d: '하단 링크로 W-01 직원 로그인 이동. 신고자 동선과 섞이지 않는다' }
    ],
    db: '이 화면은 조회만 수행하며 쓰기가 없다.' },

  { actor: 'USER', id: 'U-02', name: '민원 등록', img: 'U-02.png',
    lead: '위치·카테고리·우선순위가 그대로 complaint 의 분류 컬럼이 된다.',
    notes: [
      { a: 0.14, kind: 'api', t: 'GET /categories', d: '설비 카테고리 선택지를 채운다. 비인증 호출 가능' },
      { a: 0.33, kind: 'ui', t: '분류 정보 입력', d: 'floor_no · space · category_code · priority — 오분류 시 관리소장이 정정(FR-307)' },
      { a: 0.82, kind: 'rule', t: '4자리 비밀번호', d: '인증 수단이 아니라 수정·취소 시 본인 확인 수단. 해시로 저장한다' },
      { a: 0.95, kind: 'api', t: 'POST /complaints', d: '201 Created + 민원 번호 발급. 400 INVALID_PAYLOAD' }
    ],
    db: 'complaint INSERT (password_hash) · complaint_photo INSERT (type=REPORT) · complaint_history INSERT (action=REGISTER)' },

  { actor: 'USER', id: 'U-03', name: '접수 완료', img: 'U-03.png',
    lead: '발급된 민원 번호가 이후 조회·수정·취소의 유일한 열쇠다.',
    notes: [
      { a: 0.28, kind: 'ui', t: '접수 확인', d: '직전 POST 응답을 표시한다. 별도 조회를 하지 않는다' },
      { a: 0.46, kind: 'rule', t: 'M-YYMMDD-XXXXXX', d: '순차 증가값이 아닌 비순차 식별자. 열람이 공개이므로 번호 추측을 막는다' },
      { a: 0.62, kind: 'ui', t: '번호 보관 안내', d: '개인 정보를 수집하지 않으므로 번호를 잃으면 조회 경로가 없다' }
    ],
    db: '쓰기 없음.' },

  { actor: 'USER', id: 'U-04', name: '민원 조회', img: 'U-04.png',
    lead: '조회 단계에서 본인 확인을 요구하지 않는다. 확인하려는 사람에게 다시 장벽이 되기 때문이다.',
    notes: [
      { a: 0.30, kind: 'api', t: 'GET /complaints/{id}', d: '단건 조회는 공개. 404 COMPLAINT_NOT_FOUND' },
      { a: 0.52, kind: 'rule', t: '목록은 직원 전용', d: 'GET /complaints(목록)는 ADMIN·WORKER만. 신고자는 단건만 볼 수 있다' }
    ],
    db: 'complaint SELECT · complaint_history SELECT' },

  { actor: 'USER', id: 'U-05', name: '민원 상세', img: 'U-05.png',
    lead: '처리 이력 타임라인이 complaint_history 를 그대로 렌더한다.',
    notes: [
      { a: 0.10, kind: 'ui', t: '상태 뱃지', d: 'complaint.status — RECEIVED / IN_PROGRESS / COMPLETED / REJECTED / CANCELED' },
      { a: 0.30, kind: 'api', t: 'GET /complaints/{id}', d: '상태·담당자·조치 결과·이력을 한 번에 반환' },
      { a: 0.66, kind: 'ui', t: '처리 이력', d: 'complaint_history 를 시간순으로 렌더. 이 서비스의 핵심 가치(이력 축적)' },
      { a: 0.92, kind: 'api', t: 'POST .../password-verification', d: '수정·취소 진입 전 선행 검증. 401 / 409 를 폼 작성 전에 알린다' }
    ],
    db: 'SELECT 만 수행.' },

  { actor: 'USER', id: 'U-07', name: '본인 확인 → 민원 수정', img: 'U-07.png', pair: 'U-06.png',
    lead: '배정 전(RECEIVED)에만 수정할 수 있다. 신고 원문은 신고자만 고칠 수 있다.',
    notes: [
      { a: 0.18, kind: 'rule', t: '본인 확인 완료', d: '선행 검증을 통과한 상태. 수정 폼에서 비밀번호를 다시 묻지 않는다' },
      { a: 0.55, kind: 'ui', t: '수정 가능 범위', d: '제목·내용·사진·위치·카테고리·우선순위 전부. 관리소장은 분류 정보만 수정 가능' },
      { a: 0.95, kind: 'api', t: 'PATCH /complaints/{id}', d: 'body 에 password 포함. 409 NOT_EDITABLE(배정 후)' }
    ],
    db: 'complaint UPDATE · complaint_history INSERT (action=UPDATE, to_status=NULL — 상태 전이 아님)' },

  { actor: 'WORKER', id: 'W-01', name: '직원 로그인', img: 'W-01.png',
    lead: 'ADMIN 과 WORKER 가 같은 화면을 쓰고, 인증 후 역할로 갈린다.',
    notes: [
      { a: 0.50, kind: 'api', t: 'POST /auth/login', d: '사번·비밀번호 → 역할과 담당 카테고리 반환. 401 LOGIN_FAILED' },
      { a: 0.70, kind: 'ui', t: '역할 분기', d: 'WORKER → W-02 미배정 민원 / ADMIN → A-01 운영 대시보드' }
    ],
    db: 'user_account SELECT · worker_category SELECT (담당 카테고리)' },

  { actor: 'WORKER', id: 'W-02', name: '미배정 민원', img: 'W-02.png',
    lead: '선점(Pull) 방식의 출발점. 누구에게 배정할지 판단하는 부담 자체를 없앴다.',
    notes: [
      { a: 0.13, kind: 'ui', t: '카테고리 필터', d: 'worker_category 로 본인 담당 여부를 구분 표시. 담당 외도 선점 가능' },
      { a: 0.27, kind: 'api', t: 'GET /complaints?status=RECEIVED', d: '우선순위 → 경과 시간 순 정렬' },
      { a: 0.45, kind: 'rule', t: '지연 뱃지', d: '파생값. 긴급 1시간 / 보통 6시간 / 낮음 24시간 초과 시 표시' }
    ],
    db: 'idx_complaint_unassigned (status, priority, created_at) 로 정렬 조회' },

  { actor: 'WORKER', id: 'W-03', name: '민원 상세 · 선점', img: 'W-03.png', pair: 'W-04.png',
    lead: '현장에 나가기 전에 중복 여부를 판단할 재료를 제공한다. (AS-04)',
    notes: [
      { a: 0.15, kind: 'api', t: 'GET /complaints/{id}', d: '신고 내용·위치·사진·이력 조회' },
      { a: 0.52, kind: 'api', t: 'GET /complaints/{id}/related', d: '동일 층·공간·카테고리의 미종료 민원. 자동 판정이 아니라 판단 재료' },
      { a: 0.72, kind: 'rule', t: 'P-01 담당 외 경고', d: '선점은 허용하고 경고만 띄운다. 오분류 민원이 방치되는 것을 막기 위함' },
      { a: 0.95, kind: 'api', t: 'POST /complaints/{id}/claim', d: '409 ALREADY_CLAIMED — 두 작업자가 동시에 선점할 때 하나만 성공' }
    ],
    db: 'complaint UPDATE (status, assignee_id, assigned_at) · history INSERT (CLAIM, note=담당 외 카테고리)' },

  { actor: 'WORKER', id: 'W-05', name: '내 작업', img: 'W-05.png',
    lead: '다음 업무를 전화나 현장 방문으로 확인하던 과정이 사라진다. (AS-03)',
    notes: [
      { a: 0.12, kind: 'ui', t: '처리중 / 완료 탭', d: 'status 필터. 완료 탭은 본인의 처리 이력' },
      { a: 0.32, kind: 'api', t: 'GET /complaints?assignee=me', d: 'assignee=me 는 호출한 작업자 본인을 뜻한다' },
      { a: 0.62, kind: 'ui', t: '결과 등록 진입', d: 'W-06 처리 결과 등록으로 이동' }
    ],
    db: 'idx_complaint_assignee (assignee_id, status)' },

  { actor: 'WORKER', id: 'W-06', name: '처리 결과 등록', img: 'W-06.png',
    lead: '신고자 확인 단계를 두지 않으므로 이 등록이 최종 상태다.',
    notes: [
      { a: 0.30, kind: 'ui', t: '조치 내용 필수', d: '400 RESOLUTION_REQUIRED. 이력 축적의 실질 내용이 여기서 생긴다' },
      { a: 0.62, kind: 'ui', t: '소요 시간', d: 'resolution_minutes. 통계의 평균 처리 시간과 별개로 작업자 실측치' },
      { a: 0.85, kind: 'api', t: 'POST /complaints/{id}/completion', d: 'IN_PROGRESS → COMPLETED' },
      { a: 0.96, kind: 'api', t: 'POST /complaints/{id}/release', d: '반납 시 RECEIVED 복귀. 작성 중 결과는 저장하지 않는다' }
    ],
    db: 'complaint UPDATE (status, resolution_content, resolution_minutes, completed_at) · photo INSERT (RESOLUTION) · history INSERT (COMPLETE)' },

  { actor: 'ADMIN', id: 'A-01', name: '운영 대시보드', img: 'A-01.png',
    lead: '개입이 필요한 시점을 판단하는 화면. 강제 배정 경로의 전제 조건이다.',
    notes: [
      { a: 0.10, kind: 'api', t: 'GET /dashboard', d: '집계·지연 목록·작업자 현황을 한 번의 호출로 반환' },
      { a: 0.22, kind: 'ui', t: '상태별 집계', d: '접수됨 / 처리중 / 선점 지연 / 오늘 완료' },
      { a: 0.52, kind: 'rule', t: '개입이 필요한 민원', d: 'P-02 지연 판정 결과. 강제 배정을 언제 쓸지의 기준' },
      { a: 0.83, kind: 'ui', t: '작업자별 보유 현황', d: '보유 건수만 표시. 상태 모델에 ASSIGNED 가 없어 진행/대기 구분은 만들 수 없다' }
    ],
    db: 'complaint GROUP BY status · assignee_id COUNT' },

  { actor: 'ADMIN', id: 'A-02', name: '전체 민원', img: 'A-02.png',
    lead: '목록 엔드포인트 하나가 작업자·관리자 네 화면을 담당한다.',
    notes: [
      { a: 0.18, kind: 'api', t: 'GET /complaints', d: 'status · categoryCode · floorNo · priority · delayed · keyword 조합' },
      { a: 0.42, kind: 'ui', t: '담당자 표시', d: 'assignee_id → user_account.name. 미배정은 공란으로 구분' }
    ],
    db: '질의 조건만 달리해 W-02 · W-05 · A-02 · A-01(지연) 을 모두 처리한다' },

  { actor: 'ADMIN', id: 'A-03', name: '민원 상세 · 관리', img: 'A-03.png',
    lead: '관리소장은 분류 정보만 고칠 수 있다. 신고 원문은 신고자의 진술 기록이다.',
    notes: [
      { a: 0.48, kind: 'api', t: 'PATCH .../classification', d: '위치·카테고리·우선순위만 수정. 상태와 무관하게 가능' },
      { a: 0.66, kind: 'rule', t: '원문 수정 불가', d: '관리자가 신고 내용을 바꿀 수 있으면 이력 기반이라는 전제가 무너진다' },
      { a: 0.86, kind: 'api', t: 'POST / DELETE .../assignment', d: '배정을 하위 리소스로 보고 생성·삭제로 표현. 재배정 / 회수' }
    ],
    db: 'complaint UPDATE (분류 컬럼) · history INSERT (UPDATE_CLASSIFICATION, note=변경 필드)' },

  { actor: 'ADMIN', id: 'A-04', name: '강제 배정', img: 'A-04.png',
    lead: '아무도 선점하지 않은 건을 소장이 직접 배정하는 예외 경로.',
    notes: [
      { a: 0.42, kind: 'api', t: 'GET /workers', d: '작업자별 담당 카테고리와 현재 보유 건수' },
      { a: 0.60, kind: 'ui', t: '쏠림 판단', d: '보유 건수를 보고 고른다. 상한 정책 대신 사람이 판단 (9.3)' },
      { a: 0.93, kind: 'api', t: 'POST .../assignment', d: '404 WORKER_NOT_FOUND / 409 INVALID_STATE' }
    ],
    db: 'complaint UPDATE (assignee_id, assigned_at) · history INSERT (ASSIGN / REASSIGN)' },

  { actor: 'ADMIN', id: 'A-05', name: '민원 반려 · 중복 연결', img: 'A-05.png',
    lead: '중복은 사전 탐지가 아니라 사후 정리로 처리한다. (D-01)',
    notes: [
      { a: 0.22, kind: 'ui', t: '반려 사유 유형', d: 'DUPLICATE / OUT_OF_SCOPE / INVALID' },
      { a: 0.55, kind: 'api', t: 'GET /complaints?keyword=', d: '원본 민원 검색. 제목 또는 민원 번호 부분 일치' },
      { a: 0.93, kind: 'api', t: 'POST .../rejection', d: '중복이면 원본 연결 필수. 400 ORIGINAL_REQUIRED' }
    ],
    db: 'complaint UPDATE (rejection_type, rejection_reason, original_complaint_id — complaint 자기참조)' },

  { actor: 'ADMIN', id: 'A-06', name: '민원 통계', img: 'A-06.png',
    lead: '정기 정비 요청의 수치 근거. AS-01 이 해소되는 지점이다.',
    notes: [
      { a: 0.16, kind: 'api', t: 'GET /statistics?from&to', d: '기간 미지정 시 전체' },
      { a: 0.33, kind: 'ui', t: '평균 처리 시간', d: 'complaint_history 의 REGISTER ~ COMPLETE 간격으로 산출' },
      { a: 0.68, kind: 'ui', t: '카테고리·위치별 분포', d: '자주 고장나는 설비를 수치로 제시. 수기 대장·기억을 대체' }
    ],
    db: 'idx_complaint_stats (category_code, created_at) 로 집계' }
];

module.exports.EXCEPTIONS = [
  { id: 'E-01', name: '선점 충돌', img: 'E-01.png', code: '409 ALREADY_CLAIMED',
    d: '두 작업자가 동시에 선점하면 먼저 도달한 요청만 성공한다. 나머지는 목록으로 되돌린다.' },
  { id: 'E-02', name: '배정 후 수정·취소 제한', img: 'E-02.png', code: '409 NOT_EDITABLE',
    d: '배정 이후에는 신고자가 내용을 바꾸거나 취소할 수 없다. 버튼을 비활성화하고 이유를 함께 보여준다.' },
  { id: 'E-03', name: '민원 취소 확인', img: 'E-03.png', code: 'POST .../cancel',
    d: '되돌릴 수 없는 동작이므로 확인 단계를 둔다. 물리 삭제가 아니라 CANCELED 상태 전환이다.' },
  { id: 'E-04', name: '작업 반납 확인', img: 'E-04.png', code: 'POST .../release',
    d: '작성 중인 처리 결과가 저장되지 않는다는 점과, 다른 작업자가 다시 선점할 수 있다는 점을 알린다.' }
];
