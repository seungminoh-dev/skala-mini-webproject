const path = require('path');
const fs = require('fs');
const PptxGenJS = require('pptxgenjs');
const { SCREENS, EXCEPTIONS } = require('./content.cjs');

const PC = (f) => path.join(__dirname, '..', 'docs', 'img', 'pc', f);
const WF = (f) => path.join(__dirname, '..', 'docs', 'img', f);
// PNG IHDR에서 픽셀 크기를 읽어 슬라이드에 맞게 축소 배치한다.
function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function fit(file, maxW, maxH) {
  const { w, h } = pngSize(file);
  const k = Math.min(maxW / w, maxH / h);
  return { w: w * k, h: h * k };
}
const RWD = (f) => path.join(__dirname, '..', 'docs', 'img', 'rwd', f);

const C = {
  ink: '0F172A', body: '334155', muted: '64748B', line: 'D9DEE7',
  primary: '2F5BEA', primaryWeak: 'EEF2FF',
  red: 'C81E1E', redWeak: 'FDF0F0',
  green: '15803D', greenWeak: 'E9F7EE',
  amber: '9A5B08', amberWeak: 'FDF4E3',
  panel: 'F4F6F9', dark: '111C33', white: 'FFFFFF'
};
// 이 Mac에 설치된 한글 폰트. 윈도우 PC에서 발표한다면 '맑은 고딕'으로 바꾸면 된다.
const F = 'Apple SD Gothic Neo';
const W = 13.333, H = 7.5, M = 0.55;

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_WIDE';
pres.author = '오승민';
pres.title = '오피스 시설 민원 처리 서비스 설계';

let pageNo = 0;
function newSlide(dark) {
  const s = pres.addSlide();
  s.background = { color: dark ? C.dark : C.white };
  return s;
}
function foot(s, txt) {
  pageNo += 1;
  s.addText(txt || '오피스 시설 민원 처리 서비스', {
    x: M, y: 7.05, w: 8, h: 0.26, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 9, color: C.muted, align: 'left'
  });
  s.addText(String(pageNo), {
    x: W - M - 0.8, y: 7.05, w: 0.8, h: 0.26, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 9, color: C.muted, align: 'right'
  });
}
function head(s, label, title, lead) {
  s.addText(label, { x: M, y: 0.34, w: 10, h: 0.24, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 11, bold: true, color: C.primary });
  s.addText(title, { x: M, y: 0.56, w: W - M * 2, h: 0.46, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 26, bold: true, color: C.ink });
  if (lead) s.addText(lead, { x: M, y: 1.02, w: W - M * 2, h: 0.28, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12, color: C.muted });
}
function card(s, o) {
  s.addShape(pres.ShapeType.roundRect, {
    x: o.x, y: o.y, w: o.w, h: o.h, rectRadius: 0.06,
    fill: { color: o.fill }, line: { color: o.fill }
  });
}

/* ── 1. 표지 ───────────────────────────────────────────── */
{
  const s = newSlide(true);
  s.addText('AI 웹 서비스 설계 Mini-project', { x: M + 0.3, y: 2.15, w: 11, h: 0.32, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, bold: true, color: '8FA6E8' });
  s.addText('오피스 시설 민원 처리 서비스', { x: M + 0.3, y: 2.55, w: 11.5, h: 0.9, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 40, bold: true, color: C.white });
  s.addText('모바일 우선 반응형 웹  ·  접수 · 상태 공유 · 이력 축적을 기록 기반으로 전환한다', { x: M + 0.3, y: 3.5, w: 11, h: 0.36, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, color: 'B9C6E6' });
  s.addShape(pres.ShapeType.rect, { x: M + 0.3, y: 4.15, w: 1.1, h: 0.035, fill: { color: '3E5AA8' }, line: { color: '3E5AA8' } });
  s.addText('판교캠퍼스 9반 P293  오승민', { x: M + 0.3, y: 4.45, w: 8, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, color: C.white });
  s.addText('2026.09', { x: M + 0.3, y: 4.78, w: 8, h: 0.28, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 11, color: '8FA6E8' });
  pageNo += 1;
}

/* ── 2. 목차 ───────────────────────────────────────────── */
{
  const s = newSlide();
  head(s, 'CONTENTS', '목차');
  const items = [
    ['01', '기획 배경과 현황', '대상 환경 · Pain Points · 원인 분석'],
    ['02', '서비스 정의', '액터 · 핵심 가치 · 업무 배정 모델'],
    ['03', 'UI 흐름', '전체 흐름도 · 화면별 API·DB 연결 17종'],
    ['04', '데이터 모델', 'ERD 6테이블 · 정규화 판단'],
    ['05', 'API 설계', '설계 규칙 · 엔드포인트 19종 · 오류 체계'],
    ['06', '고려사항', '해결한 이슈 · 남은 과제 · 2차 범위']
  ];
  const cw = (W - M * 2 - 0.4) / 2, ch = 1.15;
  items.forEach((it, i) => {
    const cx = M + (i % 2) * (cw + 0.4);
    const cy = 1.55 + Math.floor(i / 2) * (ch + 0.32);
    card(s, { x: cx, y: cy, w: cw, h: ch, fill: C.panel });
    s.addText(it[0], { x: cx + 0.28, y: cy + 0.22, w: 0.8, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 22, bold: true, color: C.primary });
    s.addText(it[1], { x: cx + 1.12, y: cy + 0.24, w: cw - 1.4, h: 0.34, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 16, bold: true, color: C.ink });
    s.addText(it[2], { x: cx + 1.12, y: cy + 0.62, w: cw - 1.4, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, color: C.muted });
  });
  foot(s);
}

/* ── 3. 대상 환경 ──────────────────────────────────────── */
{
  const s = newSlide();
  head(s, '01 기획 배경', '대상 환경', '판교 소재 오피스 빌딩 B동을 가상 시나리오로 설정한다.');
  const stats = [
    ['8개 층', '지상 8층 단일 건물'],
    ['약 500명', '주간 상주 인원'],
    ['6개 카테고리', '전기·급배수·공조·승강기·보안·비품'],
    ['일 15~20건', '주간 근무시간 기준 민원']
  ];
  const cw = (W - M * 2 - 0.36 * 3) / 4;
  stats.forEach((t, i) => {
    const cx = M + i * (cw + 0.36);
    card(s, { x: cx, y: 1.55, w: cw, h: 1.5, fill: C.primaryWeak });
    s.addText(t[0], { x: cx + 0.26, y: 1.78, w: cw - 0.5, h: 0.52, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 24, bold: true, color: C.primary });
    s.addText(t[1], { x: cx + 0.26, y: 2.34, w: cw - 0.5, h: 0.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, color: C.body });
  });
  card(s, { x: M, y: 3.35, w: W - M * 2, h: 1.35, fill: C.panel });
  s.addText('운영 인력', { x: M + 0.3, y: 3.56, w: 3, h: 0.28, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, bold: true, color: C.ink });
  s.addText('시설물 관리 소장 1명 · 시설물 작업자 5명 (전기 1 · 급배수·위생 2 · 공조 1 · 다목적 1)', {
    x: M + 0.3, y: 3.88, w: W - M * 2 - 0.6, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, color: C.body });
  s.addText('작업자 5명이 8개 층·6개 카테고리를 커버하는 동안 접수 창구는 관리실 한 곳뿐이다.', {
    x: M + 0.3, y: 4.2, w: W - M * 2 - 0.6, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, color: C.muted });

  s.addText('접수는 전화와 대면, 기록은 수기 대장과 담당자의 기억에 의존한다.', {
    x: M, y: 5.05, w: W - M * 2, h: 0.4, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 17, bold: true, color: C.ink });
  s.addText('접수 · 상태 공유 · 이력 축적 세 지점이 모두 특정 개인의 가용성에 묶여 있다.', {
    x: M, y: 5.48, w: W - M * 2, h: 0.36, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, color: C.muted });
  foot(s);
}

