// UI Flow 상세 페이지 데이터.
// rect: 캡처 이미지 기준 [x, y, w, h] (%). kind: api | ui | rule.
// api 필드는 kind 와 무관하게 카드에 모노스페이스 한 줄로 표기된다.
// 설명(d)은 1~2문장으로 짧게 — 설계 근거의 상세는 기술서 본문이 담당한다.

module.exports.PAGES = [
  {
    id: 'W-02',
    actor: 'WORKER',
    actorLabel: '시설기사',
    section: 'UI 흐름 — 시설기사',
    title: '대기 중인 작업',
    designName: '미배정 민원 목록',
    img: '../../docs/img/pc/W-02.png',
    imgSize: [2880, 1400],
    crop: 0.70, // 캡처 하단 빈 영역 제거 (이미지 세로의 70%까지만 표시)
    lead: '선점(Pull) 방식의 출발점 — 접수된 요청이 곧바로 노출되고, 기사가 직접 골라 가져간다.',
    fr: ['FR-201'],
    policies: ['P-01', 'P-02'],
    flow: { from: 'W-01 직원 로그인', to: ['W-03 요청 상세 (행 클릭)', 'W-05 내 작업 (좌측 레일)'] },
    db: 'idx_complaint_unassigned (status, priority, created_at) 로 정렬 조회 — 쓰기 없음',
    notes: [
      { kind: 'ui', rect: [0.7, 23.6, 14.9, 5.4],
        t: '내 작업 → W-05',
        api: 'GET /complaints?assignee=me',
        d: '내가 맡아 진행 중인 작업만 분리해 본다. 같은 목록 API 를 질의 조건만 바꿔 재사용한다.' },
      { kind: 'ui', rect: [17.4, 14.3, 33.9, 5.1],
        t: '설비 필터',
        d: '내 담당 설비 탭에 · 표식. 담당 외 요청도 열람·선점할 수 있다 — 오분류 방치를 막는 정책 (P-01).' },
      { kind: 'rule', rect: [17.7, 29.4, 12.2, 6.8],
        t: '지연 표시',
        d: '긴급 1시간 · 보통 6시간 · 낮음 24시간 초과 시 서버가 판정한다 (P-02). 관리소장 개입의 기준.' },
      { kind: 'api', rect: [17.5, 24.2, 80.6, 40.6],
        t: '대기 목록 조회',
        api: 'GET /complaints?status=RECEIVED',
        d: '긴급도 → 오래 기다린 순 정렬. 맨 위가 항상 지금 가장 먼저 처리해야 할 건이다.' },
      { kind: 'ui', rect: [17.5, 37.9, 80.6, 9.0],
        t: '행 클릭 → W-03 상세',
        d: '선점은 신고 내용을 확인한 뒤 상세 화면에서만 시작된다. 목록에 "맡기" 버튼을 두지 않았다.' }
    ]
  }
];
