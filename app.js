'use strict';

/* ================= 기본 데이터 ================= */
const CATEGORIES = ['마트', '편의점', '카페', '외식', '배달앱', '주유', '대중교통', '택시', '통신비',
  '온라인쇼핑', '구독(OTT)', '영화·문화', '병원·약국', '공과금·관리비', '교육', '해외', '일본', '기타'];
// '해외' 혜택은 '일본' 결제에도 적용
const FX_FEE = 1.3; // 일반 카드의 해외결제 수수료(브랜드+카드사) 대략치 %
const rulesOf = c => c.fxFree ? [...c.rules, { category: '해외', rate: FX_FEE, cap: 0 }] : c.rules;
const ruleMatches = (rc, cat) => rc === ALL || rc === cat || (rc === '해외' && cat === '일본');
const ALL = '전체';
const STORAGE_KEY = 'card-combo-v1';

const SAMPLE_CARDS = [
  { name: '예시 A · 생활할인', color: '#4f6ef7', minSpend: 300000, monthlyCap: 30000, annualFee: 15000, rules: [
    { category: '마트', rate: 10, cap: 10000 }, { category: '통신비', rate: 10, cap: 5000 },
    { category: '대중교통', rate: 10, cap: 5000 }, { category: '편의점', rate: 5, cap: 3000 } ] },
  { name: '예시 B · 카페·배달', color: '#e8833a', minSpend: 400000, monthlyCap: 25000, annualFee: 20000, rules: [
    { category: '카페', rate: 30, cap: 10000 }, { category: '배달앱', rate: 10, cap: 10000 },
    { category: '구독(OTT)', rate: 20, cap: 5000 } ] },
  { name: '예시 C · 무실적 적립', color: '#1a9b5c', minSpend: 0, monthlyCap: 0, annualFee: 10000, rules: [
    { category: ALL, rate: 1, cap: 0 }, { category: '온라인쇼핑', rate: 2, cap: 0 } ] },
  { name: '예시 D · 주유·교통', color: '#9b59b6', minSpend: 500000, monthlyCap: 20000, annualFee: 15000, rules: [
    { category: '주유', rate: 7, cap: 15000 }, { category: '택시', rate: 10, cap: 5000 },
    { category: '외식', rate: 5, cap: 5000 } ] },
];

/* ================= 상태 / 저장 ================= */
let state = { cards: [], spending: {}, progress: {} };
const thisMonth = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };

function uid() { return Math.random().toString(36).slice(2, 10); }
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = Object.assign({ cards: [], spending: {}, progress: {} }, JSON.parse(raw));
    if (!state.progress || state.progress.month !== thisMonth()) state.progress = { month: thisMonth(), spent: {} };
  } catch (e) { /* 저장소 사용 불가 시 메모리만 사용 */ }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
}
function normalizeCard(c) {
  return {
    id: c.id || uid(), name: String(c.name || '이름 없는 카드'), color: c.color || '#4f6ef7',
    minSpend: Math.max(0, +c.minSpend || 0), monthlyCap: Math.max(0, +c.monthlyCap || 0),
    annualFee: Math.max(0, +c.annualFee || 0),
    note: c.note ? String(c.note) : '', source: c.source || '',
    fxFree: !!c.fxFree, atmFree: !!c.atmFree, details: Array.isArray(c.details) ? c.details : null, jp: c.jp && typeof c.jp === 'object' ? c.jp : null,
    rules: (c.rules || []).map(r => ({ category: r.category, rate: Math.max(0, +r.rate || 0), cap: Math.max(0, +r.cap || 0) }))
      .filter(r => r.rate > 0 && (r.category === ALL || CATEGORIES.includes(r.category))),
  };
}

// 금액 입력칸: 쓰는 동안 1,000,000처럼 쉼표 표시
const toNum = v => Math.max(0, parseFloat(String(v ?? '').replace(/[^0-9.]/g, '')) || 0);
const fmtNum = (n, keepZero) => { n = +n || 0; return n || keepZero ? n.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : ''; };
document.addEventListener('input', e => {
  const el = e.target;
  if (!el.classList || !el.classList.contains('money')) return;
  const pos = el.selectionStart ?? el.value.length;
  const digitsBefore = el.value.slice(0, pos).replace(/[^0-9.]/g, '').length;
  let raw = el.value.replace(/[^0-9.]/g, '');
  const dot = raw.indexOf('.');
  if (dot >= 0) raw = raw.slice(0, dot + 1) + raw.slice(dot + 1).replace(/\./g, '');
  const [i, d] = raw.split('.');
  const intPart = i ? Number(i).toLocaleString('ko-KR') : (d !== undefined ? '0' : '');
  el.value = intPart + (d !== undefined ? '.' + d : '');
  let seen = 0, p = 0;
  while (p < el.value.length && seen < digitsBefore) { if (/[0-9.]/.test(el.value[p])) seen++; p++; }
  try { el.setSelectionRange(p, p); } catch (err) {}
}, true);
const won = n => Math.round(n).toLocaleString('ko-KR') + '원';
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/* ================= 혜택 계산 엔진 ================= */

// 한 카드에 카테고리별 금액이 배정됐을 때 받는 혜택 (규칙별 한도 + 카드 통합한도 적용)
function cardBenefit(card, amounts) {
  const remaining = Object.assign({}, amounts);
  const rules = [...rulesOf(card)].sort((a, b) => b.rate - a.rate);
  let total = 0;
  const byCat = {};
  let cardCapLeft = card.monthlyCap > 0 ? card.monthlyCap : Infinity;
  for (const rule of rules) {
    let ruleCapLeft = rule.cap > 0 ? rule.cap : Infinity;
    const cats = Object.keys(remaining).filter(k => ruleMatches(rule.category, k));
    for (const cat of cats) {
      const amt = remaining[cat] || 0;
      if (amt <= 0 || ruleCapLeft <= 0 || cardCapLeft <= 0) continue;
      const r = rule.rate / 100;
      const benefit = Math.min(amt * r, ruleCapLeft, cardCapLeft);
      const used = benefit / r;
      remaining[cat] = amt - used;
      ruleCapLeft -= benefit; cardCapLeft -= benefit;
      total += benefit;
      byCat[cat] = (byCat[cat] || 0) + benefit;
    }
  }
  return { total, byCat };
}

const sumObj = o => Object.values(o).reduce((a, b) => a + b, 0);