/* ── 4. Pain Points ────────────────────────────────────── */
{
  const s = newSlide();
  head(s, '01 기획 배경', 'Pain Points', '액터별로 현재 운영에서 실제로 실패하는 지점을 정리했다.');
  const groups = [
    ['시설물 관리 소장', C.amber, C.amberWeak, [
      ['AS-01', '정기 정비를 요청할 때 근거를 수기 대장이나 기억에 의존해 수치를 제시할 수 없다'],
      ['AS-02', '어떤 작업자가 어떤 업무를 보유 중인지 몰라 긴급 건을 누구에게 맡길지 판단할 수 없다']]],
    ['시설물 작업자', C.green, C.greenWeak, [
      ['AS-03', '다음 업무를 즉시 알 수 없어 관리실에 전화하거나 직접 현장에 가야 한다'],
      ['AS-04', '중복 접수된 건이 여러 번 배정되어 이미 처리한 곳으로 재출동한다']]],
    ['건물 사용자', C.primary, C.primaryWeak, [
      ['AS-05', '어디로 신고할지 몰라 지나가는 작업자를 붙잡고 구두로 이야기한다'],
      ['AS-06', '전화번호를 알더라도 응대자가 부재중이면 접수 자체가 이루어지지 않는다']]]
  ];
  const cw = (W - M * 2 - 0.34 * 2) / 3;
  groups.forEach((g, i) => {
    const cx = M + i * (cw + 0.34);
    card(s, { x: cx, y: 1.5, w: cw, h: 4.55, fill: C.panel });
    s.addText(g[0], { x: cx + 0.26, y: 1.72, w: cw - 0.5, h: 0.34, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: g[1] });
    g[3].forEach((p, j) => {
      const py = 2.25 + j * 1.75;
      card(s, { x: cx + 0.22, y: py, w: cw - 0.44, h: 1.5, fill: g[2] });
      s.addText(p[0], { x: cx + 0.42, y: py + 0.18, w: 1.2, h: 0.28, isTextBox: true, margin: 0,
        fontFace: F, fontSize: 11.5, bold: true, color: g[1] });
      s.addText(p[1], { x: cx + 0.42, y: py + 0.5, w: cw - 0.84, h: 0.88, isTextBox: true, margin: 0,
        fontFace: F, fontSize: 11.5, color: C.body, lineSpacingMultiple: 1.25 });
    });
  });
  foot(s);
}

/* ── 5. 원인 분석 ──────────────────────────────────────── */
{
  const s = newSlide();
  head(s, '01 기획 배경', '원인 분석', '수기와 기억에 의존하는 운영 방식은 세 층위에서 문제를 만든다.');
  const cs = [
    ['C-1', '접수 채널이 사람에 의존한다', '전화·대면이 유일한 창구이므로 응대자의 부재가 곧 접수 실패로 이어진다.', 'AS-05 · AS-06'],
    ['C-2', '처리 상태가 기록되지 않아 공유되지 않는다', '현재 상태가 특정 개인의 기억에만 존재해 다른 구성원이 조회할 수 없고 중복도 걸러낼 수 없다.', 'AS-02 · AS-03 · AS-04'],
    ['C-3', '처리 이력이 축적되지 않아 집계할 수 없다', '완료된 건이 구조화된 형태로 남지 않아 설비별 고장 빈도에 근거한 의사결정이 불가능하다.', 'AS-01']
  ];
  cs.forEach((c, i) => {
    const cy = 1.55 + i * 1.62;
    card(s, { x: M, y: cy, w: W - M * 2, h: 1.42, fill: C.panel });
    s.addShape(pres.ShapeType.roundRect, { x: M + 0.28, y: cy + 0.32, w: 0.78, h: 0.78, rectRadius: 0.2,
      fill: { color: C.primary }, line: { color: C.primary } });
    s.addText(c[0], { x: M + 0.28, y: cy + 0.52, w: 0.78, h: 0.36, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 14, bold: true, color: C.white, align: 'center' });
    s.addText(c[1], { x: M + 1.28, y: cy + 0.28, w: 7.9, h: 0.34, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: C.ink });
    s.addText(c[2], { x: M + 1.28, y: cy + 0.68, w: 9.2, h: 0.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12, color: C.body });
    s.addText(c[3], { x: W - M - 2.6, y: cy + 0.28, w: 2.3, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, bold: true, color: C.muted, align: 'right' });
  });
  foot(s);
}

/* ── 6. 액터 ───────────────────────────────────────────── */
{
  const s = newSlide();
  head(s, '02 서비스 정의', '액터와 권한 경계', '건물 사용자는 인증하지 않는다. 가입 절차가 그 자체로 접수 장벽이 되기 때문이다.');
  const actors = [
    ['건물 사용자', 'USER', '약 500명', '비인증', ['민원 등록', '민원 조회 (공개)', '본인 민원 수정·취소'], C.primary, C.primaryWeak],
    ['시설물 작업자', 'WORKER', '5명', '사번 로그인', ['미배정 민원 선점', '처리 결과 등록', '민원 반납'], C.green, C.greenWeak],
    ['시설물 관리 소장', 'ADMIN', '1명', '사번 로그인', ['전체 현황·통계 조회', '강제 배정·재배정·회수', '분류 정보 수정 · 반려'], C.amber, C.amberWeak]
  ];
  const cw = (W - M * 2 - 0.34 * 2) / 3;
  actors.forEach((a, i) => {
    const cx = M + i * (cw + 0.34);
    card(s, { x: cx, y: 1.5, w: cw, h: 4.5, fill: C.panel });
    s.addShape(pres.ShapeType.roundRect, { x: cx + 0.26, y: 1.76, w: 1.5, h: 0.42, rectRadius: 0.1,
      fill: { color: a[5] }, line: { color: a[5] } });
    s.addText(a[1], { x: cx + 0.26, y: 1.85, w: 1.5, h: 0.28, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11.5, bold: true, color: C.white, align: 'center' });
    s.addText(a[0], { x: cx + 0.26, y: 2.34, w: cw - 0.5, h: 0.36, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 16, bold: true, color: C.ink });
    s.addText(`${a[2]}  ·  ${a[3]}`, { x: cx + 0.26, y: 2.72, w: cw - 0.5, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11.5, color: C.muted });
    s.addText(a[4].map((t, k) => ({ text: t, options: { bullet: true, breakLine: k !== a[4].length - 1 } })), {
      x: cx + 0.3, y: 3.2, w: cw - 0.6, h: 2.5, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12, color: C.body, paraSpaceAfter: 8 });
  });
  foot(s);
}

