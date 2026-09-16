// UI Flow 상세 페이지 빌더 — data.cjs 를 읽어 A4 가로 HTML 을 생성한다.
// 레이아웃: 화면 캡처 전폭 상단 + 압축 주석 카드 1행 하단.
// 사용: node techdoc/uiflow/build.cjs  →  techdoc/out/uiflow.html

const fs = require('fs');
const path = require('path');
const { PAGES } = require('./data.cjs');

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
    <div class="region r-${n.kind}" data-no="${n.no}" style="left:${n.rect[0]}%;top:${(n.rect[1] / crop).toFixed(2)}%;width:${n.rect[2]}%;height:${(n.rect[3] / crop).toFixed(2)}%">
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

  .cardrow { display: flex; gap: 3.5mm; margin-top: 9mm; align-items: stretch; }
  .card { flex: 1; min-width: 0; border-radius: 3px; padding: 3.2mm 3.2mm; }
  .card.k-api  { background: #fff; border: 0.3mm solid var(--hair); }
  .card.k-ui   { background: rgba(15,40,84,.055); }
  .card.k-rule { background: rgba(189,232,245,.32); }
  .card-head { display: flex; align-items: center; gap: 1.8mm; }
  .kind { font-size: 6.6pt; letter-spacing: .1em; color: var(--sky); font-weight: 700;
          margin: 1.1mm 0 0 5.8mm; }
  .ct { font-size: 9.6pt; font-weight: 700; color: var(--navy); }
  .api-line { font-family: var(--mono); font-size: 7.8pt; color: var(--blue); font-weight: 600;
              margin: 1mm 0 0 5.8mm; overflow-wrap: anywhere; }
  .cd { font-size: 9pt; line-height: 1.55; color: #3A4454; margin: 1.3mm 0 0 5.8mm; }

  .wires { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .wires path { fill: none; stroke: var(--sky); stroke-width: 1.1; opacity: .85; }
  .wires circle { fill: var(--sky); }

  /* ── footer ── */
  footer { display: flex; align-items: center; gap: 4mm; border-top: 0.3mm solid var(--hair);
           margin-top: 3.5mm; padding-top: 2.2mm; font-size: 8pt; color: #3A4454; white-space: nowrap; }
  .fcell { display: flex; align-items: center; gap: 1.6mm; flex: none; }
  .fcell:last-child { flex: 1; min-width: 0; }
  .fcell:last-child .fx { white-space: normal; }
  .fcell + .fcell { border-left: 0.3mm solid var(--hair); padding-left: 4mm; }
  .legend { color: #5A6474; }
  .legend .n { margin-left: 2mm; }
  .legend .n:first-child { margin-left: 0; }
  .flabel { font-size: 7pt; letter-spacing: .12em; color: #8A93A1; font-weight: 700; white-space: nowrap; }
  .fx { color: var(--ink); }
  .mono { font-family: var(--mono); font-size: 7.8pt; }
  .arr { color: var(--sky); }
  footer b.mono { color: var(--navy); }
</style></head><body>
${PAGES.map(renderPage).join('\n')}
<script>
  // 참조 영역 하단 → 카드 상단을 직교선으로 잇는다.
  // 영역이 넓으면 카드와 가장 가까운 x 지점에 앵커를 잡아 선을 거의 수직으로 유지한다.
  addEventListener('load', () => {
    document.querySelectorAll('.page').forEach(page => {
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
console.log('wrote', out, `(${PAGES.length} page)`);