// 실적을 채울 카드 집합(active)이 정해졌을 때 소비를 배분
function allocateForSubset(active, spending) {
  const alloc = new Map(active.map(c => [c.id, {}]));
  const catRem = Object.assign({}, spending);
  const ruleCap = new Map(), cardCap = new Map();
  const entries = [];
  for (const c of active) {
    cardCap.set(c.id, c.monthlyCap > 0 ? c.monthlyCap : Infinity);
    rulesOf(c).forEach((r, i) => {
      const key = c.id + ':' + i;
      ruleCap.set(key, r.cap > 0 ? r.cap : Infinity);
      entries.push({ card: c, rule: r, key });
    });
  }
  // 1) 혜택률 높은 순으로 그리디 배정 (전용 혜택이 '전체' 기본적립보다 먼저)
  entries.sort((a, b) => b.rule.rate - a.rule.rate || (a.rule.category === ALL) - (b.rule.category === ALL));
  for (const { card, rule, key } of entries) {
    const r = rule.rate / 100;
    const cats = Object.keys(catRem).filter(k => ruleMatches(rule.category, k));
    for (const cat of cats) {
      let amt = catRem[cat] || 0;
      if (amt <= 0) continue;
      amt = Math.min(amt, ruleCap.get(key) / r, cardCap.get(card.id) / r);
      if (amt <= 0) continue;
      const a = alloc.get(card.id);
      a[cat] = (a[cat] || 0) + amt;
      catRem[cat] -= amt;
      ruleCap.set(key, ruleCap.get(key) - amt * r);
      cardCap.set(card.id, cardCap.get(card.id) - amt * r);
    }
  }
  // 2) 전월실적 부족분 채우기: 혜택 없는 남은 소비 → 그래도 부족하면 다른 카드에서 손실 최소로 이동
  const total = c => sumObj(alloc.get(c.id));
  for (const c of active) {
    let short = c.minSpend - total(c);
    for (const cat of Object.keys(catRem)) {
      if (short <= 0) break;
      const mv = Math.min(short, catRem[cat]);
      if (mv <= 0) continue;
      const a = alloc.get(c.id); a[cat] = (a[cat] || 0) + mv;
      catRem[cat] -= mv; short -= mv;
    }
    let guard = 0;
    while (short > 1e-6 && guard++ < 50) {
      let best = null;
      for (const d of active) {
        if (d === c) continue;
        const spare = total(d) - d.minSpend;
        if (spare <= 1e-6) continue;
        const da = alloc.get(d.id);
        for (const cat of Object.keys(da)) {
          const mv = Math.min(short, spare, da[cat]);
          if (mv <= 1e-6) continue;
          const before = cardBenefit(d, da).total + cardBenefit(c, alloc.get(c.id)).total;
          const dAfter = Object.assign({}, da, { [cat]: da[cat] - mv });
          const cAfter = Object.assign({}, alloc.get(c.id)); cAfter[cat] = (cAfter[cat] || 0) + mv;
          const loss = (before - cardBenefit(d, dAfter).total - cardBenefit(c, cAfter).total) / mv;
          if (!best || loss < best.loss) best = { d, cat, mv, loss };
        }
      }
      if (!best) return null; // 실적 조건을 동시에 채울 수 없음
      alloc.get(best.d.id)[best.cat] -= best.mv;
      const a = alloc.get(c.id); a[best.cat] = (a[best.cat] || 0) + best.mv;
      short -= best.mv;
    }
    if (short > 1e-6) return null;
  }
  // 3) 남은 소비는 추가 혜택이 가장 큰 카드로 (없으면 '아무 카드')
  const free = {};
  for (const cat of Object.keys(catRem)) {
    const amt = catRem[cat];
    if (amt <= 1e-6) continue;
    let best = null, bestGain = 1e-6;
    for (const c of active) {
      const a = alloc.get(c.id);
      const gain = cardBenefit(c, Object.assign({}, a, { [cat]: (a[cat] || 0) + amt })).total - cardBenefit(c, a).total;
      if (gain > bestGain) { bestGain = gain; best = c; }
    }
    if (best) { const a = alloc.get(best.id); a[cat] = (a[cat] || 0) + amt; }
    else free[cat] = amt;
  }
  let benefit = 0;
  const perCard = active.map(c => {
    const amounts = alloc.get(c.id);
    for (const k of Object.keys(amounts)) if (amounts[k] < 0.5) delete amounts[k];
    const b = cardBenefit(c, amounts);
    benefit += b.total;
    return { card: c, amounts, spent: sumObj(amounts), benefit: b.total, byCat: b.byCat };
  });
  return { benefit, perCard, free };
}

// 모든 '실적 채울 카드 조합'을 시도하여 최대 혜택 조합 선택
function optimize(cards, spending) {
  const sp = {};
  for (const [k, v] of Object.entries(spending)) if (+v > 0) sp[k] = +v;
  const totalSpend = sumObj(sp);
  const n = cards.length;
  const limit = Math.min(n, 14);
  let best = null;
  const results = [];
  for (let mask = 0; mask < (1 << limit); mask++) {
    const active = cards.filter((_, i) => i < limit && (mask >> i) & 1);
    if (active.reduce((s, c) => s + c.minSpend, 0) > totalSpend + 1e-6) continue;
    const r = allocateForSubset(active, sp);
    if (!r) continue;
    r.active = active;
    results.push(r);
    if (!best || r.benefit > best.benefit + 1e-6 ||
        (Math.abs(r.benefit - best.benefit) < 1e-6 && active.length < best.active.length)) best = r;
  }
  // 비교용: 혜택이 가장 좋은 '카드 한 장'만 쓸 때
  let bestSingle = null;
  for (const r of results) if (r.active.length === 1 && (!bestSingle || r.benefit > bestSingle.benefit)) bestSingle = r;
  return { best, bestSingle, totalSpend, spending: sp };
}

/* ================= 화면: 탭 ================= */
function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
  if (name === 'result') renderResult();
  if (name === 'quick') renderQuick();
  if (name === 'japan') renderJapan();
  try { sessionStorage.setItem('card-combo-tab', name); } catch (e) {}
}
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));

/* ================= 화면: 내 카드 ================= */
function ruleText(r) {
  return `${esc(r.category)} ${r.rate}%` + (r.cap > 0 ? ` <span class="muted">(월 ${won(r.cap)}까지)</span>` : '');
}
function progressHTML(c) {
  const spent = (state.progress.spent || {})[c.id] || 0;
  const left = Math.max(0, c.minSpend - spent);
  const pct = Math.min(100, spent / c.minSpend * 100);
  return `<div class="progress">
    <label>이번 달(${state.progress.month.slice(5)}월) 이 카드로 쓴 돈
      <input type="text" inputmode="numeric" class="money" autocomplete="off" data-progress="${c.id}" value="${fmtNum(spent)}" placeholder="카드사 앱에서 확인"></label>
    <div class="bar"><span style="width:${pct}%;${left ? '' : 'background:var(--good)'}"></span></div>
    <div class="small" data-progress-msg="${c.id}">${left ? `다음 달 혜택까지 <b>${won(left)}</b> 더 쓰면 돼요` : '<span class="ok">✔ 다음 달 혜택 조건 충족</span>'}</div>
  </div>`;
}
function renderCards() {
  const list = document.getElementById('card-list');
  document.getElementById('card-count').textContent = state.cards.length ? `(${state.cards.length}장)` : '';
  if (!state.cards.length) {
    list.innerHTML = `<div class="empty" style="grid-column:1/-1">아직 등록된 카드가 없어요.<br>‘+ 카드 추가’로 내 카드를 넣거나, ‘예시 카드 불러오기’로 둘러보세요.</div>`;
    return;
  }
  list.innerHTML = state.cards.map(c => `
    <article class="ccard">
      <div class="stripe" style="background:${esc(c.color)}"></div>
      <div class="body">
        <h3>${esc(c.name)}</h3>
        <div class="meta">
          <span class="chip">전월실적 ${c.minSpend ? won(c.minSpend) : '없음'}</span>
          <span class="chip">통합한도 ${c.monthlyCap ? won(c.monthlyCap) : '무제한'}</span>
          ${c.annualFee ? `<span class="chip">연회비 ${won(c.annualFee)}</span>` : ''}
          ${c.fxFree ? `<span class="chip">해외 수수료 면제</span>` : ''}
          ${c.source ? `<span class="chip src">${esc(c.source)}</span>` : ''}
        </div>
        <ul>${c.rules.length ? c.rules.map(r => `<li>${ruleText(r)}</li>`).join('') : '<li class="muted">혜택 없음</li>'}</ul>
        ${c.minSpend ? progressHTML(c) : ''}
        ${c.note ? `<p class="note">${esc(c.note)}</p>` : ''}
        ${c.details ? `<details class="detail"><summary>혜택 자세히 보기</summary><div class="table-wrap"><table>
          <thead><tr><th>어디서</th><th>혜택</th><th>한도</th><th>조건</th></tr></thead>
          <tbody>${c.details.map(d => `<tr><td>${esc(d.what)}</td><td>${esc(d.benefit)}</td><td>${esc(d.limit)}</td><td class="muted">${esc(d.cond)}</td></tr>`).join('')}</tbody>
        </table></div></details>` : ''}
      </div>
      <div class="actions">
        <button data-edit="${c.id}">수정</button>
        <button data-dup="${c.id}">복제</button>
        <button data-del="${c.id}" class="danger">삭제</button>
      </div>
    </article>`).join('');
}
document.getElementById('card-list').addEventListener('change', e => {
  const id = e.target.dataset.progress; if (!id) return;
  state.progress.spent = state.progress.spent || {};
  state.progress.spent[id] = toNum(e.target.value); save(); renderCards();
});
document.getElementById('card-list').addEventListener('click', e => {
  const t = e.target;
  if (t.dataset.edit) openDialog(state.cards.find(c => c.id === t.dataset.edit));
  if (t.dataset.dup) {
    const src = state.cards.find(c => c.id === t.dataset.dup);
    state.cards.push(normalizeCard(Object.assign(JSON.parse(JSON.stringify(src)), { id: null, name: src.name + ' (복사)' })));
    save(); renderCards();
  }
  if (t.dataset.del) {
    if (t.dataset.armed) { state.cards = state.cards.filter(c => c.id !== t.dataset.del); save(); renderCards(); }
    else { t.dataset.armed = '1'; t.textContent = '정말 삭제?'; setTimeout(() => { if (t.isConnected) { delete t.dataset.armed; t.textContent = '삭제'; } }, 3000); }
  }
});
document.getElementById('add-card').addEventListener('click', () => openDialog(null));
function loadSamples() {
  SAMPLE_CARDS.forEach(c => state.cards.push(normalizeCard(JSON.parse(JSON.stringify(c)))));
  if (!sumObj(state.spending)) state.spending = { '마트': 250000, '카페': 40000, '배달앱': 80000, '외식': 150000,
    '대중교통': 60000, '통신비': 55000, '온라인쇼핑': 200000, '구독(OTT)': 17000, '주유': 100000, '기타': 100000 };
  save(); renderCards(); renderSpend();
}
document.getElementById('load-sample').addEventListener('click', loadSamples);
const banner = document.getElementById('sample-banner');
function hideBanner() { banner.hidden = true; }
document.getElementById('clear-sample').addEventListener('click', () => {
  state = { cards: [], spending: {}, progress: { month: thisMonth(), spent: {} } }; save(); renderCards(); renderSpend(); hideBanner();
});