/* ── 7. 핵심 가치 ──────────────────────────────────────── */
{
  const s = newSlide();
  head(s, '02 서비스 정의', '핵심 가치');
  s.addText('사람의 가용성에 묶여 있던 시설 민원 처리 과정을 기록 기반으로 전환한다', {
    x: M, y: 1.4, w: W - M * 2, h: 0.55, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 21, bold: true, color: C.ink });
  const v = [
    ['접수 누락 방지', '응대자의 부재와 무관하게 접수된다', 'AS-05 · AS-06'],
    ['상태 공유', '처리 상태가 관계자 모두에게 동일하게 보인다', 'AS-02 · AS-03'],
    ['이력 축적', '완료된 건이 남아 다음 의사결정의 근거가 된다', 'AS-01 · AS-04']
  ];
  const cw = (W - M * 2 - 0.34 * 2) / 3;
  v.forEach((t, i) => {
    const cx = M + i * (cw + 0.34);
    card(s, { x: cx, y: 2.25, w: cw, h: 2.15, fill: C.primaryWeak });
    s.addText(t[0], { x: cx + 0.3, y: 2.52, w: cw - 0.6, h: 0.42, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 18, bold: true, color: C.primary });
    s.addText(t[1], { x: cx + 0.3, y: 3.02, w: cw - 0.6, h: 0.7, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: C.body, lineSpacingMultiple: 1.25 });
    s.addText(t[2], { x: cx + 0.3, y: 3.86, w: cw - 0.6, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, bold: true, color: C.muted });
  });
  card(s, { x: M, y: 4.72, w: W - M * 2, h: 1.1, fill: C.panel });
  s.addText('기능 채택 기준', { x: M + 0.3, y: 4.92, w: 2.5, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, bold: true, color: C.ink });
  s.addText('"이 기능이 접수 누락 방지 · 상태 공유 · 이력 축적 중 무엇에 기여하는가" — 답하지 못하는 기능은 2차 범위로 미뤘다.', {
    x: M + 0.3, y: 5.24, w: W - M * 2 - 0.6, h: 0.34, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, color: C.body });
  foot(s);
}

/* ── 8. 업무 배정 모델 ─────────────────────────────────── */
{
  const s = newSlide();
  head(s, '02 서비스 정의', '업무 배정 모델', '선점(Pull)을 기본으로 하고, 관리소장의 강제 배정을 예외 경로로 둔다.');
  const cw = (W - M * 2 - 0.4) / 2;
  const boxes = [
    ['기본 경로 — 작업자 선점', C.green, C.greenWeak,
      '접수된 민원은 미배정 상태로 공용 목록에 노출되고 작업자가 직접 가져간다.',
      'AS-02의 "누구에게 배정할지 판단해야 하는 부담" 자체를 제거한다.'],
    ['예외 경로 — 관리소장 강제 배정', C.amber, C.amberWeak,
      '임계 시간을 넘겨 아무도 선점하지 않은 건이나 긴급 건을 직접 배정한다.',
      '성립하려면 작업자별 보유 현황이 화면에 있어야 한다. (A-01 필수 요소)']
  ];
  boxes.forEach((b, i) => {
    const cx = M + i * (cw + 0.4);
    card(s, { x: cx, y: 1.5, w: cw, h: 2.35, fill: b[2] });
    s.addText(b[0], { x: cx + 0.3, y: 1.74, w: cw - 0.6, h: 0.38, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 16, bold: true, color: b[1] });
    s.addText(b[3], { x: cx + 0.3, y: 2.2, w: cw - 0.6, h: 0.62, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12.5, color: C.body, lineSpacingMultiple: 1.25 });
    s.addText(b[4], { x: cx + 0.3, y: 2.94, w: cw - 0.6, h: 0.62, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12, color: C.muted, lineSpacingMultiple: 1.25 });
  });
  card(s, { x: M, y: 4.1, w: W - M * 2, h: 1.9, fill: C.panel });
  s.addText('선점 및 배정 정책', { x: M + 0.3, y: 4.32, w: 4, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13.5, bold: true, color: C.ink });
  const pol = [
    ['P-01  선점 자격', '담당 카테고리가 아니어도 선점할 수 있다. 경고만 표시한다. 신고자가 오분류한 민원이 정정 전까지 방치되는 것을 막기 위함.'],
    ['P-02  지연 판정', '미배정 대기 시간이 임계값을 넘으면 지연으로 표시한다. 긴급 1시간 / 보통 6시간 / 낮음 24시간.']
  ];
  pol.forEach((p, i) => {
    const py = 4.7 + i * 0.6;
    s.addText(p[0], { x: M + 0.3, y: py, w: 2.1, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12, bold: true, color: C.primary });
    s.addText(p[1], { x: M + 2.5, y: py, w: W - M * 2 - 2.9, h: 0.46, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11.5, color: C.body });
  });
  foot(s);
}

