// UI Flow 상세 페이지 빌더 — data.cjs 를 읽어 A4 가로 HTML 을 생성한다.
// 레이아웃: 화면 캡처 전폭 상단 + 압축 주석 카드 1행 하단.
// 사용: node techdoc/uiflow/build.cjs  →  techdoc/out/uiflow.html

const fs = require('fs');
const path = require('path');
const { PAGES, FLOWS, MATRIX } = require('./data.cjs');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const KIND = {
  api:  { label: '연결 API' },
  ui:   { label: '동작 · 이동' },
  rule: { label: '정책' }
};

function renderPage(p) {
  // 카드는 참조 영역의 가로 위치 순(왼→오른쪽)으로 배치하고, 번호도 그 순서로 매긴다.
  const notes = p.notes
    .map(n => ({ ...n, cx: n.rect[0] + n.rect[2] / 2, cy: n.rect[1] + n.rect[3] / 2 }))
    .sort((a, b) => a.cx - b.cx || a.cy - b.cy)
    .map((n, i) => ({ ...n, no: i + 1 }));

  const card = n => `
    <div class="card k-${n.kind}" data-no="${n.no}">
      <div class="card-head">
        <span class="n n-${n.kind}">${n.no}</span>
        <span class="ct">${esc(n.t)}</span>
      </div>
      <div class="kind">${KIND[n.kind].label}</div>
      ${n.api ? `<div class="api-line">${esc(n.api)}</div>` : ''}
      <p class="cd">${esc(n.d)}</p>
    </div>`;

  const crop = p.crop || 1;
  const region = n => `
    <div class="region r-${n.kind}${n.rect[0] >= 5 ? ' chip-out' : ''}" data-no="${n.no}" style="left:${n.rect[0]}%;top:${(n.rect[1] / crop).toFixed(2)}%;width:${n.rect[2]}%;height:${(n.rect[3] / crop).toFixed(2)}%">
      <span class="n n-${n.kind} on-img">${n.no}</span>
    </div>`;
  const [iw, ih] = p.imgSize || [16, 9];
  // 인쇄(페이지 매김) 레이아웃에서도 안전한 고전적 비율 박스 — padding-top 은 너비 기준 %.
  const shotStyle = `padding-top:${(ih * crop / iw * 100).toFixed(3)}%`;

  return `
  <div class="page" data-id="${p.id}">
    <div class="rail"></div>
    <div class="pbody">
      <header>
        <div class="kicker">프로젝트 기술서 · ${esc(p.section)} <span class="mono">(${p.actor})</span></div>
        <div class="trow">
          <span class="idchip mono">${p.id}</span>
          <h1>${esc(p.title)}</h1>
          <span class="dname">${esc(p.designName)}</span>
          <span class="lead">${esc(p.lead)}</span>
          <span class="spacer"></span>
          ${p.fr.map(f => `<span class="frchip mono">${f}</span>`).join('')}
          ${(p.policies || []).map(f => `<span class="pochip mono">${f}</span>`).join('')}
        </div>
      </header>
      <main>
        <div class="shot" style="${shotStyle}">
          <img src="${p.img}" alt="${p.id}">
          ${notes.map(region).join('')}
        </div>
        <div class="cardrow">${notes.map(card).join('')}</div>
        <svg class="wires"></svg>
      </main>
      <footer>
        <div class="fcell legend">
          <span class="n n-ui"></span> 동작·이동
          <span class="n n-api"></span> 연결 API
          <span class="n n-rule"></span> 정책
        </div>
        <div class="fcell"><span class="flabel">화면 연결</span>
          <span class="mono fx">${esc(p.flow.from)}</span> <span class="arr">→</span> <b class="mono">${p.id}</b>
          ${p.flow.to.map(t => `<span class="arr">→</span> <span class="mono fx">${esc(t)}</span>`).join('')}
        </div>
        <div class="fcell"><span class="flabel">데이터</span><span class="mono fx">${esc(p.db)}</span></div>
      </footer>
    </div>
  </div>`;
}