/* ---- 카드 편집 다이얼로그 ---- */
const dlg = document.getElementById('card-dialog');
const form = document.getElementById('card-form');
let editingId = null;
const catOptions = sel => [ALL, ...CATEGORIES].map(c => `<option ${c === sel ? 'selected' : ''}>${c}</option>`).join('');
function addRuleRow(r = { category: '마트', rate: 5, cap: 0 }) {
  const div = document.createElement('div');
  div.className = 'rule-row';
  div.innerHTML = `
    <label>카테고리<select data-f="category">${catOptions(r.category)}</select></label>
    <label>할인·적립 %<input data-f="rate" type="number" min="0" step="any" value="${r.rate}"></label>
    <label>월 한도(원, 0=무제한)<input data-f="cap" type="text" inputmode="numeric" class="money" autocomplete="off" value="${fmtNum(r.cap)}"></label>
    <button type="button" title="삭제" aria-label="혜택 삭제">✕</button>`;
  div.querySelector('button').addEventListener('click', () => div.remove());
  document.getElementById('rule-rows').appendChild(div);
}
let pendingMeta = { note: '', source: '', jp: null, atmFree: false, details: null };
function fillForm(c) {
  form.elements.name.value = c.name || '';
  for (const k of ['minSpend', 'monthlyCap', 'annualFee']) form.elements[k].value = fmtNum(c[k] ?? 0, true);
  form.elements.fxFree.checked = !!c.fxFree;
  if (c.color) form.elements.color.value = c.color;
  document.getElementById('rule-rows').innerHTML = '';
  (c.rules || []).forEach(addRuleRow);
  pendingMeta = { note: c.note || '', source: c.source || '', jp: c.jp || null, atmFree: !!c.atmFree, details: c.details || null };
  const n = document.getElementById('dlg-note');
  n.hidden = !c.note && !c.source;
  n.innerHTML = (c.source ? `<b>${esc(c.source)}</b> ` : '') + esc(c.note || '');
}
const SYN = [['sol','쏠'],['trip','트립'],['travel','트래블'],['check','체크'],['zero','제로'],['smile','스마일'],
  ['edition','에디션'],['mileage','마일리지'],['skypass','스카이패스'],['super','슈퍼'],['shopping','쇼핑'],['loca','로카'],
  ['likit','라이킷'],['deep','딥'],['dream','드림'],['haru','하루'],['zgm','지금'],['life','라이프'],['taptap','탭탭'],
  ['wonder','원더'],['nori','노리'],['platinum','플래티넘'],['select','셀렉트'],['japan','일본'],['card','카드'],
  ['shinhan','신한'],['samsung','삼성'],['hyundai','현대'],['woori','우리'],['lotte','롯데'],['hana','하나'],['kb','국민'],['nh','농협'],
  ['솔','쏠'],['정석','정석']];
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const norm = s => String(s).toLowerCase().replace(/[^0-9a-z가-힣ㄱ-ㅎ]/g, '');
const kor = s => SYN.reduce((t, [a, b]) => t.split(a).join(b), norm(s));
const chosung = s => [...s].map(ch => { const c = ch.charCodeAt(0) - 0xac00; return c >= 0 && c < 11172 ? CHO[Math.floor(c / 588)] : ch; }).join('');
const STOP = new Set(['카드', 'card', '체크카드', '신용카드']);
const HAY = CARD_DB.map(c => {
  const raw = [c.name, c.issuer, ...(c.aliases || [])].map(x => kor(x)).join('|') + '|' + [c.name, ...(c.aliases || [])].map(norm).join('|');
  return { raw, cho: chosung(raw) };
});
const bigrams = s => { const r = new Set(); for (let i = 0; i < s.length - 1; i++) r.add(s.slice(i, i + 2)); return r; };
function searchDB(q) {
  const tokens = q.split(/\s+/).map(t => t.trim()).filter(t => norm(t) && !STOP.has(norm(t)));
  if (!tokens.length) return { hits: [], close: false };
  const scored = CARD_DB.map((c, i) => {
    const h = HAY[i];
    let score = 0;
    for (const t of tokens) {
      const a = norm(t), k = kor(t);
      if (!a) continue;
      if (h.raw.includes(a) || h.raw.includes(k)) score += 2;
      else if (/^[ㄱ-ㅎ]+$/.test(a) && h.cho.includes(a)) score += 2;
      else {
        const bg = bigrams(k); let hit = 0; const hb = bigrams(h.raw);
        bg.forEach(b => { if (hb.has(b)) hit++; });
        if (bg.size && hit / bg.size >= 0.5) score += 1;
      }
    }
    return { c, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  if (!scored.length) return { hits: [], close: false };
  const full = tokens.length * 2;
  const exact = scored.filter(x => x.score >= full);
  return exact.length ? { hits: exact.map(x => x.c), close: false } : { hits: scored.slice(0, 6).map(x => x.c), close: true };
}
const sInput = document.getElementById('card-search');
const sList = document.getElementById('search-results');
function renderSearch() {
  const q = sInput.value.trim();
  const { hits, close } = searchDB(q);
  let html = '';
  if (!q) html = `<button type="button" class="linkish" id="show-all">등록된 카드 ${CARD_DB.length}종 전체 보기</button>`;
  if (close) html += `<p class="muted small">딱 맞는 카드는 없어요. 비슷한 카드:</p>`;
  html += hits.map((c, i) => `<button type="button" class="hit" data-hit="${CARD_DB.indexOf(c)}">
      <span class="dot" style="background:${esc(c.color)}"></span><span>${esc(c.name)}</span>
      <span class="muted small">${c.minSpend ? '실적 ' + won(c.minSpend) : '실적 없음'}</span></button>`).join('');
  if (q && !hits.length) html += `<p class="muted small">목록에 없는 카드예요.</p>`;
  if (q && close && !aiSample) html += `<p class="muted small">찾는 카드가 없으면 아래 칸에 직접 입력해 주세요.</p>`;
  if (q && aiSample) html += `<button type="button" class="hit ai" id="ai-find">AI에게 “${esc(q)}” 혜택 찾아달라고 하기</button>`;
  if (q && !aiSample && !hits.length) html += `<p class="muted small">아래 칸에 직접 입력해 주세요.</p>`;
  sList.innerHTML = html;
}
function renderAll() {
  const byIssuer = {};
  CARD_DB.forEach((c, i) => (byIssuer[c.issuer] = byIssuer[c.issuer] || []).push(i));
  sList.innerHTML = Object.keys(byIssuer).sort().map(iss => `<p class="small" style="margin-top:6px"><b>${esc(iss)}</b></p>` +
    byIssuer[iss].map(i => `<button type="button" class="hit" data-hit="${i}"><span class="dot" style="background:${esc(CARD_DB[i].color)}"></span><span>${esc(CARD_DB[i].name)}</span></button>`).join('')).join('');
}
sInput.addEventListener('input', renderSearch);
sList.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.hit) {
    const c = CARD_DB[+b.dataset.hit];
    fillForm(Object.assign({}, c, { source: CARD_DB_DATE + ' 기준 자동 입력' }));
    sList.innerHTML = `<p class="ok small">“${esc(c.name)}” 혜택을 채웠어요. 확인하고 저장을 누르세요.</p>`;
  }
  if (b.id === 'ai-find') aiFind(sInput.value.trim());
  if (b.id === 'show-all') renderAll();
});