/* ── 9. 상태 전이도 ────────────────────────────────────── */
{
  const s = newSlide();
  head(s, '02 서비스 정의', '민원 상태 전이', '모든 전이는 변경 주체·시각과 함께 complaint_history 에 기록된다.');
  const BW = 2.0, BH = 0.86;
  const st = (x, y, ko, en, fg, bg) => {
    s.addShape(pres.ShapeType.roundRect, { x, y, w: BW, h: BH, rectRadius: 0.1,
      fill: { color: bg }, line: { color: fg, width: 1.25 } });
    s.addText(ko, { x, y: y + 0.13, w: BW, h: 0.34, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 15, bold: true, color: fg, align: 'center' });
    s.addText(en, { x, y: y + 0.47, w: BW, h: 0.26, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10, color: C.muted, align: 'center' });
  };
  const hArrow = (x1, x2, y, label, sub, left, below) => {
    s.addShape(pres.ShapeType.line, { x: Math.min(x1, x2), y, w: Math.abs(x2 - x1), h: 0,
      line: { color: C.muted, width: 1.25, ...(left ? { beginArrowType: 'triangle' } : { endArrowType: 'triangle' }) } });
    const ly = below ? y + 0.07 : y - 0.44;
    s.addText(label, { x: Math.min(x1, x2) - 0.12, y: ly, w: Math.abs(x2 - x1) + 0.24, h: 0.24, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, bold: true, color: C.ink, align: 'center' });
    if (sub) s.addText(sub, { x: Math.min(x1, x2) - 0.12, y: ly + 0.22, w: Math.abs(x2 - x1) + 0.24, h: 0.2, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 9.5, color: C.muted, align: 'center' });
  };
  const vArrow = (x, y1, y2, label, sub) => {
    s.addShape(pres.ShapeType.line, { x, y: y1, w: 0, h: y2 - y1,
      line: { color: C.muted, width: 1.25, endArrowType: 'triangle' } });
    s.addText(label, { x: x + 0.12, y: (y1 + y2) / 2 - 0.22, w: 2.4, h: 0.24, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, bold: true, color: C.ink });
    if (sub) s.addText(sub, { x: x + 0.12, y: (y1 + y2) / 2 + 0.02, w: 2.4, h: 0.2, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 9.5, color: C.muted });
  };

  const R = { x: 1.95, y: 2.45 }, P = { x: 5.4, y: 2.45 }, D = { x: 8.85, y: 2.45 };
  st(R.x, R.y, '접수됨', 'RECEIVED', C.primary, C.primaryWeak);
  st(P.x, P.y, '처리중', 'IN_PROGRESS', C.amber, C.amberWeak);
  st(D.x, D.y, '처리완료', 'COMPLETED', C.green, C.greenWeak);
  st(1.95, 4.95, '취소됨', 'CANCELED', C.muted, C.panel);
  st(5.4, 4.95, '반려', 'REJECTED', C.muted, C.panel);

  s.addShape(pres.ShapeType.ellipse, { x: 1.28, y: 2.79, w: 0.18, h: 0.18, fill: { color: C.muted }, line: { color: C.muted } });
  s.addShape(pres.ShapeType.line, { x: 1.46, y: 2.88, w: 0.45, h: 0, line: { color: C.muted, width: 1.25, endArrowType: 'triangle' } });
  s.addShape(pres.ShapeType.ellipse, { x: 11.2, y: 2.75, w: 0.26, h: 0.26, fill: { color: C.white }, line: { color: C.muted, width: 1.5 } });
  s.addShape(pres.ShapeType.ellipse, { x: 11.27, y: 2.82, w: 0.12, h: 0.12, fill: { color: C.muted }, line: { color: C.muted } });
  s.addShape(pres.ShapeType.line, { x: 10.85, y: 2.88, w: 0.32, h: 0, line: { color: C.muted, width: 1.25, endArrowType: 'triangle' } });

  hArrow(3.95, 5.4, 2.68, '선점 / 강제 배정', 'WORKER · ADMIN', false);
  hArrow(3.95, 5.4, 3.16, '반납 / 회수', 'WORKER · ADMIN', true, true);
  hArrow(7.4, 8.85, 2.88, '처리 결과 등록', 'WORKER', false);
  vArrow(2.95, 3.31, 4.95, '취소', 'USER · 비밀번호 확인');
  vArrow(6.4, 3.31, 4.95, '반려', 'ADMIN');

  card(s, { x: 8.85, y: 4.6, w: 3.95, h: 1.55, fill: C.panel });
  s.addText('설계 판단', { x: 9.1, y: 4.8, w: 3.4, h: 0.28, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, bold: true, color: C.ink });
  s.addText('담당자 확정(ASSIGNED)과 조치 착수를 하나로 통합했다. 선점 행위가 곧 처리 시작이므로 나누면 실익 없는 조작만 늘어난다. 신고자의 완료 확인 단계도 두지 않는다.', {
    x: 9.1, y: 5.1, w: 3.5, h: 0.95, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 10.5, color: C.body, lineSpacingMultiple: 1.2 });
  foot(s);
}

/* ── 화면 정책 — 반응형 ────────────────────────────────── */
{
  const s = newSlide();
  head(s, '02 서비스 정의', '화면 정책 — 모바일 우선 반응형 웹',
    '액터마다 사용 기기가 다르다. 하나의 코드가 뷰포트에 따라 레이아웃을 바꾼다.');

  const ctx = [
    ['USER', '건물 사용자', '현장에서 즉시 신고', '모바일', C.primary, C.primaryWeak],
    ['WORKER', '시설물 작업자', '층을 이동하며 확인·처리', '모바일', C.green, C.greenWeak],
    ['ADMIN', '시설물 관리 소장', '관리실 PC에서 전체 관리', '데스크톱', C.amber, C.amberWeak]
  ];
  ctx.forEach((c, i) => {
    const cy = 1.5 + i * 1.02;
    card(s, { x: M, y: cy, w: 5.3, h: 0.9, fill: c[5] });
    s.addText(c[0], { x: M + 0.24, y: cy + 0.16, w: 1.0, h: 0.26, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11.5, bold: true, color: c[4] });
    s.addText(c[1], { x: M + 0.24, y: cy + 0.46, w: 1.5, h: 0.26, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, color: C.body });
    s.addText(c[2], { x: M + 1.9, y: cy + 0.3, w: 2.3, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, color: C.body });
    s.addText(c[3], { x: M + 4.2, y: cy + 0.3, w: 0.95, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11.5, bold: true, color: c[4], align: 'right' });
  });

  card(s, { x: M, y: 4.66, w: 5.3, h: 1.66, fill: C.panel });
  s.addText('뷰포트 전환 규칙', { x: M + 0.24, y: 4.84, w: 3, h: 0.26, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12, bold: true, color: C.ink });
  const rules = [
    ['내비게이션', '하단 고정 탭바', '상단 내비게이션'],
    ['목록', '1열', '다열 그리드'],
    ['폼 · 상세', '전체 폭', '640px 중앙 정렬']
  ];
  s.addText('~ 767px', { x: M + 2.05, y: 5.14, w: 1.5, h: 0.22, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 9.5, bold: true, color: C.muted });
  s.addText('768px ~', { x: M + 3.65, y: 5.14, w: 1.5, h: 0.22, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 9.5, bold: true, color: C.primary });
  rules.forEach((r, i) => {
    const ry = 5.4 + i * 0.29;
    s.addText(r[0], { x: M + 0.24, y: ry, w: 1.8, h: 0.24, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10, bold: true, color: C.body });
    s.addText(r[1], { x: M + 2.05, y: ry, w: 1.6, h: 0.24, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10, color: C.muted });
    s.addText(r[2], { x: M + 3.65, y: ry, w: 1.6, h: 0.24, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10, color: C.primary });
  });

  const RX = 6.25, RW = 6.5;
  s.addText('데스크톱  1440px', { x: RX, y: 1.5, w: RW, h: 0.24, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 10, bold: true, color: C.muted });
  s.addImage({ path: RWD('rwd-user-desktop.png'), x: RX, y: 1.78, w: RW, h: RW * 1268 / 2880 });
  const my = 1.78 + RW * 1268 / 2880 + 0.34;
  s.addText('모바일  390px', { x: RX, y: my - 0.28, w: 2.2, h: 0.24, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 10, bold: true, color: C.muted });
  const mh = 6.32 - my, mw = mh * 780 / 1687;
  s.addImage({ path: RWD('rwd-user-mobile.png'), x: RX, y: my, w: mw, h: mh });
  s.addText('같은 URL · 같은 코드', { x: RX + mw + 0.3, y: my + 0.1, w: RW - mw - 0.3, h: 0.28, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12, bold: true, color: C.ink });
  s.addText('브레이크포인트 768px 을 경계로 하단 탭바가 상단 내비게이션으로 바뀌고, 목록이 다열로 흐른다. 별도 앱이나 별도 페이지를 두지 않는다.', {
    x: RX + mw + 0.3, y: my + 0.42, w: RW - mw - 0.3, h: 1.1, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 10.5, color: C.body, lineSpacingMultiple: 1.25 });
  foot(s);
}