/* ── 액터별 화면 전이도 ──────────────────────────────── */
function renderFlow(f) {
  const rows = Math.max(...f.nodes.map(n => n.row));
  const node = n => `
    <div class="fnode ${n.kind === 'err' ? 'is-err' : ''} ${n.hub ? 'is-hub' : ''}"
         data-id="${n.id}" style="grid-column:${n.col};grid-row:${n.row}">
      <span class="fn-id mono">${n.id}</span>
      <span class="fn-t">${esc(n.title)}</span>
    </div>`;
  return `
  <div class="page" data-id="${f.id}">
    <div class="rail"></div>
    <div class="pbody">
      <header>
        <div class="kicker">프로젝트 기술서 · ${esc(f.section)} <span class="mono">(${f.actor})</span></div>
        <div class="trow">
          <span class="idchip mono">흐름</span>
          <h1>${esc(f.title)}</h1>
          <span class="dname">${esc(f.designName)}</span>
          <span class="lead">${esc(f.lead)}</span>
          <span class="spacer"></span>
          ${f.fr.map(x => `<span class="frchip mono">${x}</span>`).join('')}
        </div>
      </header>
      <main class="flowmain">
        <div class="fgrid" style="grid-template-columns:repeat(${f.cols},1fr);grid-template-rows:repeat(${rows},1fr)">
          ${f.nodes.map(node).join('')}
        </div>
        <svg class="fwires"></svg>
        <div class="fnotes">
          ${f.notes.map(n => `<p>${esc(n)}</p>`).join('')}
        </div>
      </main>
      <footer>
        <div class="fcell legend">
          <span class="lg lg-main"></span> 주 경로
          <span class="lg lg-alt"></span> 복귀 · 대체
          <span class="lg lg-err"></span> 예외
        </div>
        <div class="fcell"><span class="flabel">읽는 법</span>
          <span class="fx">화살표 위 글자는 그 이동을 일으키는 조작이다. 굵은 테두리는 여러 경로가 모이는 화면.</span>
        </div>
      </footer>
      <script type="application/json" class="fedges">${JSON.stringify(f.edges)}</script>
    </div>
  </div>`;
}