let aiSample = null;
(async () => {
  try { if (window.claude && window.claude.use) aiSample = await window.claude.use('sample'); } catch (e) { aiSample = null; }
})();
let aiCtl = null;
async function aiFind(q) {
  if (!aiSample) return;
  aiCtl?.abort(); aiCtl = new AbortController();
  sList.innerHTML = `<p class="small">AI가 “${esc(q)}” 혜택을 정리하는 중이에요… (10~60초)</p>`;
  const prompt = `한국 신용/체크카드 "${q}"의 혜택을 아는 만큼 정리해 JSON 하나로만 답해. 설명 문장 금지.
형식: {"found":true|false,"name":"정식 카드명","minSpend":전월실적(원,없으면0),"monthlyCap":월통합할인한도(원,없거나모르면0),"annualFee":국내전용연회비(원),
"rules":[{"category":카테고리,"rate":할인또는적립률(%숫자),"cap":그항목월한도(원,0=무제한)}],"note":"단순화한 조건·시간/요일 제한·확실하지 않은 부분을 한두 문장으로"}
category는 반드시 다음 중 하나: ${['전체', ...CATEGORIES].join(', ')}. 모든 결제 기본 적립은 "전체".
리터당 할인은 리터당원/1700*100 %로 환산. 정액 할인은 대표 결제금액 기준 %로 환산하고 note에 적어.
그 카드를 모르면 {"found":false}.`;
  try {
    const r = await aiSample.json(prompt, { signal: aiCtl.signal, modelTier: 'default' });
    if (!r || !r.found) { sList.innerHTML = `<p class="muted small">AI도 이 카드를 찾지 못했어요. 카드 이름을 정확히 적거나, 아래에 직접 입력해 주세요.</p>`; return; }
    fillForm(Object.assign({}, normalizeCard(r), { note: r.note || '', source: 'AI 추정 · 꼭 확인 필요' }));
    sList.innerHTML = `<p class="warn small">AI가 기억하는 정보로 채웠어요. 오래됐거나 틀릴 수 있으니 카드사 앱과 비교해 보세요.</p>`;
  } catch (e) {
    const m = { not_granted: 'AI 사용을 허용하지 않아서 찾지 못했어요. 아래에 직접 입력해 주세요.',
      rate_limited: '요청이 많아요. 잠시 후 다시 눌러 주세요.', aborted: '취소했어요.' };
    sList.innerHTML = `<p class="muted small">${m[e && e.code] || 'AI에게 물어보지 못했어요. 아래에 직접 입력해 주세요.'}</p>`;
  }
}

function openDialog(card) {
  editingId = card ? card.id : null;
  sInput.value = ''; renderSearch();
  document.getElementById('search-box').hidden = !!card;
  pendingMeta = card ? { note: card.note, source: card.source, jp: card.jp, atmFree: card.atmFree, details: card.details } : { note: '', source: '', jp: null, atmFree: false, details: null };
  const n = document.getElementById('dlg-note'); n.hidden = true;
  document.getElementById('dlg-title').textContent = card ? '카드 수정' : '카드 추가';
  form.reset();
  document.getElementById('rule-rows').innerHTML = '';
  if (card) {
    for (const k of ['name', 'color']) form.elements[k].value = card[k];
    for (const k of ['minSpend', 'monthlyCap', 'annualFee']) form.elements[k].value = fmtNum(card[k], true);
    form.elements.fxFree.checked = !!card.fxFree;
    card.rules.forEach(addRuleRow);
  } else addRuleRow();
  dlg.showModal();
  if (!card) sInput.focus();
}
document.getElementById('add-rule').addEventListener('click', () => addRuleRow());
document.getElementById('dlg-cancel').addEventListener('click', () => dlg.close());
dlg.addEventListener('close', () => aiCtl?.abort());
form.addEventListener('submit', () => {
  const rules = [...document.querySelectorAll('#rule-rows .rule-row')].map(row => ({
    category: row.querySelector('[data-f=category]').value,
    rate: row.querySelector('[data-f=rate]').value,
    cap: toNum(row.querySelector('[data-f=cap]').value),
  }));
  const data = normalizeCard({
    id: editingId, name: form.elements.name.value, color: form.elements.color.value,
    minSpend: toNum(form.elements.minSpend.value), monthlyCap: toNum(form.elements.monthlyCap.value),
    annualFee: toNum(form.elements.annualFee.value), rules, note: pendingMeta.note, source: pendingMeta.source,
    fxFree: form.elements.fxFree.checked, atmFree: pendingMeta.atmFree, jp: pendingMeta.jp, details: pendingMeta.details,
  });
  const i = state.cards.findIndex(c => c.id === editingId);
  if (i >= 0) state.cards[i] = data; else state.cards.push(data);
  save(); renderCards();
  if (!banner.hidden) banner.querySelector('p').textContent = '예시 카드는 ‘삭제’로 지우고 내 카드만 남기면 돼요.';
});

/* ---- 백업/복원 ---- */
const ioText = document.getElementById('io-text');
const ioMsg = document.getElementById('io-msg');
function importJSON(text) {
  try {
    const data = JSON.parse(text);
    state = { cards: (data.cards || []).map(normalizeCard), spending: data.spending || {}, progress: { month: thisMonth(), spent: {} } };
    save(); renderCards(); renderSpend(); hideBanner(); ioMsg.textContent = '불러오기 완료! 카드 ' + state.cards.length + '장을 불러왔어요.';
  } catch (err) { ioMsg.textContent = '읽을 수 없는 내용이에요. 내보내기로 만든 글자를 그대로 붙여넣어 주세요.'; }
}
document.getElementById('export').addEventListener('click', async () => {
  ioText.value = JSON.stringify(state, null, 2);
  try { await navigator.clipboard.writeText(ioText.value); ioMsg.textContent = '복사했어요. 메모장 등에 붙여넣어 보관하세요.'; }
  catch (e) { ioText.select(); ioMsg.textContent = '아래 글자를 전부 선택해서 복사해 보관하세요.'; }
});
document.getElementById('import-text').addEventListener('click', () => importJSON(ioText.value));
document.getElementById('import').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  importJSON(await file.text()); e.target.value = '';
});
document.getElementById('reset').addEventListener('click', e => {
  const b = e.currentTarget;
  if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = '한 번 더 누르면 전부 지워져요'; setTimeout(() => { delete b.dataset.armed; b.textContent = '전체 초기화'; }, 3000); return; }
  delete b.dataset.armed; b.textContent = '전체 초기화';
  state = { cards: [], spending: {}, progress: { month: thisMonth(), spent: {} } }; save(); renderCards(); renderSpend(); hideBanner(); ioMsg.textContent = '모두 지웠어요.';
});

/* ================= 화면: 월 소비 ================= */
function renderSpend() {
  const box = document.getElementById('spend-form');
  box.innerHTML = CATEGORIES.map(c => `
    <label>${c}<input type="text" inputmode="numeric" class="money" autocomplete="off" data-cat="${c}" value="${fmtNum(state.spending[c])}" placeholder="0"></label>`).join('');
  updateSpendTotal();
}
function updateSpendTotal() {
  document.getElementById('spend-total').textContent = won(sumObj(state.spending));
}
document.getElementById('spend-form').addEventListener('input', e => {
  const cat = e.target.dataset.cat; if (!cat) return;
  const v = toNum(e.target.value);
  if (v) state.spending[cat] = v; else delete state.spending[cat];
  save(); updateSpendTotal();
});
document.getElementById('go-result').addEventListener('click', () => showTab('result'));