/* ── 10. 전체 UI 흐름도 ────────────────────────────────── */
{
  const s = newSlide();
  head(s, '03 UI 흐름', '전체 UI 흐름도', '액터별 진입점과 주 경로. 점선 상자는 모달·오류 상태이며 별도 화면이 아니다.');
  const BW = 1.5, BH = 0.6, PITCH = 1.82, X0 = 2.02;
  const lanes = [
    ['USER', '건물 사용자 · 비인증', C.primary, C.primaryWeak, 1.42,
      [['U-01', '사용자 홈'], ['U-02', '민원 등록'], ['U-03', '접수 완료'], ['U-05', '민원 상세'], ['U-06', '본인 확인', 1], ['U-07', '민원 수정']],
      ['신고', '접수', '상세 보기', '수정·취소', '확인 통과'],
      '조회 경로 :  U-01  →  U-04 민원 조회  →  U-05 민원 상세'],
    ['WORKER', '시설물 작업자', C.green, C.greenWeak, 3.25,
      [['W-01', '직원 로그인'], ['W-02', '미배정 민원'], ['W-03', '민원 상세'], ['W-04', '담당 외 경고', 1], ['W-05', '내 작업'], ['W-06', '결과 등록']],
      ['로그인', '민원 선택', '담당 외', '선점', '결과 등록'],
      '담당 카테고리면 W-04 없이 W-03 에서 바로 선점 · 선점 충돌 시 E-01'],
    ['ADMIN', '시설물 관리 소장', C.amber, C.amberWeak, 5.08,
      [['W-01', '직원 로그인'], ['A-01', '운영 대시보드'], ['A-02', '전체 민원'], ['A-03', '민원 상세'], ['A-04', '강제 배정', 1], ['A-05', '민원 반려', 1]],
      ['분기', '전체 보기', '민원 선택', '배정', '반려'],
      'A-01  →  A-06 민원 통계']
  ];
  lanes.forEach((L) => {
    const y = L[4];
    s.addShape(pres.ShapeType.roundRect, { x: M, y: y - 0.12, w: W - M * 2, h: 1.62, rectRadius: 0.06,
      fill: { color: L[3] }, line: { color: L[3] } });
    s.addText(L[0], { x: M + 0.16, y: y + 0.18, w: 1.26, h: 0.3, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13, bold: true, color: L[2] });
    s.addText(L[1], { x: M + 0.16, y: y + 0.5, w: 1.26, h: 0.42, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 9, color: C.muted, lineSpacingMultiple: 1.1 });
    L[5].forEach((b, i) => {
      const bx = X0 + i * PITCH, by = y + 0.2;
      s.addShape(pres.ShapeType.roundRect, { x: bx, y: by, w: BW, h: BH, rectRadius: 0.08,
        fill: { color: C.white }, line: { color: b[2] ? C.muted : C.line, width: 1, dashType: b[2] ? 'dash' : 'solid' } });
      s.addText(b[0], { x: bx, y: by + 0.07, w: BW, h: 0.22, isTextBox: true, margin: 0,
        fontFace: F, fontSize: 9, bold: true, color: L[2], align: 'center' });
      s.addText(b[1], { x: bx, y: by + 0.28, w: BW, h: 0.26, isTextBox: true, margin: 0,
        fontFace: F, fontSize: 10.5, bold: true, color: C.ink, align: 'center' });
      if (i < L[5].length - 1) {
        s.addShape(pres.ShapeType.line, { x: bx + BW + 0.04, y: by + BH / 2, w: PITCH - BW - 0.08, h: 0,
          line: { color: C.muted, width: 1, endArrowType: 'triangle' } });
        s.addText(L[6][i], { x: bx + BW - 0.08, y: by + BH / 2 - 0.34, w: PITCH - BW + 0.24, h: 0.3, isTextBox: true, margin: 0,
          fontFace: F, fontSize: 8.5, color: C.muted, align: 'center' });
      }
    });
    s.addText(L[7], { x: X0, y: y + 0.92, w: 10.6, h: 0.24, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 9.5, color: C.muted });
  });
  s.addText('W-01 직원 로그인은 WORKER · ADMIN 공용이며, 인증 후 역할에 따라 W-02 또는 A-01 로 진입한다.  U-05 · W-03 · A-03 은 같은 민원 상세 레이아웃을 공유하고 액션 영역만 다르다.', {
    x: M, y: 6.72, w: W - M * 2, h: 0.28, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 10.5, color: C.muted });
  foot(s);
}

/* ── 11~27. 화면별 UI 흐름 ─────────────────────────────── */
const KIND = {
  api:  { fg: C.red,   bg: C.redWeak },
  ui:   { fg: C.green, bg: C.greenWeak },
  rule: { fg: C.amber, bg: C.amberWeak }
};
const ACTOR_KO = { USER: '건물 사용자', WORKER: '시설물 작업자', ADMIN: '시설물 관리 소장' };