/* ── API 커버리지 매트릭스 ───────────────────────────── */
function renderMatrix(m) {
  const row = r => `
    <tr class="${r.screens.length ? '' : 'is-gap'}">
      <td class="mx-m mono">${r.m}</td>
      <td class="mx-p mono">${esc(r.p)}</td>
      <td class="mx-op mono">${r.op}</td>
      <td class="mx-fr mono">${esc(r.fr)}</td>
      <td class="mx-s">${r.screens.length
        ? r.screens.map(s => `<span class="sc mono">${s}</span>`).join('')
        : '<span class="sc-none">사용 화면 없음</span>'}</td>
    </tr>`;
  return `
  <div class="page" data-id="${m.id}">
    <div class="rail"></div>
    <div class="pbody">
      <header>
        <div class="kicker">프로젝트 기술서 · ${esc(m.section)}</div>
        <div class="trow">
          <span class="idchip mono">부록</span>
          <h1>${esc(m.title)}</h1>
          <span class="dname">${esc(m.designName)}</span>
          <span class="lead">${esc(m.lead)}</span>
        </div>
      </header>
      <main class="mxmain">
        <table class="mx">
          <thead><tr><th>메서드</th><th>경로</th><th>operationId</th><th>대응 기능</th><th>사용 화면</th></tr></thead>
          <tbody>${m.rows.map(row).join('')}</tbody>
        </table>
        <div class="mxnotes">
          ${m.gaps.map(g => `<div class="mxn"><div class="mxn-t">${esc(g.t)}</div><p>${esc(g.d)}</p></div>`).join('')}
        </div>
      </main>
      <footer>
        <div class="fcell"><span class="flabel">집계 기준</span>
          <span class="fx">docs/openapi.yaml 의 operationId 전수 × src/views 의 @/mock/api import 대조</span>
        </div>
      </footer>
    </div>
  </div>`;
}

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>UI Flow</title>
<style>
  :root {
    --navy: #0F2854; --blue: #1C4D8D; --sky: #4988C4; --ice: #BDE8F5;
    --warn: #B3401E; --bg: #FAF9F7; --ink: #1A2433; --hair: #D9D4CC;
    --mono: ui-monospace, 'SF Mono', Menlo, monospace;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 297mm 210mm; margin: 0; }
  html, body { background: #EEE; }
  body { font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif; color: var(--ink);
         -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { width: 297mm; height: 210mm; background: var(--bg); display: flex;
          page-break-after: always; position: relative; overflow: hidden; }
  .rail { width: 6mm; background: var(--navy); flex: none; }
  .pbody { flex: 1; display: flex; flex-direction: column; padding: 6.5mm 8mm 5.5mm 8mm; min-width: 0; }

  /* ── header ── */
  .kicker { font-size: 8pt; letter-spacing: .14em; color: var(--blue); font-weight: 600; }
  .kicker .mono { font-family: var(--mono); letter-spacing: 0; }
  .trow { display: flex; align-items: baseline; gap: 2.6mm; margin-top: 1.8mm; }
  .idchip { background: var(--navy); color: #fff; font-family: var(--mono); font-size: 11.5pt;
            font-weight: 700; padding: 0.9mm 2.2mm; border-radius: 3px; align-self: center; }
  h1 { font-size: 17pt; font-weight: 800; color: var(--navy); letter-spacing: -0.01em; white-space: nowrap; }
  .dname { font-size: 9pt; color: #5A6474; white-space: nowrap; }
  .dname::before { content: '설계명 '; font-size: 7.5pt; color: #8A93A1; }
  .lead { font-size: 8.6pt; color: #5A6474; padding-left: 2.6mm; border-left: 0.3mm solid var(--hair); }
  .spacer { flex: 1; }
  .frchip, .pochip { font-family: var(--mono); font-size: 8.5pt; border-radius: 3px; padding: .8mm 1.8mm; align-self: center; white-space: nowrap; }
  .frchip { border: 0.35mm solid var(--blue); color: var(--blue); font-weight: 600; }
  .pochip { background: rgba(73,136,196,.14); color: var(--navy); }

  /* ── main: 캡처 전폭 + 하단 카드 1행 ── */
  main { flex: 1; display: flex; flex-direction: column; justify-content: space-between;
         position: relative; margin-top: 3mm; min-height: 0; }
  .shot { position: relative; width: 100%; height: 0; overflow: hidden;
          border: 0.3mm solid var(--hair); flex: none; }
  .shot img { position: absolute; top: 0; left: 0; width: 100%; display: block; }

  /* 참조 영역 — 카드 채움 방식과 짝을 이루는 테두리 구분.
     어두운 배경(네이비 레일) 위에서도 보이도록 안팎에 밝은 헤어라인을 두른다. */
  .region { position: absolute; border-radius: 2px;
            box-shadow: 0 0 0 0.25mm rgba(250,249,247,.9), inset 0 0 0 0.25mm rgba(250,249,247,.9); }
  .r-ui   { border: 0.55mm solid var(--navy); }
  .r-api  { border: 0.5mm dashed var(--sky); }
  .r-rule { border: 0.6mm dotted var(--blue); }
  .n { display: inline-flex; align-items: center; justify-content: center; width: 4mm; height: 4mm;
       font-family: var(--mono); font-size: 8pt; font-weight: 700; border-radius: 2px; flex: none; }
  .n-ui   { background: var(--navy); color: #fff; }
  .n-api  { background: #fff; color: var(--navy); border: 0.35mm solid var(--blue); }
  .n-rule { background: var(--ice); color: var(--navy); }
  .n.on-img { position: absolute; top: -2.1mm; left: -2.1mm; box-shadow: 0 0 0 0.75mm var(--bg); z-index: 3; }
  /* 영역 왼쪽에 여백이 있으면 칩을 바깥으로 빼 화면 글자를 가리지 않게 한다 */
  .region.chip-out .n.on-img { top: -2mm; left: -5.6mm; }

  .cardrow { display: flex; gap: 3mm; margin-top: 7mm; align-items: stretch; }
  .card { flex: 1; min-width: 0; border-radius: 3px; padding: 2.8mm 2.8mm; overflow: hidden; }
  .card.k-api  { background: #fff; border: 0.3mm solid var(--hair); }
  .card.k-ui   { background: rgba(15,40,84,.055); }
  .card.k-rule { background: rgba(189,232,245,.32); }
  .card-head { display: flex; align-items: center; gap: 1.8mm; }
  .kind { font-size: 6.6pt; letter-spacing: .1em; color: var(--sky); font-weight: 700;
          margin: 1.1mm 0 0 5.8mm; }
  .ct { font-size: 9.2pt; font-weight: 700; color: var(--navy); }
  .api-line { font-family: var(--mono); font-size: 7.2pt; color: var(--blue); font-weight: 600;
              margin: 1mm 0 0 5.8mm; overflow-wrap: anywhere; }
  .cd { font-size: 8.4pt; line-height: 1.5; color: #3A4454; margin: 1.3mm 0 0 5.8mm; }


  /* ── 화면 전이도 ────────────────────────────────────── */
  .flowmain { display: flex; flex-direction: column; }
  .fgrid { flex: 1; display: grid; gap: 4mm 15mm; padding: 6mm 2mm 4mm; align-items: center; justify-items: center; align-content: space-evenly; }
  .fnode { position: relative; width: 100%; max-width: 44mm; background: #fff;
           border: 0.35mm solid var(--hair); border-radius: 3px; padding: 3mm 3mm 2.6mm; text-align: center; }
  .fnode.is-hub { border-color: var(--navy); border-width: 0.6mm; }
  .fnode.is-err { background: rgba(179,64,30,.055); border-color: #E0BDB2; }
  .fn-id { display: block; font-family: var(--mono); font-size: 8.5pt; font-weight: 700; color: var(--blue); }
  .fnode.is-err .fn-id { color: var(--warn); }
  .fn-t { display: block; font-size: 10pt; font-weight: 700; color: var(--navy); margin-top: 1mm; }
  .fwires { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
  .fwires path { fill: none; stroke-width: 1.1; }
  .fwires path.e-main { stroke: var(--navy); }
  .fwires path.e-alt  { stroke: var(--sky); stroke-dasharray: 4 3; }
  .fwires path.e-err  { stroke: var(--warn); stroke-dasharray: 1.5 2.5; }
  .fwires polygon.a-main { fill: var(--navy); }
  .fwires polygon.a-alt  { fill: var(--sky); }
  .fwires polygon.a-err  { fill: var(--warn); }
  .fwires text { font-family: 'Pretendard','Apple SD Gothic Neo',sans-serif; font-size: 7pt; fill: #5A6474; }
  .fwires text.t-err { fill: var(--warn); }
  .fnotes { border-top: 0.3mm solid var(--hair); margin-top: 3mm; padding-top: 2.6mm;
            display: flex; gap: 6mm; }
  .fnotes p { flex: 1; font-size: 8.8pt; line-height: 1.55; color: #3A4454; padding-left: 3mm;
              border-left: 0.3mm solid var(--hair); }
  .fnotes p:first-child { border-left: 0; padding-left: 0; }
  .lg { display: inline-block; width: 6mm; height: 0; border-top-width: 0.5mm; margin: 0 1mm 0 2mm; vertical-align: middle; }
  .lg-main { border-top-style: solid; border-top-color: var(--navy); }
  .lg-alt  { border-top-style: dashed; border-top-color: var(--sky); }
  .lg-err  { border-top-style: dotted; border-top-color: var(--warn); }

  /* ── API 커버리지 매트릭스 ──────────────────────────── */
  .mxmain { display: flex; flex-direction: column; }
  .mx { width: 100%; border-collapse: collapse; background: #fff; margin-top: 3mm; }
  .mx th { text-align: left; font-size: 7pt; letter-spacing: .1em; color: #8A93A1; font-weight: 700;
           padding: 1.6mm 2mm; border-bottom: 0.35mm solid var(--hair); white-space: nowrap; }
  .mx td { padding: 1.35mm 2mm; border-bottom: 0.25mm solid #EFEBE4; font-size: 8.2pt; vertical-align: middle; }
  .mx tr.is-gap { background: rgba(179,64,30,.05); }
  .mx-m { color: var(--blue); font-weight: 700; width: 16mm; }
  .mx-p { color: var(--ink); width: 74mm; }
  .mx-op { color: #5A6474; width: 44mm; }
  .mx-fr { color: #5A6474; width: 34mm; }
  .sc { display: inline-block; background: rgba(15,40,84,.07); color: var(--navy); font-weight: 700;
        border-radius: 2px; padding: 0.5mm 1.4mm; margin-right: 1.2mm; font-size: 7.6pt; }
  .sc-none { color: var(--warn); font-weight: 700; font-size: 8pt; }
  .mxnotes { display: flex; gap: 4mm; margin-top: 3.5mm; }
  .mxn { flex: 1; background: rgba(15,40,84,.045); border-radius: 3px; padding: 2.6mm 3mm; }
  .mxn-t { font-size: 8.6pt; font-weight: 700; color: var(--navy); }
  .mxn p { font-size: 8pt; line-height: 1.5; color: #3A4454; margin-top: 1.2mm; }

  .wires { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .wires path { fill: none; stroke: var(--sky); stroke-width: 1.1; opacity: .85; }
  .wires circle { fill: var(--sky); }

  /* ── footer ── */
  footer { display: flex; align-items: flex-start; gap: 3.5mm; border-top: 0.3mm solid var(--hair);
           margin-top: 3mm; padding-top: 2mm; font-size: 7.8pt; color: #3A4454; }
  .fcell { display: flex; align-items: baseline; gap: 1.6mm; flex: none; white-space: nowrap; }
  .fcell:nth-child(2) { flex: 1.6; min-width: 0; white-space: normal; }
  .fcell:last-child { flex: 1; min-width: 0; white-space: normal; }
  .fcell + .fcell { border-left: 0.3mm solid var(--hair); padding-left: 4mm; }
  .legend { color: #5A6474; }
  .legend .n { margin-left: 2mm; }
  .legend .n:first-child { margin-left: 0; }
  .flabel { font-size: 7pt; letter-spacing: .12em; color: #8A93A1; font-weight: 700; white-space: nowrap; }
  .fx { color: var(--ink); }
  .mono { font-family: var(--mono); font-size: 7.8pt; }
  footer .mono { font-size: 7pt; }
  .arr { color: var(--sky); }
  footer b.mono { color: var(--navy); }
</style></head><body>
${FLOWS.map(renderFlow).join('\n')}
${PAGES.map(renderPage).join('\n')}
${renderMatrix(MATRIX)}
<script>
  // 참조 영역 하단 → 카드 상단을 직교선으로 잇는다.
  // 영역이 넓으면 카드와 가장 가까운 x 지점에 앵커를 잡아 선을 거의 수직으로 유지한다.
  // 전이도: 노드 사이를 직교선 + 화살촉으로 잇는다.
  addEventListener('load', () => {
    document.querySelectorAll('.page[data-id^="FLOW"]').forEach(page => {
      const main = page.querySelector('.flowmain');
      const svg = page.querySelector('.fwires');
      const edges = JSON.parse(page.querySelector('.fedges').textContent);
      const mr = main.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + mr.width + ' ' + mr.height);
      const box = id => {
        const el = main.querySelector('.fnode[data-id="' + id + '"]');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { l: r.left - mr.left, r: r.right - mr.left, t: r.top - mr.top, b: r.bottom - mr.top,
                 cx: r.left + r.width / 2 - mr.left, cy: r.top + r.height / 2 - mr.top };
      };
      const add = (tag, attrs, text) => {
        const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
        if (text != null) n.textContent = text;
        svg.appendChild(n); return n;
      };
      const gb = main.querySelector('.fgrid').getBoundingClientRect();
      const railTop = gb.top - mr.top + 4, railBot = gb.bottom - mr.top - 4;
      edges.forEach(e => {
        const a = box(e.from), b = box(e.to);
        if (!a || !b) return;
        const kind = e.kind || 'main';
        const dy = e.dy || 0;
        let d, tip, ang, lx, ly, anchor = 'middle';
        if (e.route === 'bottom' || e.route === 'top') {          // 되돌아오는 긴 경로는 레일로 우회
          const rail = e.route === 'bottom' ? railBot : railTop;
          const y1 = e.route === 'bottom' ? a.b : a.t;
          const y2 = e.route === 'bottom' ? b.b : b.t;
          d = 'M' + a.cx + ',' + y1 + ' L' + a.cx + ',' + rail + ' L' + b.cx + ',' + rail + ' L' + b.cx + ',' + y2;
          tip = [b.cx, y2]; ang = e.route === 'bottom' ? 270 : 90;
          lx = (a.cx + b.cx) / 2; ly = rail + (e.route === 'bottom' ? -2.5 : 8);
        } else if (Math.abs(a.cy - b.cy) < 4) {                   // 같은 행 — 수평
          const ltr = a.cx < b.cx;
          const x1 = ltr ? a.r : a.l, x2 = ltr ? b.l : b.r;
          const y = a.cy + dy;
          d = 'M' + x1 + ',' + y + ' L' + x2 + ',' + y;
          tip = [x2, y]; ang = ltr ? 0 : 180;
          lx = x1 + (x2 - x1) * (e.lt != null ? e.lt : 0.5); ly = y - 4.5;
        } else if (Math.abs(a.cx - b.cx) < 4) {                   // 같은 열 — 수직
          const ttb = a.cy < b.cy;
          const y1 = ttb ? a.b : a.t, y2 = ttb ? b.t : b.b;
          d = 'M' + a.cx + ',' + y1 + ' L' + b.cx + ',' + y2;
          tip = [b.cx, y2]; ang = ttb ? 90 : 270;
          lx = a.cx + 3; ly = (y1 + y2) / 2; anchor = 'start';
        } else {                                                  // 꺾어서
          const ltr = a.cx < b.cx;
          const x1 = ltr ? a.r : a.l, x2 = ltr ? b.l : b.r;
          const mx = x1 + (x2 - x1) * 0.45;
          d = 'M' + x1 + ',' + (a.cy + dy) + ' L' + mx + ',' + (a.cy + dy) +
              ' L' + mx + ',' + (b.cy + dy) + ' L' + x2 + ',' + (b.cy + dy);
          tip = [x2, b.cy + dy]; ang = ltr ? 0 : 180;
          lx = mx + (ltr ? 3 : -3); ly = (a.cy + b.cy) / 2 + dy;
          anchor = ltr ? 'start' : 'end';
        }
        add('path', { d: d, class: 'e-' + kind });
        // 라벨을 먼저 깔고 화살촉을 마지막에 얹어, 배경이 촉을 덮지 않게 한다
        if (e.label) {
          const t = add('text', { x: lx, y: ly, 'text-anchor': anchor, class: kind === 'err' ? 't-err' : '' }, e.label);
          const bb = t.getBBox();
          const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          bg.setAttribute('x', bb.x - 1.5); bg.setAttribute('y', bb.y - 0.5);
          bg.setAttribute('width', bb.width + 3); bg.setAttribute('height', bb.height + 1);
          bg.setAttribute('fill', '#FAF9F7');
          svg.insertBefore(bg, t);
        }
        const sz = 4;
        const pts = ang === 0 ? [[tip[0], tip[1]], [tip[0] - sz, tip[1] - sz * .6], [tip[0] - sz, tip[1] + sz * .6]]
                  : ang === 180 ? [[tip[0], tip[1]], [tip[0] + sz, tip[1] - sz * .6], [tip[0] + sz, tip[1] + sz * .6]]
                  : ang === 90 ? [[tip[0], tip[1]], [tip[0] - sz * .6, tip[1] - sz], [tip[0] + sz * .6, tip[1] - sz]]
                  : [[tip[0], tip[1]], [tip[0] - sz * .6, tip[1] + sz], [tip[0] + sz * .6, tip[1] + sz]];
        add('polygon', { points: pts.map(p => p.join(',')).join(' '), class: 'a-' + kind });
      });
    });

    document.querySelectorAll('.page[data-id]:not([data-id^="FLOW"]):not([data-id^="APPX"])').forEach(page => {
      const main = page.querySelector('main');
      const svg = page.querySelector('.wires');
      const mr = main.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + mr.width + ' ' + mr.height);
      main.querySelectorAll('.card').forEach(card => {
        const no = card.dataset.no;
        const region = main.querySelector('.region[data-no="' + no + '"]');
        if (!region) return;
        const c = card.getBoundingClientRect(), g = region.getBoundingClientRect();
        const cx = c.left + c.width / 2 - mr.left;
        const cy = c.top - mr.top;
        const pad = 10;
        const rx = Math.min(Math.max(cx, g.left - mr.left + pad), g.right - mr.left - pad);
        const ry = g.bottom - mr.top;
        const my = (ry + cy) / 2 > cy - 8 ? cy - 8 : (ry + cy) / 2;
        const d = 'M' + rx + ',' + ry + ' L' + rx + ',' + my + ' L' + cx + ',' + my + ' L' + cx + ',' + cy;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        svg.appendChild(path);
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', rx); dot.setAttribute('cy', ry); dot.setAttribute('r', 2);
        svg.appendChild(dot);
      });
    });
  });
</script>
</body></html>`;

const out = path.join(__dirname, '..', 'out', 'uiflow.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('wrote', out, `(${FLOWS.length} flow + ${PAGES.length} screen + 1 matrix = ${FLOWS.length + PAGES.length + 1} pages)`);