/* ================= 화면: 최적 조합 ================= */
function renderResult() {
  const el = document.getElementById('result');
  if (!state.cards.length) { el.innerHTML = `<div class="empty">먼저 ‘① 내 카드’에서 카드를 등록하세요.</div>`; return; }
  if (!sumObj(state.spending)) { el.innerHTML = `<div class="empty">‘② 월 소비’에서 이번 달 예상 소비를 입력하세요.</div>`; return; }

  const { best, bestSingle, totalSpend } = optimize(state.cards, state.spending);
  if (!best) { el.innerHTML = `<div class="empty">계산할 수 있는 조합이 없어요.</div>`; return; }
  const rate = totalSpend ? best.benefit / totalSpend * 100 : 0;
  const extra = bestSingle ? best.benefit - bestSingle.benefit : best.benefit;
  const feeMonthly = state.cards.reduce((s, c) => s + c.annualFee, 0) / 12;
  const skipped = state.cards.filter(c => !best.active.includes(c));

  let html = `<h2>이번 달 최적 조합</h2>
  <div class="summary">
    <div class="stat"><div class="muted small">월 예상 혜택</div><div class="v good">${won(best.benefit)}</div></div>
    <div class="stat"><div class="muted small">실질 혜택률</div><div class="v">${rate.toFixed(2)}%</div></div>
    <div class="stat"><div class="muted small">카드 1장만 쓸 때보다</div><div class="v">${extra > 0 ? '+' + won(extra) : '차이 없음'}</div></div>
    <div class="stat"><div class="muted small">연회비 월 환산 (보유 전체)</div><div class="v">${won(feeMonthly)}</div></div>
  </div>`;

  // 카테고리별 추천 카드
  const catRows = [];
  for (const cat of Object.keys(state.spending)) {
    const parts = best.perCard.filter(p => p.amounts[cat] > 0)
      .map(p => `<span class="dot" style="background:${esc(p.card.color)}"></span> ${esc(p.card.name)} ${won(p.amounts[cat])}`);
    if (best.free[cat]) parts.push(`<span class="muted">아무 카드 ${won(best.free[cat])}</span>`);
    catRows.push(`<tr><td>${esc(cat)}</td><td class="num">${won(state.spending[cat])}</td><td>${parts.join('<br>')}</td></tr>`);
  }
  html += `<div class="box"><h3>카테고리별로 이 카드로 결제하세요</h3><div class="table-wrap"><table>
    <thead><tr><th>카테고리</th><th class="num">월 소비</th><th>결제 카드</th></tr></thead>
    <tbody>${catRows.join('')}</tbody></table></div></div>`;

  // 카드별 상세
  for (const p of best.perCard) {
    const c = p.card;
    const pct = c.minSpend ? Math.min(100, p.spent / c.minSpend * 100) : 100;
    const capPct = c.monthlyCap ? Math.min(100, p.benefit / c.monthlyCap * 100) : 0;
    html += `<div class="box">
      <h3><span class="dot" style="background:${esc(c.color)}"></span>${esc(c.name)}
        <span class="chip">혜택 ${won(p.benefit)}</span>
        <span class="chip ${p.benefit * 12 - c.annualFee >= 0 ? '' : 'bad'}">1년 순이익 ${won(p.benefit * 12 - c.annualFee)}</span></h3>
      <div class="small">사용액 ${won(p.spent)} · 전월실적 ${c.minSpend ? won(c.minSpend) : '없음'}
        ${c.minSpend ? (p.spent + 0.5 >= c.minSpend ? '<span class="ok">✔ 충족</span>' : '<span class="warn">✘ 부족</span>') : ''}</div>
      ${c.minSpend ? `<div class="bar"><span style="width:${pct}%"></span></div>` : ''}
      ${c.monthlyCap ? `<div class="small" style="margin-top:6px">통합한도 사용 ${won(p.benefit)} / ${won(c.monthlyCap)}</div>
        <div class="bar"><span style="width:${capPct}%;background:var(--good)"></span></div>` : ''}
      <div class="table-wrap" style="margin-top:8px"><table>
        <thead><tr><th>카테고리</th><th class="num">결제액</th><th class="num">혜택</th></tr></thead>
        <tbody>${Object.keys(p.amounts).map(cat => `<tr><td>${esc(cat)}</td><td class="num">${won(p.amounts[cat])}</td>
          <td class="num">${p.byCat[cat] ? won(p.byCat[cat]) : '<span class="muted">실적용</span>'}</td></tr>`).join('')}</tbody>
      </table></div></div>`;
  }

  // 팁
  const tips = [];
  for (const c of skipped) {
    tips.push(`<b>${esc(c.name)}</b>은(는) 이번 달 소비 패턴에서는 실적을 채우는 것보다 다른 카드에 몰아주는 게 더 이득이에요` +
      (c.annualFee ? ` (연회비 ${won(c.annualFee)}를 감안해 해지/교체도 검토해 보세요)` : '') + '.');
  }
  for (const p of best.perCard) {
    if (p.card.monthlyCap && p.benefit >= p.card.monthlyCap - 1)
      tips.push(`<b>${esc(p.card.name)}</b>은(는) 통합한도를 다 채웠어요. 추가 소비는 다른 카드로 결제하세요.`);
    const yearly = p.benefit * 12 - p.card.annualFee;
    if (p.card.annualFee && yearly < 0) tips.push(`<b>${esc(p.card.name)}</b>의 연간 혜택(${won(p.benefit * 12)})이 연회비보다 적어요.`);
  }
  if (Object.keys(best.free).length) tips.push('‘아무 카드’로 표시된 금액은 어느 카드로 결제해도 추가 혜택이 없는 금액입니다.');
  if (state.cards.length > 14) tips.push('카드가 14장을 넘어 앞의 14장만 조합 계산에 사용했어요.');
  if (tips.length) html += `<div class="box"><h3>참고</h3><ul class="tips">${tips.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
  html += `<p class="muted small">계산은 입력한 규칙을 단순화한 추정치입니다. 실적 제외 업종, 건당/횟수 한도, 할인받은 금액의 실적 제외 등 세부 조건은 반영되지 않아요.</p>`;
  el.innerHTML = html;
}

/* ================= 화면: 지금 뭐로 결제? ================= */
const qCat = document.getElementById('q-cat');
qCat.innerHTML = CATEGORIES.map(c => `<option>${c}</option>`).join('');
function renderQuick() {
  const el = document.getElementById('quick-result');
  if (!state.cards.length) { el.innerHTML = `<div class="empty">먼저 카드를 등록하세요.</div>`; return; }
  const cat = qCat.value, amt = toNum(document.getElementById('q-amt').value);
  const ranked = state.cards.map(c => ({ c, b: cardBenefit(c, { [cat]: amt }).total }))
    .sort((a, b) => b.b - a.b);
  el.innerHTML = ranked.map((r, i) => `
    <div class="rank ${i === 0 && r.b > 0 ? 'first' : ''}">
      <span class="n">${i + 1}</span><span class="dot" style="background:${esc(r.c.color)}"></span>
      <span class="name">${esc(r.c.name)}<br><span class="muted small">${r.c.minSpend ? '전월실적 ' + won(r.c.minSpend) + ' 충족 시' : '실적 조건 없음'}</span></span>
      <span class="amt ${r.b > 0 ? 'ok' : 'muted'}">${r.b > 0 ? won(r.b) : '혜택 없음'}</span>
    </div>`).join('') +
    `<p class="muted small">이번 달 이미 쓴 한도는 고려하지 않은 최대 혜택 기준입니다.</p>`;
}
qCat.addEventListener('change', renderQuick);
document.getElementById('q-amt').addEventListener('input', renderQuick);

/* ================= 화면: 일본 여행 ================= */
const JP_ITEMS = [
  { key: 'donki', label: '돈키호테 쇼핑', hint: '면세 쇼핑, 기념품' },
  { key: 'conv', label: '편의점', hint: '세븐일레븐·로손·패밀리마트' },
  { key: 'food', label: '식당·이자카야', hint: '' },
  { key: 'cafe', label: '카페(스타벅스 등)', hint: '' },
  { key: 'transit', label: '교통(전철·버스·IC카드 충전)', hint: '스이카·파스모 충전은 카드 결제가 안 될 때가 많아요' },
  { key: 'shop', label: '그 밖의 쇼핑', hint: '백화점·드럭스토어·유니클로' },
  { key: 'hotel', label: '숙박(일반 호텔)', hint: '현장 결제분' },
  { key: 'hoshino', label: '호시노 리조트 숙박', hint: '' },
  { key: 'atm', label: '현금 인출(ATM)', hint: '현금만 받는 가게·교통 충전용' },
];
const JP_KEY = 'card-combo-japan';
let jpSpend = {};
try { jpSpend = JSON.parse(localStorage.getItem(JP_KEY) || '{}') || {}; } catch (e) { jpSpend = {}; }
const JP_USED_KEY = 'card-combo-japan-used';
let jpUsed = {};
try { jpUsed = JSON.parse(localStorage.getItem(JP_USED_KEY) || '{}') || {}; } catch (e) { jpUsed = {}; }
const jpUsedSave = () => { try { localStorage.setItem(JP_USED_KEY, JSON.stringify(jpUsed)); } catch (e) {} };
const JP_META_KEY = 'card-combo-japan-meta';
let jpMeta = { date: '', unit: 'krw' };
try { jpMeta = Object.assign(jpMeta, JSON.parse(localStorage.getItem(JP_META_KEY) || '{}')); } catch (e) {}
const jpMetaSave = () => { try { localStorage.setItem(JP_META_KEY, JSON.stringify(jpMeta)); } catch (e) {} };
const jpSave = () => { try { localStorage.setItem(JP_KEY, JSON.stringify(jpSpend)); } catch (e) {} };

// 카드 c로 일본에서 item을 결제할 때의 순혜택률(%) 후보들: [{rate, cap, label, needMin}]
function jpOptions(c, item) {
  if (item === 'atm') {
    if (c.atmFree) return [{ rate: 0, net: 0, cap: 0, needMin: 0, label: '외화통장에서 인출', feeNote: 'ATM 수수료 면제' }];
    return [{ rate: 0, net: -4.3, cap: 0, needMin: 0, label: '현금서비스 수수료·이자 발생', feeNote: '비추천' }];
  }
  const fee = c.fxFree ? 0 : FX_FEE;
  const opts = [];
  const jp = c.jp || {};
  const expired = o => o && o.until && jpMeta.date && jpMeta.date > o.until;
  if (jp[item] && !expired(jp[item])) opts.push(Object.assign({ needMin: c.minSpend, key: item }, jp[item]));
  if (jp.all) opts.push(Object.assign({ needMin: c.minSpend, key: 'all' }, jp.all));
  // 일반 규칙: '일본' > '해외' > 전체
  // 일반 규칙('일본'·'해외'·전체)도 각자 한도를 지키며 후보로. 일본 전용 정보(jp.all)가 있으면 '일본' 규칙은 중복이라 제외
  for (const r of c.rules) {
    const ok = r.category === '해외' || r.category === ALL || (r.category === '일본' && !jp.all) || (item === 'transit' && r.category === '대중교통' && !jp.transit);
    if (ok && r.rate > 0) opts.push({ rate: r.rate, cap: r.cap, needMin: c.minSpend, key: 'rule:' + r.category, label: `${r.category} ${r.rate}%` + (r.cap ? ` (월 ${won(r.cap)}까지)` : '') });
  }
  opts.push({ rate: 0, cap: 0, needMin: 0, key: 'none', label: c.fxFree ? '할인 없음' : '혜택 없음' });
  return opts.map(o => Object.assign(o, { net: o.rate - fee, feeNote: fee ? `해외수수료 약 ${fee}% 차감` : '수수료 면제' }));
}

function planJapan() {
  const plan = [];
  const capUsed = new Map(); // card.id|혜택키 -> 이미/이번에 사용한 혜택액
  for (const [k, v] of Object.entries(jpUsed)) if (+v > 0) capUsed.set(k, +v);
  const items = JP_ITEMS.filter(it => (+jpSpend[it.key] || 0) > 0);
  for (const it of items) {
    let left = +jpSpend[it.key];
    const parts = [];
    let guard = 0;
    while (left > 0.5 && guard++ < 20) {
      let best = null;
      for (const c of state.cards) {
        for (const o of jpOptions(c, it.key)) {
          const k = c.id + '|' + (o.key || o.label);
          const used = capUsed.get(k) || 0;
          let amt = left;
          if (o.cap > 0 && o.rate > 0) amt = Math.min(left, (o.cap - used) / (o.rate / 100));
          if (amt <= 0.5) continue;
          if (!best || o.net > best.o.net) best = { c, o, amt, k };
        }
      }
      if (!best) break;
      const benefit = best.amt * best.o.net / 100;
      if (best.o.cap > 0 && best.o.rate > 0) capUsed.set(best.k, (capUsed.get(best.k) || 0) + best.amt * best.o.rate / 100);
      parts.push({ card: best.c, amt: best.amt, net: best.o.net, benefit, label: best.o.label, feeNote: best.o.feeNote, needMin: best.o.needMin ?? best.c.minSpend });
      left -= best.amt;
    }
    plan.push({ item: it, parts });
  }
  return plan;
}

// 한도가 있는 일본 혜택: 이미 받은 금액 입력
function capBenefits() {
  const list = [];
  for (const c of state.cards) {
    if (!c.jp) continue;
    for (const [k, o] of Object.entries(c.jp)) {
      if (!o || typeof o !== 'object' || !(o.cap > 0)) continue;
      list.push({ c, k, o, id: c.id + '|' + k });
    }
  }
  return list;
}
function renderUsed() {
  const box = document.getElementById('jp-used');
  const list = capBenefits();
  if (!list.length) { box.innerHTML = ''; return; }
  box.innerHTML = `<details class="box used-box" ${list.some(x => +jpUsed[x.id] > 0) ? 'open' : ''}>
    <summary><b>이미 받은 혜택이 있나요?</b> <span class="muted small">— 올해·이번 반기에 벌써 쓴 한도를 빼고 계산해요</span></summary>
    <div class="used-list">${list.map(x => {
      const used = Math.min(+jpUsed[x.id] || 0, x.o.cap);
      const left = x.o.cap - used;
      return `<div class="used-row">
        <div><span class="dot" style="background:${esc(x.c.color)}"></span> <b>${esc(x.c.name)}</b><div class="muted small">${esc(x.o.label || x.k)} · 한도 ${won(x.o.cap)}</div></div>
        <label>이미 받은 혜택(원)<input type="text" inputmode="numeric" class="money" autocomplete="off" data-used="${esc(x.id)}" value="${fmtNum(used)}" placeholder="0"></label>
        <div class="used-act"><button type="button" data-full="${esc(x.id)}" data-cap="${x.o.cap}">${used >= x.o.cap ? '다 썼어요 ✓' : '다 썼어요'}</button>
          <span class="small ${left > 0 ? 'ok' : 'warn'}">남은 한도 ${won(left)}</span></div>
      </div>`;
    }).join('')}</div></details>`;
}
document.getElementById('jp-used').addEventListener('change', e => {
  const id = e.target.dataset.used; if (!id) return;
  jpUsed[id] = toNum(e.target.value); jpUsedSave(); renderUsed(); renderJapan(false);
});
document.getElementById('jp-used').addEventListener('click', e => {
  const b = e.target.closest('button[data-full]'); if (!b) return;
  const id = b.dataset.full, cap = +b.dataset.cap;
  jpUsed[id] = (+jpUsed[id] || 0) >= cap ? 0 : cap; jpUsedSave(); renderUsed(); renderJapan(false);
});

const isYen = () => jpMeta.unit === 'jpy' && yenRate > 0;
const toUnit = krw => isYen() ? Math.round(krw / yenRate * 100) : krw;
const fromUnit = v => isYen() ? v * yenRate / 100 : v;
function renderJapanForm() {
  renderUsed();
  document.getElementById('jp-date').value = jpMeta.date || '';
  document.querySelectorAll('[name=jp-unit]').forEach(r => { r.checked = r.value === (jpMeta.unit || 'krw'); });
  document.getElementById('jp-unit-note').textContent = isYen() ? `엔화로 입력 중 (100엔 = ${won(yenRate)}, 아래 ‘환율’에서 바꿀 수 있어요)` : '원화로 입력 중 (1만엔 ≈ ' + won(yenRate * 100) + ')';
  document.getElementById('jp-form').innerHTML = JP_ITEMS.map(it => `
    <label>${it.label} ${isYen() ? '(¥)' : '(원)'}${it.hint ? `<span class="hint">${it.hint}</span>` : ''}
      <input type="text" inputmode="numeric" class="money" autocomplete="off" id="jp-${it.key}" data-jp="${it.key}" value="${fmtNum(toUnit(jpSpend[it.key] || 0))}" placeholder="0"></label>`).join('');
  renderTripPrep();
}
document.getElementById('jp-date').addEventListener('change', e => { jpMeta.date = e.target.value; jpMetaSave(); renderJapan(); });
document.querySelectorAll('[name=jp-unit]').forEach(r => r.addEventListener('change', e => { jpMeta.unit = e.target.value; jpMetaSave(); renderJapan(); }));

// 여행 준비: 출발 전달 실적 + 기한 지난 혜택
function renderTripPrep() {
  const el = document.getElementById('jp-prep');
  if (!jpMeta.date || !state.cards.length) { el.innerHTML = jpMeta.date ? '' : '<p class="muted small">여행 날짜를 넣으면 “언제까지 어느 카드로 얼마를 써 둬야 하는지”와 끝나는 혜택을 알려줘요.</p>'; return; }
  const d = new Date(jpMeta.date + 'T00:00:00');
  const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const prevKey = prev.getFullYear() + '-' + String(prev.getMonth() + 1).padStart(2, '0');
  const items = [];
  const needCards = state.cards.filter(c => c.minSpend > 0 && (c.jp || c.rules.some(r => ['일본', '해외'].includes(r.category))));
  for (const c of needCards) {
    let msg = `<b>${esc(c.name)}</b>: ${prev.getMonth() + 1}월 한 달 동안 국내에서 <b>${won(c.minSpend)}</b> 이상 써 두세요.`;
    if (prevKey === state.progress.month) {
      const spent = (state.progress.spent || {})[c.id] || 0;
      const left = Math.max(0, c.minSpend - spent);
      msg += left ? ` 지금까지 ${won(spent)} → <span class="warn">${won(left)} 남음</span>` : ' <span class="ok">✔ 이미 채웠어요</span>';
    } else if (prevKey < state.progress.month) {
      msg += ' <span class="muted">(이미 지난달이에요. 그때 채웠는지 카드사 앱에서 확인하세요)</span>';
    }
    items.push(msg);
  }
  for (const c of state.cards) for (const [k, o] of Object.entries(c.jp || {})) {
    if (o && o.until && jpMeta.date > o.until) items.push(`<span class="warn">${esc(c.name)}의 “${esc(o.label || k)}”은(는) ${o.until}에 끝나서 이번 여행 계산에서 뺐어요.</span>`);
  }
  el.innerHTML = items.length ? `<div class="box"><h3>출발 전 할 일</h3><ul class="tips">${items.map(t => `<li>${t}</li>`).join('')}</ul></div>` : '';
}
document.getElementById('jp-form').addEventListener('input', e => {
  const k = e.target.dataset.jp; if (!k) return;
  const v = fromUnit(toNum(e.target.value));
  if (v) jpSpend[k] = v; else delete jpSpend[k];
  jpSave(); renderJapan(false);
});
document.getElementById('jp-sample').addEventListener('click', () => {
  jpSpend = { donki: 150000, conv: 60000, food: 300000, cafe: 30000, transit: 80000, shop: 200000, hotel: 0, atm: 100000 };
  jpSave(); renderJapanForm(); renderJapan(false);
});

function renderJapan(withForm = true) {
  if (withForm) { renderJapanForm(); renderWallets(); } else renderWalletCheck();
  const el = document.getElementById('jp-result');
  if (!state.cards.length) { el.innerHTML = `<div class="empty">먼저 ‘① 내 카드’에서 카드를 등록하세요.</div>`; return; }
  const total = JP_ITEMS.reduce((s, it) => s + (+jpSpend[it.key] || 0), 0);
  if (!total) { el.innerHTML = `<div class="empty">위에 여행 예상 경비를 넣거나 ‘예시 경비 넣기’를 눌러 보세요.</div>`; return; }
  const plan = planJapan();
  const sumBenefit = plan.reduce((s, p) => s + p.parts.reduce((a, x) => a + x.benefit, 0), 0);
  // 비교: 수수료 있는 일반 카드 1장(혜택 0%)으로 모두 결제
  const naive = -(total - (+jpSpend.atm || 0)) * FX_FEE / 100 - (+jpSpend.atm || 0) * 0.043;
  const used = new Map();
  plan.forEach(p => p.parts.forEach(x => used.set(x.card.id, (used.get(x.card.id) || 0) + x.amt)));

  let html = `<div class="summary">
    <div class="stat"><div class="muted small">여행 경비 합계</div><div class="v">${won(total)}</div>${yenRate ? `<div class="muted small">약 ${yen(total / yenRate * 100)}</div>` : ''}</div>
    <div class="stat"><div class="muted small">이 조합으로 아끼는 돈</div><div class="v ${sumBenefit >= 0 ? 'good' : ''}">${won(sumBenefit)}</div></div>
    <div class="stat"><div class="muted small">아무 신용카드로 다 긁을 때보다</div><div class="v">+${won(sumBenefit - naive)}</div></div>
  </div>`;
  html += `<div class="box"><h3>챙겨 갈 카드</h3><ul class="tips">${[...used.entries()].map(([id, amt]) => {
    const c = state.cards.find(x => x.id === id);
    return `<li><span class="dot" style="background:${esc(c.color)}"></span> <b>${esc(c.name)}</b> — ${won(amt)} 결제${c.fxFree ? ' · 해외 수수료 면제' : ''}</li>`;
  }).join('')}</ul></div>`;
  html += `<div class="box"><h3>어디서 어떤 카드로?</h3><div class="table-wrap"><table>
    <thead><tr><th>어디서</th><th>결제 카드</th><th class="num">금액</th><th class="num">아끼는 돈</th></tr></thead><tbody>` +
    plan.map(p => p.parts.map((x, i) => `<tr>
      <td>${i === 0 ? esc(p.item.label) : ''}</td>
      <td><span class="dot" style="background:${esc(x.card.color)}"></span> ${esc(x.card.name)}
        <div class="muted small">${esc(x.label)} · ${esc(x.feeNote)}${x.needMin ? ` · 지난달 국내 ${won(x.needMin)} 이상 사용 필요` : ''}</div></td>
      <td class="num">${won(x.amt)}</td>
      <td class="num ${x.benefit < 0 ? 'warn' : 'ok'}">${won(x.benefit)}</td></tr>`).join('')).join('') +
    `</tbody></table></div></div>`;
  const tips = [
    '결제할 때 “원화(KRW)로 결제할까요?”라고 물으면 꼭 <b>엔화(JPY)</b>를 고르세요. 원화로 결제하면 3~8% 수수료가 더 붙어요.',
    '일본은 아직 현금만 받는 가게가 있어요. 현금은 <b>ATM 수수료 면제 카드</b>로 세븐일레븐 ATM에서 뽑는 게 가장 저렴해요.',
    '‘지난달 국내 ○원 이상 사용 필요’가 붙은 혜택은 출국 전달에 그 카드로 국내 결제를 채워야 받을 수 있어요.',
  ];
  if (!state.cards.some(c => c.atmFree) && +jpSpend.atm) tips.push('지금 카드 중에는 ATM 수수료 면제 카드가 없어요. SOL트래블 체크 같은 트래블 체크카드가 있으면 현금 인출 비용을 줄일 수 있어요.');
  html += `<div class="box"><h3>일본 결제 꿀팁</h3><ul class="tips">${tips.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
  html += `<p class="muted small">해외 수수료는 약 ${FX_FEE}%로 가정했어요. 포인트·마일 적립은 할인과 같은 가치로 계산했고, 실적 조건은 지난달 기준이라 이번 여행 계산에는 경고로만 표시해요.</p>`;
  el.innerHTML = html;
}

/* ================= 일본 여행: 엔화 지갑 · 현금 인출 ================= */
const WALLETS = {
  sol: { name: '신한 SOL트래블 외화예금', cards: 'SOL트래블 체크 · SOL트래블J 체크',
    rate: '엔화 환전 시 환율 100% 우대', atm: '세븐뱅크(세븐일레븐)·이온 ATM 인출 수수료 면제 (월 1만 달러 한도). 단, 현지 ATM 운영사 수수료는 붙을 수 있어요.',
    back: '남은 엔화를 원화로 바꿀 때 조건은 SOL뱅크 앱에서 확인하세요.' },
  hana: { name: '하나 트래블로그 (하나머니)', cards: '트래블로그 체크/신용',
    rate: '엔화 충전 시 환율 100% 우대', atm: '세븐뱅크(세븐일레븐) ATM 출금 무료로 많이 쓰여요.', back: '재환전 수수료 약 1%' },
  tw: { name: '트래블월렛', cards: '트래블월렛 카드',
    rate: '충전 시 환율 우대', atm: '이온 ATM 출금 무료 (월 횟수·금액 한도 있음)', back: '팔 때는 은행이 사는 가격으로 계산돼 약간 손해' },
  toss: { name: '토스뱅크 외화통장', cards: '토스뱅크 체크카드',
    rate: '살 때·팔 때 환율 우대', atm: 'ATM 수수료 조건은 앱에서 확인 필요 (브랜드 수수료가 붙을 수 있다는 자료가 있어요)', back: '재환전 수수료 0원 (가장 유리)' },
  cash: { name: '은행 창구에서 현금 엔화로 환전', cards: '-',
    rate: '은행·우대율에 따라 다름', atm: '이미 현금이라 ATM 필요 없음', back: '남은 지폐는 다시 은행에서 원화로 (동전은 대부분 안 바꿔줘요)' },
  credit: { name: '신용카드 원화 결제계좌 (엔화 충전 없음)', cards: '신용카드',
    rate: '결제할 때 카드사 환율 + 해외수수료(면제 카드 제외)', atm: '신용카드로 현금 인출은 현금서비스(수수료+이자)라 비추천',
    back: '-' },
  etc: { name: '기타 (직접 입력)', cards: '-', rate: '-', atm: '조건을 카드사 앱에서 확인하세요.', back: '-' },
};
const WALLET_KEY = 'card-combo-wallets';
let wallets = [], yenRate = 930;
try { const w = JSON.parse(localStorage.getItem(WALLET_KEY) || 'null'); if (w) { wallets = w.wallets || []; yenRate = +w.yenRate || 930; } } catch (e) {}
const walletSave = () => { try { localStorage.setItem(WALLET_KEY, JSON.stringify({ wallets, yenRate })); } catch (e) {} };
const yen = n => '¥' + Math.round(n).toLocaleString('ko-KR');

function renderWallets() {
  const box = document.getElementById('wallet-box');
  const cardOpts = sel => `<option value="">연결 카드 없음</option>` + state.cards.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  const typeOpts = sel => Object.entries(WALLETS).map(([k, w]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(w.name)}</option>`).join('');
  let html = `<div class="wallet-top">
      <label>환율 (100엔당 원)<input type="text" inputmode="numeric" class="money" autocomplete="off" id="yen-rate" value="${fmtNum(yenRate)}"></label>
      <span class="muted small">환전할 때 앱에 나온 환율을 넣으면 더 정확해요.</span></div>`;
  html += wallets.map((w, i) => {
    const info = WALLETS[w.type] || WALLETS.etc;
    return `<div class="wallet" data-i="${i}">
      <div class="wallet-row">
        <label>어디에 환전해 뒀나요?<select data-w="type">${typeOpts(w.type)}</select></label>
        ${w.type === 'credit' ? `<label>결제 은행·계좌<input data-w="memo" value="${esc(w.memo || '')}" placeholder="예: NH농협 주거래 통장"></label>`
          : `<label>엔화 금액(¥)<input type="text" inputmode="numeric" class="money" autocomplete="off" data-w="amount" value="${fmtNum(w.amount)}" placeholder="예: 30,000"></label>`}
        <label>이 돈이 빠지는 카드<select data-w="card">${cardOpts(w.card)}</select></label>
        <button type="button" data-w-del="${i}" aria-label="지갑 삭제">✕</button>
      </div>
      ${w.type === 'etc' ? `<label>메모 (은행 이름, 조건 등)<input data-w="memo" value="${esc(w.memo || '')}"></label>` : ''}
      <ul class="wallet-info">
        ${w.type === 'credit' ? '' : `<li><b>원화로 약</b> ${won((+w.amount || 0) * yenRate / 100)}</li>`}
        <li><b>쓰는 카드</b> ${esc(info.cards)}</li>
        <li><b>환전</b> ${esc(info.rate)}</li>
        <li><b>현금 인출</b> ${esc(info.atm)}</li>
        <li><b>남은 엔화</b> ${esc(info.back)}</li>
      </ul></div>`;
  }).join('');
  html += `<button type="button" id="add-wallet">+ 환전해 둔 곳 추가</button>`;
  box.innerHTML = html;
  renderWalletCheck();
}
const wb = document.getElementById('wallet-box');
wb.addEventListener('change', e => {
  if (e.target.id === 'yen-rate') { yenRate = toNum(e.target.value); walletSave(); renderJapan(); return; }
  const row = e.target.closest('.wallet'); if (!row) return;
  const w = wallets[+row.dataset.i]; const f = e.target.dataset.w; if (!f) return;
  w[f] = f === 'amount' ? toNum(e.target.value) : e.target.value;
  walletSave(); renderWallets();
});
wb.addEventListener('click', e => {
  if (e.target.id === 'add-wallet') {
    const sol = state.cards.find(c => /SOL트래블/.test(c.name));
    wallets.push({ type: sol ? 'sol' : 'hana', amount: 0, card: sol ? sol.id : '' }); walletSave(); renderWallets();
  }
  if (e.target.dataset.wDel !== undefined) { wallets.splice(+e.target.dataset.wDel, 1); walletSave(); renderWallets(); }
});

// 계획과 지갑 잔액 비교
function renderWalletCheck() {
  const el = document.getElementById('wallet-check');
  const total = JP_ITEMS.reduce((s, it) => s + (+jpSpend[it.key] || 0), 0);
  if (!state.cards.length || !total || !yenRate) { el.innerHTML = ''; return; }
  const plan = planJapan();
  const needByCard = new Map(); let atmByCard = new Map();
  plan.forEach(p => p.parts.forEach(x => {
    needByCard.set(x.card.id, (needByCard.get(x.card.id) || 0) + x.amt);
    if (p.item.key === 'atm') atmByCard.set(x.card.id, (atmByCard.get(x.card.id) || 0) + x.amt);
  }));
  const toYen = krw => krw / yenRate * 100;
  const rows = [];
  for (const [id, krw] of needByCard) {
    const c = state.cards.find(x => x.id === id); if (!c) continue;
    const creditW = wallets.find(w => w.card === id && w.type === 'credit');
    const linked = wallets.filter(w => w.card === id && w.type !== 'credit');
    const have = linked.reduce((s, w) => s + (+w.amount || 0), 0);
    const need = toYen(krw);
    let status;
    if (linked.length) {
      const diff = have - need;
      status = diff >= 0 ? `<span class="ok">충분해요 (약 ${yen(diff)} 남음)</span>` : `<span class="warn">약 ${yen(-diff)} 부족 → 출발 전 앱에서 더 충전하세요</span>`;
    } else if (c.fxFree && /체크/.test(c.name)) {
      status = `<span class="warn">연결된 엔화 지갑이 없어요. 위에서 환전해 둔 곳을 추가하세요.</span>`;
    } else {
      status = `<span class="muted">엔화 충전 없이 결제돼요. 다음 달 결제일에 원화로 ${creditW && creditW.memo ? '<b>' + esc(creditW.memo) + '</b>' : '연결 계좌'}에서 빠져요.</span>`;
    }
    rows.push(`<tr><td><span class="dot" style="background:${esc(c.color)}"></span> ${esc(c.name)}</td>
      <td class="num">${yen(need)}<div class="muted small">${won(krw)}</div>${atmByCard.get(id) ? `<div class="muted small">그중 현금 인출 ${yen(toYen(atmByCard.get(id)))}</div>` : ''}</td>
      <td class="num">${linked.length ? yen(have) : '-'}</td><td>${status}</td></tr>`);
  }
  // 현금 인출 안내
  const atmKrw = +jpSpend.atm || 0;
  const cashTips = [];
  if (atmKrw) {
    const atmCard = plan.find(p => p.item.key === 'atm')?.parts[0]?.card;
    const w = atmCard && wallets.find(x => x.card === atmCard.id);
    const info = w ? WALLETS[w.type] : null;
    cashTips.push(`현금 ${yen(toYen(atmKrw))}(약 ${won(atmKrw)})은 <b>${atmCard ? esc(atmCard.name) : '수수료 면제 카드'}</b>로 뽑으세요.` + (info ? ` ${esc(info.atm)}` : ''));
    cashTips.push('ATM 화면에서 언어를 한국어로 바꿀 수 있어요. “계좌 종류”를 물으면 보통 <b>Savings(예금)</b>를 고르세요.');
    cashTips.push('ATM이 “원화로 환산해 드릴까요?(Conversion)”라고 물으면 <b>거절(엔화 그대로)</b>을 누르세요.');
    cashTips.push('여러 번 조금씩 뽑으면 현지 ATM 수수료가 매번 붙을 수 있어요. 필요한 만큼 한 번에 뽑는 게 좋아요.');
    if (state.cards.every(c => !c.atmFree)) cashTips.push('<span class="warn">ATM 수수료 면제 카드가 없어요. 신용카드로 뽑으면 현금서비스(수수료+이자)가 돼요. 출발 전 은행에서 현금으로 환전해 가세요.</span>');
  }
  el.innerHTML = `<div class="box"><h3>내 엔화, 충분할까?</h3>
    <p class="muted small">위 결제 계획대로 쓰면 카드별로 이만큼 빠져요. (100엔 = ${won(yenRate)} 기준)</p>
    <div class="table-wrap"><table><thead><tr><th>카드</th><th class="num">쓸 돈</th><th class="num">충전해 둔 엔화</th><th>상태</th></tr></thead>
    <tbody>${rows.join('')}</tbody></table></div></div>` +
    (cashTips.length ? `<div class="box"><h3>현지에서 현금 뽑을 때</h3><ul class="tips">${cashTips.map(t => `<li>${t}</li>`).join('')}</ul></div>` : '');
}

/* ================= 시작 ================= */
let firstVisit = true;
try { firstVisit = localStorage.getItem(STORAGE_KEY) === null; } catch (e) {}
load();
if (!state.progress || state.progress.month !== thisMonth()) state.progress = { month: thisMonth(), spent: {} };
state.cards = state.cards.map(normalizeCard);
if (firstVisit && !state.cards.length) { loadSamples(); banner.hidden = false; }
renderCards();
renderSpend();
try { const t = sessionStorage.getItem('card-combo-tab'); if (t) showTab(t); } catch (e) {}