SCREENS.forEach((sc) => {
  const s = newSlide();
  head(s, `03 UI 흐름 · ${ACTOR_KO[sc.actor]}`, `${sc.id}  ${sc.name}`, sc.lead);

  // 캡처 비율이 화면마다 달라 박스에 맞춰 축소하고 세로 중앙에 둔다.
  const BX = 0.62, BY = 1.36, BW2 = 7.95, BH2 = 4.95;
  const imgs = (sc.pair ? [sc.pair, sc.img] : [sc.img]).map((f) => PC(f));
  const each = imgs.length > 1 ? (BW2 - 0.16) / imgs.length : BW2;
  const sized = imgs.map((f) => fit(f, each, BH2));
  const imgH = Math.max(...sized.map((z) => z.h));
  const imgY = BY + (BH2 - imgH) / 2;
  let cx = BX;
  imgs.forEach((f, i) => {
    const z = sized[i];
    s.addImage({ path: f, x: cx, y: imgY + (imgH - z.h) / 2, w: z.w, h: z.h });
    cx += z.w + 0.16;
  });
  const imgRight = cx - 0.16;
  const annX = imgRight + 0.5;
  const annW = W - M - annX;

  // 주석 카드는 이미지 상단 ~ DB 띠 위까지의 범위 안에서만 배치한다.
  const CH = 0.86, GAP = 0.13, TOP = 1.36, BOT = 6.32;
  const placed = [];
  sc.notes.forEach((n) => {
    let top = imgY + n.a * imgH - CH / 2;
    top = Math.max(TOP, Math.min(top, BOT - CH));
    if (placed.length) {
      const prev = placed[placed.length - 1];
      if (top < prev + CH + GAP) top = prev + CH + GAP;
    }
    placed.push(top);
  });
  const over = placed.length ? (placed[placed.length - 1] + CH) - BOT : 0;
  if (over > 0) {
    placed.forEach((_, i) => { placed[i] -= over; });
    if (placed[0] < TOP) {           // 위로 밀다가 헤더를 침범하면 다시 아래로 정렬
      placed[0] = TOP;
      for (let i = 1; i < placed.length; i += 1) {
        placed[i] = Math.max(placed[i], placed[i - 1] + CH + GAP);
      }
    }
  }

  sc.notes.forEach((n, i) => {
    const k = KIND[n.kind], top = placed[i], mid = top + CH / 2;
    s.addShape(pres.ShapeType.line, { x: imgRight + 0.06, y: mid, w: annX - imgRight - 0.12, h: 0,
      line: { color: k.fg, width: 1.25, beginArrowType: 'triangle' } });
    card(s, { x: annX, y: top, w: annW, h: CH, fill: k.bg });
    s.addText(n.t, { x: annX + 0.22, y: top + 0.09, w: annW - 0.44, h: 0.28, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 12, bold: true, color: k.fg });
    s.addText(n.d, { x: annX + 0.22, y: top + 0.38, w: annW - 0.44, h: 0.42, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10.5, color: C.body, lineSpacingMultiple: 1.15 });
  });

  card(s, { x: M, y: 6.42, w: W - M * 2, h: 0.56, fill: C.panel });
  s.addShape(pres.ShapeType.roundRect, { x: M + 0.2, y: 6.56, w: 0.52, h: 0.28, rectRadius: 0.08,
    fill: { color: C.ink }, line: { color: C.ink } });
  s.addText('DB', { x: M + 0.2, y: 6.6, w: 0.52, h: 0.22, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 9.5, bold: true, color: C.white, align: 'center' });
  s.addText(sc.db, { x: M + 0.85, y: 6.58, w: W - M * 2 - 1.1, h: 0.26, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 10.5, color: C.body });
  foot(s, `UI 흐름 · ${sc.id} ${sc.name}`);
});

/* ── 28. 예외 및 오류 상태 ─────────────────────────────── */
{
  const s = newSlide();
  head(s, '03 UI 흐름', '예외 및 오류 상태', '예외는 별도 화면이 아니라 모달·비활성 상태로 표현하고, API 응답 코드와 1:1로 대응시킨다.');
  const colW = (W - M * 2 - 0.3 * 3) / 4;
  EXCEPTIONS.forEach((e, i) => {
    const cx = M + i * (colW + 0.3);
    const z = fit(PC(e.img), colW, 2.9);
    s.addImage({ path: PC(e.img), x: cx + (colW - z.w) / 2, y: 1.5 + (2.9 - z.h) / 2, w: z.w, h: z.h });
    card(s, { x: cx, y: 4.88, w: colW, h: 1.62, fill: C.panel });
    s.addText(`${e.id}  ${e.name}`, { x: cx + 0.2, y: 5.06, w: colW - 0.4, h: 0.26, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11.5, bold: true, color: C.ink });
    s.addText(e.code, { x: cx + 0.2, y: 5.34, w: colW - 0.4, h: 0.24, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10, bold: true, color: C.red });
    s.addText(e.d, { x: cx + 0.2, y: 5.62, w: colW - 0.4, h: 0.78, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10, color: C.body, lineSpacingMultiple: 1.15 });
  });
  foot(s);
}

/* ── 29. ERD ───────────────────────────────────────────── */
{
  const s = newSlide();
  head(s, '04 데이터 모델', 'ERD — 6 테이블',
    'DBML 원본을 그대로 렌더한 다이어그램이다. 열거형은 가독성을 위해 우측에 목록으로 분리했다.');

  const z = fit(WF('erd-dbml.png'), 5.0, 5.05);
  s.addImage({ path: WF('erd-dbml.png'), x: 0.62, y: 1.36 + (5.05 - z.h) / 2, w: z.w, h: z.h });
  s.addText('docs/erd.dbml', { x: 0.62, y: 6.46, w: z.w, h: 0.24, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 9.5, color: C.muted });

  const RX = 0.62 + z.w + 0.5, RW = W - M - RX;
  const halfW = (RW - 0.3) / 2;

  card(s, { x: RX, y: 1.36, w: halfW, h: 5.05, fill: C.panel });
  s.addText('정규화 판단', { x: RX + 0.26, y: 1.56, w: halfW - 0.5, h: 0.28, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, bold: true, color: C.ink });
  const notes = [
    ['위치', '층·공간은 민원의 분류 속성일 뿐 독립 조회 대상이 아니다. 등록 화면의 두 드롭다운과 1:1 대응한다.'],
    ['조치 · 반려', 'COMPLETED / REJECTED 일 때만 채워지는 종결 정보다. "누가 언제 처리했는가"는 complaint_history 가 이미 보관하므로 본체에 중복 컬럼을 두지 않는다.'],
    ['complaint_history', '이력 축적이라는 핵심 가치를 담는다. 상세 화면의 타임라인, 평균 처리 시간, 정기 정비 근거가 모두 여기서 나온다. append-only 로 운용한다.']
  ];
  notes.forEach((n, i) => {
    const ny = 2.0 + i * 1.52;
    s.addText(n[0], { x: RX + 0.26, y: ny, w: halfW - 0.5, h: 0.24, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, bold: true, color: C.primary });
    s.addText(n[1], { x: RX + 0.26, y: ny + 0.27, w: halfW - 0.5, h: 1.18, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10, color: C.body, lineSpacingMultiple: 1.22 });
  });

  const EX = RX + halfW + 0.3;
  card(s, { x: EX, y: 1.36, w: halfW, h: 2.42, fill: C.primaryWeak });
  s.addText('열거형', { x: EX + 0.26, y: 1.54, w: halfW - 0.5, h: 0.26, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, bold: true, color: C.primary });
  const enums = [
    ['complaint_status', 'RECEIVED · IN_PROGRESS · COMPLETED · REJECTED · CANCELED'],
    ['complaint_priority', 'URGENT · NORMAL · LOW'],
    ['space_type', '8종 (사무구역 · 화장실 · 탕비실 · 회의실 · 복도 · 기계실 · 로비 · 주차장)'],
    ['history_action', '11종 (REGISTER · CLAIM · RELEASE · COMPLETE · ASSIGN · REJECT …)'],
    ['rejection_type · photo_type · actor_type · user_role', '각 2~3종']
  ];
  enums.forEach((e, i) => {
    const ey = 1.86 + i * 0.38;
    s.addText(e[0], { x: EX + 0.26, y: ey, w: halfW - 0.5, h: 0.19, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 9.5, bold: true, color: C.ink });
    s.addText(e[1], { x: EX + 0.26, y: ey + 0.18, w: halfW - 0.5, h: 0.19, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 9, color: C.body });
  });

  card(s, { x: EX, y: 3.94, w: halfW, h: 2.47, fill: C.panel });
  s.addText('인덱스 — 화면별 조회 패턴', { x: EX + 0.26, y: 4.12, w: halfW - 0.5, h: 0.26, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, bold: true, color: C.ink });
  const idx = [
    ['(status, priority, created_at)', 'W-02 미배정 목록 정렬'],
    ['(assignee_id, status)', 'W-05 내 작업 · A-01 보유 현황'],
    ['(floor_no, space, category_code, status)', 'W-03 동일 위치 진행 중 민원'],
    ['(category_code, created_at)', 'A-06 통계 집계'],
    ['history (complaint_id, created_at)', '처리 이력 타임라인']
  ];
  idx.forEach((t, i) => {
    const iy = 4.46 + i * 0.4;
    s.addText(t[0], { x: EX + 0.26, y: iy, w: halfW - 0.5, h: 0.2, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 9, bold: true, color: C.primary });
    s.addText(t[1], { x: EX + 0.26, y: iy + 0.18, w: halfW - 0.5, h: 0.2, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 9, color: C.body });
  });
  foot(s);
}

/* ── 30. API 설계 규칙 ─────────────────────────────────── */
{
  const s = newSlide();
  head(s, '05 API 설계', '설계 규칙', '경로와 메서드만 보고도 무엇이 일어나는지 읽히도록 정했다.');
  const rules = [
    ['상태 전이는 하위 리소스 조작으로', 'POST /complaints/{id}/claim · DELETE /complaints/{id}/assignment\n본체에 대한 PATCH 는 상태를 바꾸지 않는 내용 수정에만 쓴다.'],
    ['수정 경로를 권한별로 분리', '신고자 원문 수정과 관리소장 분류 수정은 수정 가능 필드와 허용 상태가 다르다.\n하나로 묶으면 요청 스키마가 조건부가 되어 명세가 흐려진다.'],
    ['본인 확인은 인증이 아니라 파라미터', '조회는 공개라 비밀번호가 없고, 수정·취소 본문에만 4자리 비밀번호를 담는다.\nDELETE 본문은 프록시에서 보장되지 않아 취소는 POST .../cancel 로 정의했다.'],
    ['목록은 직원 전용, 단건은 공개', '민원 번호를 아는 사람만 자기 민원을 볼 수 있어야 한다.\n목록 조회와 단건 조회의 접근 범위를 다르게 뒀다.']
  ];
  const cw = (W - M * 2 - 0.36) / 2;
  rules.forEach((r, i) => {
    const cx = M + (i % 2) * (cw + 0.36), cy = 1.5 + Math.floor(i / 2) * 1.72;
    card(s, { x: cx, y: cy, w: cw, h: 1.5, fill: C.panel });
    s.addShape(pres.ShapeType.roundRect, { x: cx + 0.26, y: cy + 0.26, w: 0.36, h: 0.36, rectRadius: 0.1,
      fill: { color: C.primary }, line: { color: C.primary } });
    s.addText(String(i + 1), { x: cx + 0.26, y: cy + 0.3, w: 0.36, h: 0.28, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, bold: true, color: C.white, align: 'center' });
    s.addText(r[0], { x: cx + 0.76, y: cy + 0.26, w: cw - 1.0, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 13.5, bold: true, color: C.ink });
    s.addText(r[1], { x: cx + 0.76, y: cy + 0.64, w: cw - 1.0, h: 0.72, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10.5, color: C.body, lineSpacingMultiple: 1.2 });
  });
  card(s, { x: M, y: 4.95, w: W - M * 2, h: 1.35, fill: C.primaryWeak });
  s.addText('목록 엔드포인트 하나가 네 화면을 담당한다', { x: M + 0.3, y: 5.15, w: 6, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 12.5, bold: true, color: C.primary });
  const q = [['W-02 미배정', 'status=RECEIVED'], ['W-05 내 작업', 'assignee=me&status=IN_PROGRESS'],
             ['A-02 전체 민원', '필터 조합'], ['A-01 지연 민원', 'status=RECEIVED&delayed=true']];
  const qw = (W - M * 2 - 0.6) / 4;
  q.forEach((t, i) => {
    const qx = M + 0.3 + i * qw;
    s.addText(t[0], { x: qx, y: 5.5, w: qw - 0.2, h: 0.24, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10.5, bold: true, color: C.ink });
    s.addText(t[1], { x: qx, y: 5.76, w: qw - 0.2, h: 0.32, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 9.5, color: C.body });
  });
  foot(s);
}

/* ── 31. API 목록 ──────────────────────────────────────── */
{
  const s = newSlide();
  head(s, '05 API 설계', '엔드포인트 19종', 'OAS 3.0 으로 작성했으며 Security Schemes 는 과제 범위에 따라 제외했다.');
  const rows = [
    ['POST', '/complaints', 'FR-101 민원 등록'],
    ['GET', '/complaints/{id}', 'FR-102 단건 조회 (공개)'],
    ['POST', '/complaints/{id}/password-verification', '수정·취소 선행 본인 확인'],
    ['PATCH', '/complaints/{id}', 'FR-103 원문 수정 (신고자)'],
    ['POST', '/complaints/{id}/cancel', 'FR-104 취소'],
    ['POST', '/auth/login', 'FR-001 직원 로그인'],
    ['GET', '/complaints', 'FR-201 · 204 · 301 · 302'],
    ['GET', '/complaints/{id}/related', 'FR-206 동일 위치 진행 중 민원'],
    ['POST', '/complaints/{id}/claim', 'FR-202 선점'],
    ['POST', '/complaints/{id}/release', 'FR-203 반납'],
    ['POST', '/complaints/{id}/completion', 'FR-205 처리 결과 등록'],
    ['GET', '/dashboard', 'FR-301 · 302 · 303'],
    ['GET', '/workers', 'FR-303 작업자별 보유 현황'],
    ['POST', '/complaints/{id}/assignment', 'FR-304 강제 배정 / FR-305 재배정'],
    ['DELETE', '/complaints/{id}/assignment', 'FR-306 배정 회수'],
    ['PATCH', '/complaints/{id}/classification', 'FR-307 분류 정보 수정'],
    ['POST', '/complaints/{id}/rejection', 'FR-308 반려'],
    ['GET', '/statistics', 'FR-309 통계'],
    ['GET', '/categories', '등록 화면 카테고리 선택지']
  ];
  const MC = { GET: C.green, POST: C.primary, PATCH: C.amber, DELETE: C.red };
  const colW = (W - M * 2 - 0.4) / 2;
  rows.forEach((r, i) => {
    const cx = M + (i < 10 ? 0 : colW + 0.4);
    const ry = 1.48 + (i % 10) * 0.5;
    s.addShape(pres.ShapeType.roundRect, { x: cx, y: ry, w: 0.72, h: 0.3, rectRadius: 0.07,
      fill: { color: MC[r[0]] }, line: { color: MC[r[0]] } });
    s.addText(r[0], { x: cx, y: ry + 0.04, w: 0.72, h: 0.22, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 8, bold: true, color: C.white, align: 'center' });
    s.addText(r[1], { x: cx + 0.82, y: ry - 0.02, w: colW - 0.82, h: 0.24, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10, bold: true, color: C.ink });
    s.addText(r[2], { x: cx + 0.82, y: ry + 0.2, w: colW - 0.82, h: 0.22, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 9, color: C.muted });
  });
  card(s, { x: M + colW + 0.4, y: 6.05, w: colW, h: 0.9, fill: C.redWeak });
  s.addText('오류 코드', { x: M + colW + 0.62, y: 6.18, w: 2, h: 0.24, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 10.5, bold: true, color: C.red });
  s.addText('400 INVALID_PAYLOAD · ORIGINAL_REQUIRED   |   401 PASSWORD_MISMATCH · LOGIN_FAILED   |   403 FORBIDDEN\n404 COMPLAINT_NOT_FOUND · WORKER_NOT_FOUND   |   409 ALREADY_CLAIMED · NOT_EDITABLE · INVALID_STATE', {
    x: M + colW + 0.62, y: 6.42, w: colW - 0.44, h: 0.46, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 8.5, color: C.body, lineSpacingMultiple: 1.2 });
  foot(s);
}

/* ── 부록: 모바일 와이어프레임 ─────────────────────────── */
{
  const s = newSlide();
  head(s, 'Appendix', '모바일 와이어프레임',
    '설계 원본은 모바일 기준으로 작성했다. 앞의 화면들은 같은 코드가 768px 이상에서 전환된 결과다.');
  const sheets = [
    ['건물 사용자 USER', 'wf-user.png'],
    ['시설물 작업자 WORKER', 'wf-worker.png'],
    ['시설물 관리 소장 ADMIN', 'wf-admin.png'],
    ['예외 및 오류 상태', 'wf-except.png']
  ];
  const colW = (W - M * 2 - 0.3 * 3) / 4;
  sheets.forEach((t, i) => {
    const cx = M + i * (colW + 0.3);
    s.addText(t[0], { x: cx, y: 1.5, w: colW, h: 0.26, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, bold: true, color: C.primary });
    const z = fit(WF(t[1]), colW, 4.5);
    s.addImage({ path: WF(t[1]), x: cx + (colW - z.w) / 2, y: 1.84, w: z.w, h: z.h });
  });
  foot(s);
}

/* ── 32. 고려사항 ──────────────────────────────────────── */
{
  const s = newSlide();
  head(s, '06 고려사항', '설계 판단과 남은 과제');
  const cw = (W - M * 2 - 0.36) / 2;
  card(s, { x: M, y: 1.45, w: cw, h: 4.9, fill: C.greenWeak });
  s.addText('해결한 이슈', { x: M + 0.3, y: 1.68, w: cw - 0.6, h: 0.32, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: C.green });
  const solved = [
    ['수정·취소의 비밀번호 전달', 'DELETE 본문은 프록시에서 보장되지 않고 취소가 물리 삭제도 아니므로 POST .../cancel 로 정의'],
    ['동일 리소스의 두 수정 경로', '수정 가능 필드와 허용 상태가 달라 경로를 분리'],
    ['열람 공개에 따른 번호 추측', '비순차 식별자 M-YYMMDD-XXXXXX, 혼동 문자 제외 32자 집합'],
    ['작업자 보유 현황 표시 단위', '상태 모델에 ASSIGNED 가 없어 진행/대기 구분은 만들 수 없는 수치 — 보유 건수만 표시']
  ];
  solved.forEach((t, i) => {
    const ty = 2.18 + i * 1.06;
    s.addText(t[0], { x: M + 0.3, y: ty, w: cw - 0.6, h: 0.26, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11.5, bold: true, color: C.ink });
    s.addText(t[1], { x: M + 0.3, y: ty + 0.28, w: cw - 0.6, h: 0.62, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10.5, color: C.body, lineSpacingMultiple: 1.2 });
  });
  const rx = M + cw + 0.36;
  card(s, { x: rx, y: 1.45, w: cw, h: 2.35, fill: C.amberWeak });
  s.addText('남은 과제', { x: rx + 0.3, y: 1.68, w: cw - 0.6, h: 0.32, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 15, bold: true, color: C.amber });
  const open = [
    ['4자리 비밀번호의 강도', '무차별 대입에 취약 — 시도 횟수 제한 필요'],
    ['비인증 접수의 악용', '허위 신고 사전 통제 수단 없음 — 반려로 사후 대응'],
    ['중복 민원 사전 탐지', '판정 기준의 정확도를 검증할 근거가 없어 미도입']
  ];
  open.forEach((t, i) => {
    const ty = 2.18 + i * 0.54;
    s.addText(t[0], { x: rx + 0.3, y: ty, w: 3.2, h: 0.24, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 11, bold: true, color: C.ink });
    s.addText(t[1], { x: rx + 3.5, y: ty, w: cw - 3.8, h: 0.4, isTextBox: true, margin: 0,
      fontFace: F, fontSize: 10, color: C.body });
  });
  card(s, { x: rx, y: 4.0, w: cw, h: 2.35, fill: C.panel });
  s.addText('2차 범위로 미룬 기능', { x: rx + 0.3, y: 4.22, w: cw - 0.6, h: 0.3, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 14, bold: true, color: C.ink });
  s.addText('전체 공지 · 정기 점검 스케줄링 · 비용·자재 정산 · 외주 업체 관리 · 부품 재고 · 외부 알림 연동 · 다건물 확장 · 작업자 보유 상한 · 신고자의 완료 확인과 재요청 · 기준 데이터 관리 화면', {
    x: rx + 0.3, y: 4.6, w: cw - 0.6, h: 0.95, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 10.5, color: C.body, lineSpacingMultiple: 1.25 });
  s.addText('기능이 불필요해서가 아니라, 핵심 가치에 직접 기여하지 않거나 선행 정책 정의가 필요해서 제외했다.', {
    x: rx + 0.3, y: 5.7, w: cw - 0.6, h: 0.42, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 10.5, bold: true, color: C.muted, lineSpacingMultiple: 1.2 });
  foot(s);
}

/* ── 33. 마무리 ────────────────────────────────────────── */
{
  const s = newSlide(true);
  s.addText('감사합니다', { x: 0, y: 3.0, w: W, h: 0.8, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 34, bold: true, color: C.white, align: 'center' });
  s.addText('오피스 시설 민원 처리 서비스   ·   판교캠퍼스 9반 P293 오승민', {
    x: 0, y: 3.9, w: W, h: 0.34, isTextBox: true, margin: 0,
    fontFace: F, fontSize: 13, color: '8FA6E8', align: 'center' });
  pageNo += 1;
}

const out = path.join(__dirname, '..', 'docs', '오피스 시설 민원 처리 서비스_설계.pptx');
pres.writeFile({ fileName: out }).then(() => console.log('WROTE', out, '| slides:', pageNo));
