'use strict';

/* ================= 기본 데이터 ================= */
const KEY = 'jp-planner-v1';
const TYPES = ['관광', '식사', '카페', '쇼핑', '이동', '숙소', '기타'];
const tcolor = t => `var(--t-${TYPES.includes(t) ? t : '기타'})`;

const CITIES = {
  도쿄: [['센소지', '관광'], ['시부야 스크램블 교차로', '관광'], ['시부야 스카이', '관광'], ['메이지 신궁', '관광'],
    ['하라주쿠 다케시타 거리', '쇼핑'], ['도쿄 타워', '관광'], ['도쿄 스카이트리', '관광'], ['츠키지 장외시장', '식사'],
    ['신주쿠 오모이데요코초', '식사'], ['아키하바라', '쇼핑'], ['긴자', '쇼핑'], ['우에노 공원', '관광'], ['오다이바', '관광'],
    ['선샤인시티', '쇼핑'], ['팀랩 플래닛', '관광']],
  오사카: [['도톤보리', '관광'], ['오사카성', '관광'], ['유니버설 스튜디오 재팬', '관광'], ['구로몬 시장', '식사'],
    ['신세카이', '관광'], ['우메다 스카이빌딩', '관광'], ['신사이바시스지', '쇼핑'], ['가이유칸', '관광'], ['하루카스 300', '관광']],
  교토: [['후시미 이나리', '관광'], ['기요미즈데라', '관광'], ['아라시야마 대나무숲', '관광'], ['금각사', '관광'],
    ['기온', '관광'], ['니시키 시장', '식사'], ['산넨자카', '쇼핑'], ['철학의 길', '관광'], ['니조성', '관광']],
  나라: [['나라 공원', '관광'], ['도다이지', '관광'], ['가스가타이샤', '관광'], ['나라마치', '관광']],
  후쿠오카: [['나카스 야타이', '식사'], ['다자이후 텐만구', '관광'], ['캐널시티 하카타', '쇼핑'], ['오호리 공원', '관광'],
    ['텐진 지하상가', '쇼핑'], ['후쿠오카 타워', '관광'], ['모모치 해변', '관광']],
  삿포로: [['오도리 공원', '관광'], ['니조 시장', '식사'], ['오타루 운하', '관광'], ['삿포로 맥주 박물관', '관광'],
    ['스스키노', '식사'], ['모이와산 전망대', '관광']],
  오키나와: [['국제거리', '쇼핑'], ['추라우미 수족관', '관광'], ['슈리성', '관광'], ['만좌모', '관광'], ['아메리칸 빌리지', '쇼핑'], ['고우리 대교', '관광']],
  나고야: [['나고야성', '관광'], ['아쓰타 신궁', '관광'], ['오스 상점가', '쇼핑'], ['지브리 파크', '관광']],
  요코하마: [['미나토미라이', '관광'], ['차이나타운', '식사'], ['아카렌가 창고', '쇼핑'], ['컵누들 뮤지엄', '관광']],
  하코네: [['오와쿠다니', '관광'], ['아시노코 해적선', '관광'], ['하코네 신사', '관광']],
};
const CITY_ALIAS = { 동경: '도쿄', 나하: '오키나와', 하카타: '후쿠오카', 삿뽀로: '삿포로', 오타루: '삿포로' };
const KNOWN_PLACES = Object.entries(CITIES).flatMap(([c, l]) => l.map(([n, t]) => ({ name: n, type: t, city: c })));
// 흔한 다른 표기·오타 → 정식 이름
const PLACE_ALIAS = {
  센소사: '센소지', 아사쿠사: '센소지', 유니버셜: '유니버설 스튜디오 재팬', 유니버설: '유니버설 스튜디오 재팬', USJ: '유니버설 스튜디오 재팬',
  유니버설스튜디오: '유니버설 스튜디오 재팬', 금각: '금각사', 킨카쿠지: '금각사', 청수사: '기요미즈데라', 기요미즈: '기요미즈데라',
  기요미즈데라: '기요미즈데라', 후시미: '후시미 이나리', 이나리: '후시미 이나리', 스카이트리: '도쿄 스카이트리', 도쿄타워: '도쿄 타워',
  시부야스카이: '시부야 스카이', 스크램블: '시부야 스크램블 교차로', 메이지진구: '메이지 신궁', 다케시타: '하라주쿠 다케시타 거리',
  츠키지: '츠키지 장외시장', 쓰키지: '츠키지 장외시장', 오모이데요코쵸: '신주쿠 오모이데요코초', 아라시야마: '아라시야마 대나무숲',
  치쿠린: '아라시야마 대나무숲', 니시키: '니시키 시장', 구로몬: '구로몬 시장', 쿠로몬: '구로몬 시장', 도톤보루: '도톤보리',
  하루카스: '하루카스 300', 아베노하루카스: '하루카스 300', 공중정원: '우메다 스카이빌딩', 캐널시티: '캐널시티 하카타', 커널시티: '캐널시티 하카타',
  다자이후: '다자이후 텐만구', 야타이: '나카스 야타이', 오호리: '오호리 공원', 츄라우미: '추라우미 수족관', 츠라우미: '추라우미 수족관',
  팀랩: '팀랩 플래닛', 선샤인: '선샤인시티', 썬샤인시티: '선샤인시티', 해적선: '아시노코 해적선', 오와쿠다니: '오와쿠다니',
};

const DEFAULT_PACK = {
  필수: ['여권 (유효기간 확인)', 'Visit Japan Web 등록', '항공권 e-티켓', '숙소 예약 확인', '여행자보험'],
  돈: ['엔화 현금 / 트래블카드', '해외결제 되는 카드', '동전 지갑'],
  전자기기: ['돼지코 (A타입 11자)', '보조배터리 (기내 반입)', 'eSIM·유심', '충전기·케이블'],
  생활: ['상비약', '세면도구', '편한 신발', '접이식 우산', '에코백'],
};

const PHRASES = [
  ['こんにちは', '곤니치와', '안녕하세요'], ['ありがとうございます', '아리가토- 고자이마스', '감사합니다'],
  ['すみません', '스미마셍', '저기요 / 실례합니다'], ['これをください', '코레오 쿠다사이', '이거 주세요'],
  ['いくらですか', '이쿠라 데스카', '얼마예요?'], ['カードは使えますか', '카-도와 츠카에마스카', '카드 되나요?'],
  ['二人です', '후타리 데스', '두 명이에요'], ['おすすめは何ですか', '오스스메와 난 데스카', '추천 메뉴는요?'],
  ['韓国語のメニューはありますか', '캉코쿠고노 메뉴-와 아리마스카', '한국어 메뉴 있나요?'],
  ['お会計お願いします', '오카이케- 오네가이시마스', '계산해 주세요'], ['トイレはどこですか', '토이레와 도코 데스카', '화장실 어디예요?'],
  ['おいしいです', '오이시- 데스', '맛있어요'], ['助けてください', '타스케테 쿠다사이', '도와주세요'],
];

/* ================= 유틸 ================= */
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => +String(v ?? '').replace(/[^\d.]/g, '') || 0;
const fmt = n => Math.round(n).toLocaleString('ko-KR');
const won = n => fmt(n) + '원';
const yen = n => fmt(n) + '엔';
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const DAY = 86400000;
const parseDate = s => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const today = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dshort = d => `${d.getMonth() + 1}/${d.getDate()} ${WEEK[d.getDay()]}`;
const dlong = d => `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEK[d.getDay()]})`;
const diffDays = (a, b) => Math.round((b - a) / DAY);
const squash = s => String(s || '').replace(/\s+/g, '').toUpperCase();

/* ================= 상태 ================= */
function freshState() {
  const pack = [];
  for (const [g, list] of Object.entries(DEFAULT_PACK)) list.forEach(t => pack.push({ id: uid(), group: g, text: t, done: false }));
  return { trip: { title: '', start: '', end: '', people: 2, rate: 930, cities: [] }, days: [], extras: [], flights: [], stays: [], geo: {}, geoMiss: [], pack, sample: false, lastDay: 0 };
}
let state = freshState();
let firstVisit = true;
try {
  const raw = localStorage.getItem(KEY);
  firstVisit = raw === null;
  const s = JSON.parse(raw || 'null');
  if (s && s.trip) state = Object.assign(freshState(), s);
} catch (e) {}
// 이전에 끝나지 않은 장소 확인은 정리
state.days.forEach(d => d.items.forEach(it => { if (it.cands === 'loading') delete it.cands; }));
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };
let editingId = null;

function tripLength(st = state) {
  const s = parseDate(st.trip.start), e = parseDate(st.trip.end);
  if (!s) return 0;
  if (!e || e < s) return 1;
  return Math.min(60, diffDays(s, e) + 1);
}
function syncDays(st = state) {
  const n = tripLength(st);
  while (st.days.length < n) st.days.push({ id: uid(), city: st.trip.cities[0] || '', items: [] });
  while (st.days.length > Math.max(n, 1) && !st.days[st.days.length - 1].items.length) st.days.pop();
}
const toKRW = (amount, cur) => cur === 'jpy' ? amount * state.trip.rate / 100 : amount;

/* ================= 장소 인식 · 후보 ================= */
function lev(a, b) {
  const m = a.length, n = b.length; if (!m || !n) return m || n;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
const canon = title => {
  const p = squash(placeOf(title));
  for (const [a, n] of Object.entries(PLACE_ALIAS)) if (squash(a) === p) return squash(n);
  const k = knownPlace(title); return k ? squash(k.name) : p;
};
const knownByName = name => KNOWN_PLACES.find(p => squash(p.name) === squash(name));
// 정확히 아는 장소면 그 정보를, 아니면 null
function knownPlace(place) {
  const p = squash(place); if (p.length < 2) return null;
  for (const k of KNOWN_PLACES) if (p.includes(squash(k.name))) return k;
  return null;
}
// 오타·줄임말에 대한 후보 (기기 안에서 계산)
function localCands(place) {
  const p = squash(place); if (p.length < 2) return [];
  const scores = new Map();
  const add = (name, score) => { if (score > (scores.get(name) || 0)) scores.set(name, score); };
  for (const [alias, name] of Object.entries(PLACE_ALIAS)) {
    const a = squash(alias);
    if (p.includes(a) && a.length >= 2) add(name, 0.9);
    else { const s = 1 - lev(p, a) / Math.max(p.length, a.length); if (s >= 0.6) add(name, s); }
  }
  for (const k of KNOWN_PLACES) {
    const a = squash(k.name);
    const s = 1 - lev(p, a) / Math.max(p.length, a.length);
    if (s >= 0.6) add(k.name, s);
    else if (a.includes(p) && p.length >= 2) add(k.name, 0.7);
  }
  return [...scores.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([name]) => {
    const k = knownByName(name) || {};
    return { name, area: k.city || '', note: '', type: k.type || '' };
  });
}

/* ================= 자유 입력 해석 ================= */
const ORD = { 첫: 1, 둘: 2, 두: 2, 셋: 3, 세: 3, 넷: 4, 네: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10 };
const D = String.raw`(?:(\d{4})\s*[./-]\s*)?(\d{1,2})\s*(?:[./-]|월\s*)(\d{1,2})(?![\d:])\s*일?`;
const RE_RANGE = new RegExp(String.raw`(?<![\d¥￥,.])` + D + String.raw`\s*(?:~|〜|～|–|-|부터)\s*(?:(\d{1,2})\s*(?:[./-]|월\s*))?(\d{1,2})(?![\d:])\s*일?(?:\s*까지)?`);
const RE_DATE = new RegExp(String.raw`^(?<![\d¥￥,.])` + D + String.raw`(?!\s*(?:만|천|엔|円|원|%))`);
const RE_DATE_ANY = new RegExp(String.raw`(?<![\d¥￥,.A-Za-z])` + D + String.raw`(?!\s*(?:만|천|엔|円|원|%))`);
const TIME_SRC = String.raw`(?:(오전|오후|아침|점심|저녁|밤|새벽)\s*)?(?<![\d.,/A-Za-z])(\d{1,2})\s*(?::\s*(\d{2})|시(?!간)\s*(?:(반)|(\d{1,2})\s*분)?)`;
const RE_TIME = new RegExp(TIME_SRC);
const RE_TIME_G = new RegExp(TIME_SRC, 'g');
const RE_MONEY = /(?:([¥￥₩])\s*(\d[\d,]*(?:\.\d+)?)\s*(만|천)?)|(?:(\d[\d,]*(?:\.\d+)?)\s*(만|천)?\s*(엔|円|원|₩|yen|jpy|krw))/i;
const RE_DAYHEAD = /^(?:day\s*(\d+)|(\d+)\s*일\s*(?:차|째)|(첫|둘|두|셋|세|넷|네|다섯|여섯|일곱|여덟|아홉|열)\s*(?:째|번째)?\s*날|(그\s*다음\s*날|다음\s*날|내일)|(마지막\s*날))\s*[:：.)\-]?\s*/i;
const RE_INLINE_DAY = /\s(\d+)\s*일\s*(?:차|째)\s*(?:로|으로|에)?(?=\s|$)|\s(첫|둘|셋|넷|다섯)\s*째\s*날\s*(?:로|으로|에)?(?=\s|$)/;
const RE_DELETE = /\s*(?:빼기|빼줘|빼|취소|삭제|지우기|지워줘|안\s*가기|안\s*가)$/;
const RE_STAY = /(숙소|호텔|료칸|에어비앤비|게스트하우스|민박|리조트|ホテル|hotel)/i;
const RE_COMMAND = /\s*(?:변경|수정|바꿔줘|바꿔|바꾸기|옮겨줘|옮겨|옮기기)$/;

function resolveDate(y, m, d, st) {
  m = +m; d = +d;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  if (y) return new Date(+y, m - 1, d);
  const s = parseDate(st.trip.start);
  if (s) {
    let dt = new Date(s.getFullYear(), m - 1, d);
    if (diffDays(s, dt) < -180) dt = new Date(s.getFullYear() + 1, m - 1, d);
    return dt;
  }
  let dt = new Date(today().getFullYear(), m - 1, d);
  if (diffDays(today(), dt) < -7) dt = new Date(today().getFullYear() + 1, m - 1, d);
  return dt;
}
function timeFrom(m) {
  let h = +m[2]; const min = m[3] ? +m[3] : m[4] ? 30 : m[5] ? +m[5] : 0;
  if (h > 24 || min > 59) return null;
  const p = m[1];
  if (p && /오후|저녁|밤/.test(p) && h < 12) h += 12;
  else if (p === '점심' && h < 5) h += 12;
  else if (!p && !m[3] && h >= 1 && h <= 6) h += 12; // "3시" → 오후 3시로 봄
  if (h === 24) h = 0;
  return { raw: m[0], value: `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}` };
}
const parseTime = s => { const m = s.match(RE_TIME); return m ? timeFrom(m) : null; };
const parseTimes = s => [...s.matchAll(RE_TIME_G)].map(timeFrom).filter(Boolean);
function parseMoney(s) {
  const m = s.match(RE_MONEY); if (!m) return null;
  const n = parseFloat((m[2] || m[4]).replace(/,/g, '')); const unit = m[3] || m[5];
  const value = n * (unit === '만' ? 10000 : unit === '천' ? 1000 : 1);
  const sym = (m[1] || m[6] || '').toLowerCase();
  return { raw: m[0], value, cur: /[¥￥엔円]|yen|jpy/.test(sym) ? 'jpy' : 'krw' };
}
const cityNames = () => [...Object.keys(CITIES), ...Object.keys(CITY_ALIAS)];
function findCities(s) {
  const out = [];
  for (const name of cityNames()) {
    const re = new RegExp(`(^|[\\s,·/(→>~-])${name}(?=$|[\\s,·/)→>~-]|에서|으로|로|에|도착|출발|가기|이동|여행)`);
    if (re.test(s)) { const c = CITY_ALIAS[name] || name; if (!out.includes(c)) out.push(c); }
  }
  return out;
}
function leadingCity(s) {
  for (const name of cityNames()) if (s.startsWith(name + ' ')) return { name, city: CITY_ALIAS[name] || name };
  return null;
}
const meaningful = s => s.replace(new RegExp(cityNames().join('|'), 'g'), '')
  .replace(/[\s\-–—→>~·,.:!()]|도착|출발|이동|여행|관광|가기|에서|으로/g, '').length >= 2;

function guessType(title) {
  const known = knownPlace(title);
  if (known) return known.type;
  if (/(?:하기|말기|확인|예약|신청)$/.test(title)) return '기타';
  if (/호텔|체크인|체크아웃|료칸|숙소|게스트하우스|에어비앤비|민박/.test(title)) return '숙소';
  if (/카페|커피|디저트|베이커리|빵집|킷사텐|스타벅스|파르페|말차/.test(title)) return '카페';
  if (/라멘|라면|스시|초밥|시장|식당|맛집|먹기|먹방|점심|저녁\s*식사|아침\s*식사|이자카야|야키니쿠|규카츠|우동|소바|오코노미|타코야키|돈카츠|장어|야타이|포장마차|맥주|술집|규동|텐동|오마카세|식사|모츠나베|명란/.test(title)) return '식사';
  if (/쇼핑|돈키호테|돈키|아울렛|상점가|백화점|기념품|유니클로|무인양품|드럭|이온|로프트|팝업|굿즈|스토어|샵|숍/.test(title)) return '쇼핑';
  if (/공항|역\b|역에서|역으로|→|->|이동|전철|지하철|버스|택시|신칸센|라피트|하루카|JR|열차|페리|출국|입국|비행기|탑승|익스프레스/.test(title)) return '이동';
  return '관광';
}
function extraCat(s) {
  if (/항공|비행기|왕복\s*티켓/.test(s)) return '항공';
  if (/숙소|호텔|료칸|에어비앤비|게스트하우스/.test(s)) return '숙소';
  if (/보험/.test(s)) return '보험';
  if (/esim|e심|이심|유심|와이파이|로밍|데이터/i.test(s)) return '통신';
  if (/패스/.test(s)) return '교통패스';
  return null;
}
function packGroup(s) {
  if (/충전|배터리|어댑터|돼지코|유심|esim|카메라|케이블|이어폰/i.test(s)) return '전자기기';
  if (/엔화|현금|카드|지갑/.test(s)) return '돈';
  if (/여권|티켓|보험|예약/.test(s)) return '필수';
  return '생활';
}
const tidy = s => s.replace(/\s{2,}/g, ' ').replace(/^[\s\-–—:·,./]+|[\s\-–—:·,/]+$/g, '').trim();
// 시간·금액을 뺀 뒤 남는 "시간을", "로" 같은 군더더기 제거
const cleanTitle = s => tidy(s.split(/\s+/).filter(w => !/^(?:시간|시간을|시간은|비용|비용은|금액|가격|은|는|을|를|로|으로|에|도|부터)$/.test(w)).join(' '));

/* ---------- 항공편 ---------- */
const AIRLINES = { 대한항공: 'KE', 아시아나: 'OZ', 제주항공: '7C', 진에어: 'LJ', 티웨이: 'TW', 에어부산: 'BX', 에어서울: 'RS',
  이스타: 'ZE', 피치: 'MM', 전일본공수: 'NH', ANA: 'NH', 일본항공: 'JL', JAL: 'JL', 에어프레미아: 'YP', 집에어: 'ZG' };
const RE_FCODE = /(?<![A-Za-z0-9])(KE|OZ|7C|LJ|TW|BX|RS|ZE|MM|NH|JL|YP|ZG|GK|BC)\s?(\d{2,4})(?![\d:])/i;
const KR_AP = [['인천', '인천공항'], ['김포', '김포공항'], ['김해', '김해공항'], ['부산', '김해공항'], ['대구', '대구공항'], ['청주', '청주공항'], ['제주', '제주공항'], ['무안', '무안공항']];
const JP_AP = [['나리타', '나리타공항'], ['하네다', '하네다공항'], ['간사이', '간사이공항'], ['이타미', '이타미공항'], ['후쿠오카', '후쿠오카공항'],
  ['신치토세', '신치토세공항'], ['삿포로', '신치토세공항'], ['나하', '나하공항'], ['오키나와', '나하공항'], ['주부', '주부공항'], ['나고야', '주부공항'],
  ['센다이', '센다이공항'], ['히로시마', '히로시마공항'], ['기타큐슈', '기타큐슈공항'], ['구마모토', '구마모토공항'], ['가고시마', '가고시마공항'],
  ['오이타', '오이타공항'], ['마쓰야마', '마쓰야마공항'], ['시즈오카', '시즈오카공항'], ['고베', '고베공항'], ['오사카', '간사이공항'], ['도쿄', '도쿄']];
function findAirports(s) {
  const hits = [];
  for (const [k, name] of [...KR_AP, ...JP_AP]) {
    const i = s.indexOf(k);
    if (i >= 0 && !hits.some(h => h.name === name || (i >= h.i && i < h.i + h.k.length))) hits.push({ i, k, name, kr: KR_AP.some(a => a[1] === name) });
  }
  return hits.sort((a, b) => a.i - b.i);
}
function isFlightLine(s) {
  if (RE_FCODE.test(s)) return true;
  const aps = findAirports(s);
  if (Object.keys(AIRLINES).some(a => s.includes(a)) && aps.length) return true;
  return /(가는\s*편|오는\s*편|출국편|귀국편|항공편|비행기)/.test(s) && aps.length >= 1 && (parseTime(s) || aps.length >= 2);
}

/* ---------- 본체: text를 st에 적용하고 한 일을 돌려줌 ---------- */
function applyText(text, st, startDay) {
  const log = []; let day = startDay; let last = null; let batchHead = false;
  const t = st.trip;
  st.flights = st.flights || []; st.stays = st.stays || [];
  const ensureDay = i => {
    while (st.days.length <= i) st.days.push({ id: uid(), city: '', items: [] });
    const s = parseDate(t.start);
    if (s) { const need = addDays(s, i); if (!t.end || parseDate(t.end) < need) t.end = iso(need); }
  };
  const addCity = c => { if (!t.cities.includes(c)) t.cities.push(c); };
  const dayLabel = i => { const s = parseDate(t.start); return `${i + 1}일차${s ? ' · ' + dshort(addDays(s, i)) : ''}`; };
  const insertSorted = (items, item) => {
    let at = items.length;
    if (item.time) { const j = items.findIndex(x => x.time && x.time > item.time); if (j >= 0) at = j; }
    items.splice(at, 0, item);
  };
  // 이미 있는 장소 찾기 (다시 적으면 새로 만들지 않고 고침)
  const findExisting = title => {
    const p = squash(placeOf(title)); if (p.length < 2) return null;
    const isMove = ARROW.test(title);
    let best = null;
    st.days.forEach((d, di) => d.items.forEach((it, ii) => {
      if (it.flight || ARROW.test(it.title) !== isMove) return;
      const q = squash(placeOf(it.title));
      const short = p.length < q.length ? p : q, long = p.length < q.length ? q : p;
      const ok = p === q || (short.length >= 3 && long.includes(short) && short.length / long.length >= 0.5) ||
        canon(title) === canon(it.title) || (Array.isArray(it.cands) && it.cands.some(c => squash(c.name) === p));
      if (ok && Array.isArray(it.cands)) { const c = it.cands.find(c => squash(c.name) === p); if (c) pickCand(it, c); }
      if (ok && (!best || di === day)) best = { d, di, ii, it };
    }));
    return best;
  };
  const upsertExtra = (name, cat, amount, cur) => {
    const ex = st.extras.find(x => x.cat === cat && (squash(x.name) === squash(name) || squash(x.name).includes(squash(name)) || squash(name).includes(squash(x.name))));
    if (ex) { ex.amount = amount; ex.cur = cur; ex.name = name.length > ex.name.length ? name : ex.name; return true; }
    st.extras.push({ id: uid(), name, cat, amount, cur }); return false;
  };

  const addItem = (line, explicitDay) => {
    let rest = line, memo = '';
    const del = RE_DELETE.test(rest); rest = rest.replace(RE_DELETE, '').replace(RE_COMMAND, '');
    const tm = parseTime(rest); if (tm) rest = rest.replace(tm.raw, ' ');
    const mo = parseMoney(rest); if (mo) rest = rest.replace(mo.raw, ' ');
    rest = rest.replace(/[(（]([^)）]*)[)）]/g, (_, x) => { memo = x.trim(); return ' '; });
    const lc = leadingCity(rest.trim());
    const after = lc ? cleanTitle(rest.trim().slice(lc.name.length)) : '';
    if (lc && !CITY_ALIAS[lc.name] && !knownPlace(rest) && after.length >= 3 && meaningful(after)) {
      ensureDay(day); if (!st.days[day].city) st.days[day].city = lc.city; addCity(lc.city);
      rest = rest.trim().slice(lc.name.length);
    }
    let title = cleanTitle(rest) || (mo ? '지출' : '');
    if (!title) return false;
    const aliasHit = Object.entries(PLACE_ALIAS).find(([a]) => squash(a) === squash(title));
    let fixed = '';
    if (aliasHit && squash(aliasHit[1]) !== squash(title)) { fixed = title; title = aliasHit[1]; }
    const cost = mo ? Math.round(mo.cur === 'jpy' ? mo.value : mo.value * 100 / t.rate) : 0;

    const ex = findExisting(title);
    if (del) {
      if (!ex) return false;
      ex.d.items.splice(ex.ii, 1);
      log.push({ k: '삭제', t: ex.it.title, s: dayLabel(ex.di) }); last = null; return true;
    }
    if (ex) {
      const changes = [];
      const it = ex.it;
      if (tm && it.time !== tm.value) { it.time = tm.value; changes.push('시간 ' + tm.value); }
      if (mo && it.cost !== cost) { it.cost = cost; changes.push(yen(cost)); }
      if (memo && !String(it.memo).includes(memo)) { it.memo = it.memo ? it.memo + ' / ' + memo : memo; changes.push('메모'); }
      const moveTo = explicitDay ? day : ex.di;
      ex.d.items.splice(ex.ii, 1); ensureDay(moveTo); insertSorted(st.days[moveTo].items, it);
      if (moveTo !== ex.di) changes.push(`${dayLabel(moveTo)}로 이동`);
      last = it;
      if (!changes.length) { log.push({ k: '이미 있음', t: it.title, s: dayLabel(moveTo), skip: true }); return true; }
      log.push({ k: '수정', t: it.title, s: changes.join(' · '), day: moveTo }); return true;
    }
    const known = knownPlace(title);
    const item = { id: uid(), time: tm ? tm.value : '', title, type: guessType(title), cost, memo };
    if (!known && ['관광', '식사', '카페', '쇼핑'].includes(item.type)) {
      const lc2 = localCands(title).filter(c => squash(c.name) !== squash(title));
      if (lc2.length) item.cands = lc2; else item.ask = true; // ask: AI에게 물어볼 후보
    }
    ensureDay(day);
    insertSorted(st.days[day].items, item);
    last = item;
    log.push({ k: '일정', t: `${item.time ? item.time + ' ' : ''}${title}`, s: [fixed ? `‘${fixed}’ → 고쳐 적음` : '', dayLabel(day), item.type, cost ? yen(cost) : '', memo, item.cands ? '장소 확인 필요' : item.ask && ai ? 'AI가 장소 확인' : ''].filter(Boolean).join(' · '), day });
    return true;
  };

  const addStay = line => {
    if (RE_DELETE.test(line)) {
      let dl = line.replace(RE_DELETE, '').replace(/숙소/g, ''); const dm = parseMoney(dl); if (dm) dl = dl.replace(dm.raw, ' ');
      const nm = squash(dl.replace(/\d+\s*박(?:\s*\d+\s*일)?|\d+\s*[~\-]?\s*\d*\s*일\s*(?:차|째)/g, ''));
      const i = st.stays.findIndex(x => nm && (squash(x.name).includes(nm) || nm.includes(squash(x.name))));
      if (i >= 0) { log.push({ k: '삭제', t: '숙소 ' + st.stays[i].name }); st.stays.splice(i, 1); } else log.push({ k: '무시', t: line, skip: true });
      return;
    }
    let rest = line, from = null, nights = null, m;
    const mo = parseMoney(rest); if (mo) rest = rest.replace(mo.raw, ' ');
    if ((m = rest.match(RE_RANGE))) {
      const sd = resolveDate(m[1], m[2], m[3], st);
      if (sd) {
        let ed = new Date(sd.getFullYear(), (+(m[4] || m[2])) - 1, +m[5]);
        if (ed < sd) ed = new Date(sd.getFullYear() + 1, ed.getMonth(), ed.getDate());
        if (!t.start) { t.start = iso(sd); t.end = iso(ed); }
        from = Math.max(0, diffDays(parseDate(t.start), sd)); nights = Math.max(1, diffDays(sd, ed));
        rest = rest.replace(m[0], ' ');
      }
    }
    if ((m = rest.match(/(\d+)\s*[~\-]\s*(\d+)\s*일\s*(?:차|째)/))) { from = +m[1] - 1; nights = Math.max(1, +m[2] - +m[1] + 1); rest = rest.replace(m[0], ' '); }
    else if ((m = rest.match(/(\d+)\s*일\s*(?:차|째)(?:\s*부터)?/))) { from = +m[1] - 1; rest = rest.replace(m[0], ' '); }
    if ((m = rest.match(/(\d+)\s*박(?:\s*\d+\s*일)?/))) { if (nights === null) nights = +m[1]; rest = rest.replace(m[0], ' '); }
    const name = tidy(rest.replace(/숙소|예약|[:：]/g, ' ').replace(/\s{2,}/g, ' ')) || '숙소';
    let ex = st.stays.find(x => squash(x.name) === squash(name) || (name.length >= 2 && (squash(x.name).includes(squash(name)) || squash(name).includes(squash(x.name)))));
    if (!ex && name === '숙소' && st.stays.length === 1) ex = st.stays[0];
    const len = Math.max(tripLength(st), st.days.length, 1);
    if (from === null) from = ex ? ex.from : st.stays.reduce((a, x) => Math.max(a, x.from + x.nights), 0);
    if (nights === null) nights = ex ? ex.nights : Math.max(1, len - 1 - from);
    if (ex) { ex.from = from; ex.nights = nights; if (name !== '숙소') ex.name = name; }
    else st.stays.push({ id: uid(), name, from, nights });
    ensureDay(from + nights);
    if (mo) upsertExtra(`숙소 ${ex ? ex.name : name}`, '숙소', mo.value, mo.cur);
    const sd = parseDate(t.start);
    log.push({ k: ex ? '수정' : '숙소', t: ex ? ex.name : name, s: [`${from + 1}일차부터 ${nights}박`, sd ? `${dshort(addDays(sd, from))} ~ ${dshort(addDays(sd, from + nights))}` : '', mo ? '요금 → 예산' : ''].filter(Boolean).join(' · '), day: from });
  };

  const addFlight = line => {
    let rest = line;
    const fc = rest.match(RE_FCODE);
    let code = fc ? (fc[1] + fc[2]).toUpperCase() : '';
    if (fc) rest = rest.replace(fc[0], ' ');
    const airline = Object.keys(AIRLINES).find(a => rest.includes(a));
    if (!code && airline) code = airline;
    let date = null;
    const dm = rest.match(RE_DATE_ANY);
    if (dm) { date = resolveDate(dm[1], dm[2], dm[3], st); rest = rest.replace(dm[0], ' '); }
    const mo = parseMoney(rest); if (mo) rest = rest.replace(mo.raw, ' ');
    const times = parseTimes(rest).map(x => x.value);
    const aps = findAirports(rest);
    let from = aps[0] ? aps[0] : null, to = aps[1] ? aps[1] : null;
    let dir;
    if (/귀국|오는|돌아|복귀|리턴/.test(line)) dir = 'back';
    else if (/출국|가는|출발편/.test(line)) dir = 'out';
    else if (from && from.kr) dir = 'out';
    else if (to && to.kr) dir = 'back';
    else dir = st.flights.some(f => f.dir === 'out') ? 'back' : 'out';
    // 공항이 하나만 있으면 방향으로 나머지를 짐작
    if (from && !to) { if (from.kr === (dir === 'back')) { to = from; from = null; } }
    const jp = [from, to].find(a => a && !a.kr);
    const f = { id: uid(), dir, code, from: from ? from.name : '', to: to ? to.name : '', date: date ? iso(date) : '', dep: times[0] || '', arr: times[1] || '' };
    st.flights = st.flights.filter(x => x.dir !== dir); st.flights.push(f);
    if (date) {
      if (dir === 'out') {
        const len = Math.max(tripLength(st), st.days.length);
        t.start = iso(date);
        if (!t.end || parseDate(t.end) < date) t.end = iso(addDays(date, Math.max(len, 1) - 1));
      } else {
        if (!t.start) t.start = iso(date);
        t.end = iso(date);
      }
    }
    syncDays(st);
    const di = dir === 'out' ? 0 : Math.max(0, (tripLength(st) || st.days.length) - 1);
    st.days.forEach(d => { d.items = d.items.filter(it => !(it.flight && it.flight.dir === dir)); });
    ensureDay(di);
    const route = `${f.from ? f.from.replace('공항', '') : '?'} → ${f.to ? f.to.replace('공항', '') : '?'}`;
    const item = {
      id: uid(), time: dir === 'out' ? (f.arr || f.dep) : f.dep, type: '이동', cost: 0,
      title: `✈ ${code ? code + ' ' : ''}${route}`,
      memo: [f.dep && `${f.dep} 출발`, f.arr && `${f.arr} 도착`, dir === 'back' ? '2시간 전 공항 도착 권장' : ''].filter(Boolean).join(' · '),
      flight: { dir, ap: jp ? jp.name : '' },
    };
    insertSorted(st.days[di].items, item);
    last = item;
    if (mo) upsertExtra('항공권', '항공', mo.value, mo.cur);
    log.push({ k: '항공', t: `${dir === 'out' ? '가는 편' : '오는 편'} ${code} ${route}`, s: [f.date && dshort(parseDate(f.date)), f.dep && f.dep + ' 출발', f.arr && f.arr + ' 도착', mo ? '요금 → 예산' : ''].filter(Boolean).join(' · '), day: di });
  };

  for (const raw of text.split('\n')) {
    let line = raw.trim().replace(/\s+/g, ' ');
    if (!line) continue;
    let m;

    // 메모: "- ..." 는 바로 위 일정에 붙임
    if ((m = line.match(/^(?:[-*•ㄴ└↳]|메모\s*[:：])\s*(.+)/))) {
      if (last) { last.memo = last.memo ? last.memo + ' / ' + m[1] : m[1]; log.push({ k: '메모', t: m[1], s: '→ ' + last.title }); continue; }
      line = m[1];
    }
    // 준비물
    if ((m = line.match(/^(?:챙길\s*것|챙길것|준비물|짐|챙기기|가져갈\s*것)\s*[:：]?\s*(.+)/)) ||
        (m = line.match(/^(.+?)\s*(?:꼭\s*)?(?:챙기기|챙겨야\s*함|챙기자|챙겨)$/))) {
      for (const x of m[1].split(/\s*(?:[,，、/]|그리고)\s*/).map(tidy).filter(Boolean)) {
        if (!st.pack.some(p => squash(p.text) === squash(x) || squash(p.text).startsWith(squash(x) + '('))) { st.pack.push({ id: uid(), group: packGroup(x), text: x, done: false }); log.push({ k: '준비물', t: x }); }
        else log.push({ k: '이미 있음', t: x, skip: true });
      }
      continue;
    }
    // 여행 이름
    if ((m = line.match(/^(?:제목|여행\s*이름|여행명)\s*[:：]\s*(.+)/))) { t.title = m[1]; log.push({ k: '여행', t: '이름 → ' + m[1] }); continue; }
    // 항공편
    if (isFlightLine(line)) { addFlight(line); continue; }
    // 숙소 (시간 없이 적은 줄)
    if (RE_STAY.test(line) && !parseTime(line) && !/체크인|체크아웃/.test(line)) { addStay(line); continue; }

    // 예산 (항공권·숙소 등, 시간 없이 금액만)
    const money = parseMoney(line), time = parseTime(line), xc = extraCat(line);
    if (money && !time && xc) {
      const name = tidy(line.replace(money.raw, ' ')) || xc;
      const upd = upsertExtra(name, xc, money.value, money.cur);
      log.push({ k: upd ? '수정' : '예산', t: name, s: money.cur === 'jpy' ? yen(money.value) : won(money.value) });
      continue;
    }

    // 여행 기간 / 인원
    let tripHit = false;
    if ((m = line.match(RE_RANGE))) {
      const s = resolveDate(m[1], m[2], m[3], { trip: { start: '' } });
      if (s) {
        let e = new Date(s.getFullYear(), (+(m[4] || m[2])) - 1, +m[5]);
        if (e < s) e = new Date(s.getFullYear() + 1, e.getMonth(), e.getDate());
        const shift = t.start ? diffDays(parseDate(t.start), s) : 0;
        if (shift < 0) for (let i = 0; i < -shift; i++) st.days.unshift({ id: uid(), city: '', items: [] });
        t.start = iso(s); t.end = iso(e); tripHit = true;
        line = line.replace(m[0], ' ');
        log.push({ k: '날짜', t: `${dlong(s)} ~ ${dlong(e)}`, s: `${diffDays(s, e)}박 ${diffDays(s, e) + 1}일` });
      }
    }
    if ((m = line.match(/(\d+)\s*박\s*(?:(\d+)\s*일)?/)) && !money) {
      const nights = +m[1];
      if (t.start && !tripHit) { t.end = iso(addDays(parseDate(t.start), nights)); log.push({ k: '날짜', t: `${nights}박 ${nights + 1}일` }); }
      else if (!t.start) { while (st.days.length < nights + 1) st.days.push({ id: uid(), city: '', items: [] }); log.push({ k: '날짜', t: `${nights}박 ${nights + 1}일`, s: '출발일은 아직 몰라요' }); }
      line = line.replace(m[0], ' '); tripHit = true;
    }
    if ((m = line.match(/(\d+)\s*명/))) { t.people = Math.max(1, Math.min(20, +m[1])); line = line.replace(m[0], ' '); tripHit = true; log.push({ k: '여행', t: `${t.people}명` }); }
    if (tripHit) {
      const cs = findCities(line); cs.forEach(addCity);
      if (cs.length) log.push({ k: '도시', t: cs.join(', ') });
      const left = tidy(line.replace(/[,|]|(?:으로|로)?\s*(?:변경|수정)/g, ' '));
      if (!t.title && left && meaningful(left)) { t.title = left; log.push({ k: '여행', t: '이름 → ' + left }); }
      else if (!t.title && cs.length) t.title = cs.join('·') + ' 여행';
      syncDays(st);
      continue;
    }

    // 날짜(일차) 머리
    let head = false;
    if ((m = line.match(RE_DAYHEAD))) {
      day = m[1] || m[2] ? Math.max(0, +(m[1] || m[2]) - 1) : m[3] ? ORD[m[3]] - 1 : m[5] ? Math.max(0, (tripLength(st) || st.days.length) - 1) : day + 1;
      line = line.slice(m[0].length); head = true;
    } else if ((m = line.match(RE_DATE))) {
      const dt = resolveDate(m[1], m[2], m[3], st);
      if (dt) {
        if (!t.start) { t.start = iso(dt); t.end = t.end || iso(dt); }
        let idx = diffDays(parseDate(t.start), dt);
        if (idx < 0) { for (let i = 0; i < -idx; i++) st.days.unshift({ id: uid(), city: '', items: [] }); t.start = iso(dt); idx = 0; }
        day = Math.min(idx, 59); line = line.slice(m[0].length); head = true;
      }
    }
    if (head) {
      batchHead = true;
      ensureDay(day);
      line = line.trim();
      const cs = findCities(line); cs.forEach(addCity);
      const hasMore = parseTime(line) || parseMoney(line) || meaningful(line);
      if (cs.length >= 2 && /→|->|>|에서/.test(line) && !parseTime(line)) {
        st.days[day].city = cs[cs.length - 1];
        addItem(`${cs[0]} → ${cs[cs.length - 1]} 이동`, true);
        continue;
      }
      if (cs.length) st.days[day].city = cs[0];
      log.push({ k: '날짜', t: dayLabel(day) + (cs.length ? ' · ' + cs[0] : '') });
      if (!hasMore) continue;
    }

    // 줄 안의 "3일차로" 같은 날짜 지정 (이 줄에만 적용)
    let lineDay = null;
    if (!head && (m = (' ' + line).match(RE_INLINE_DAY))) {
      lineDay = m[1] ? Math.max(0, +m[1] - 1) : ORD[m[2]] - 1;
      line = (' ' + line).replace(m[0], ' ').trim();
    }

    // 도시 이름만 있는 줄
    const cs = findCities(line);
    if (lineDay === null && cs.length && !meaningful(line) && !parseTime(line) && !parseMoney(line)) {
      ensureDay(day); st.days[day].city = cs[0]; cs.forEach(addCity);
      log.push({ k: '도시', t: `${dayLabel(day)} → ${cs[0]}` }); continue;
    }

    // 나머지는 일정 (이미 있으면 고침)
    const keep = day;
    if (lineDay !== null) day = lineDay;
    const ok = addItem(line, head || batchHead || lineDay !== null);
    if (lineDay !== null) day = keep;
    if (!ok) log.push({ k: '무시', t: raw.trim(), skip: true });
  }
  syncDays(st);
  return { log, day };
}

/* ================= 길찾기 · 이동 시간 ================= */
// 주요 장소 좌표 (대략). 이름에 이 단어가 들어 있으면 이 위치로 봄
const COORDS = {
  센소지: [35.7148, 139.7967], 아사쿠사: [35.7118, 139.7966], 시부야스카이: [35.6585, 139.7022], 시부야: [35.6595, 139.7005],
  메이지신궁: [35.6764, 139.6993], 하라주쿠: [35.6717, 139.7037], 다케시타: [35.6717, 139.7037], 도쿄타워: [35.6586, 139.7454],
  스카이트리: [35.7101, 139.8107], 츠키지: [35.6655, 139.7707], 오모이데요코초: [35.6929, 139.6995], 신주쿠: [35.6896, 139.7006],
  아키하바라: [35.6984, 139.7731], 긴자: [35.6717, 139.7650], 우에노: [35.7138, 139.7773], 오다이바: [35.6268, 139.7753],
  도쿄역: [35.6812, 139.7671], 선샤인시티: [35.7289, 139.7193], 이케부쿠로: [35.7295, 139.7109], 디즈니: [35.6329, 139.8804], 롯폰기: [35.6628, 139.7314],
  팀랩플래닛: [35.6491, 139.7898], 나리타: [35.7720, 140.3929], 하네다: [35.5494, 139.7798],
  도톤보리: [34.6687, 135.5013], 글리코: [34.6687, 135.5013], 오사카성: [34.6873, 135.5262], 유니버설: [34.6654, 135.4323], USJ: [34.6654, 135.4323],
  구로몬: [34.6654, 135.5066], 신세카이: [34.6525, 135.5063], 츠텐카쿠: [34.6525, 135.5063], 우메다스카이: [34.7053, 135.4896],
  우메다: [34.7025, 135.4959], 오사카역: [34.7025, 135.4959], 신사이바시: [34.6745, 135.5013], 가이유칸: [34.6545, 135.4290],
  하루카스: [34.6459, 135.5135], 텐노지: [34.6466, 135.5133], 난바: [34.6660, 135.5010], 신오사카: [34.7334, 135.5002],
  간사이공항: [34.4347, 135.2440], 이타미: [34.7855, 135.4382],
  후시미이나리: [34.9671, 135.7727], 후시미: [34.9671, 135.7727], 기요미즈: [34.9949, 135.7850], 청수사: [34.9949, 135.7850],
  아라시야마: [35.0170, 135.6713], 금각사: [35.0394, 135.7292], 킨카쿠지: [35.0394, 135.7292], 은각사: [35.0270, 135.7982],
  기온: [35.0037, 135.7750], 하나미코지: [35.0027, 135.7752], 니시키: [35.0050, 135.7649], 산넨자카: [34.9963, 135.7809],
  니넨자카: [34.9978, 135.7805], 철학의길: [35.0230, 135.7942], 니조성: [35.0142, 135.7481], 교토역: [34.9858, 135.7588], 가와라마치: [35.0037, 135.7690],
  나라공원: [34.6851, 135.8430], 도다이지: [34.6890, 135.8398], 가스가타이샤: [34.6812, 135.8484], 나라마치: [34.6770, 135.8300], 나라역: [34.6812, 135.8197],
  나카스: [33.5925, 130.4045], 야타이: [33.5925, 130.4045], 다자이후: [33.5215, 130.5349], 캐널시티: [33.5897, 130.4111],
  오호리: [33.5862, 130.3762], 텐진: [33.5903, 130.3990], 후쿠오카타워: [33.5933, 130.3515], 모모치: [33.5952, 130.3518],
  하카타역: [33.5902, 130.4207], 하카타: [33.5902, 130.4207], 후쿠오카공항: [33.5859, 130.4510],
  오도리: [43.0605, 141.3485], 니조시장: [43.0577, 141.3570], 오타루: [43.1990, 141.0020], 삿포로맥주: [43.0717, 141.3690],
  스스키노: [43.0552, 141.3530], 모이와: [43.0230, 141.3220], 삿포로역: [43.0687, 141.3508], 신치토세: [42.7752, 141.6923],
  국제거리: [26.2150, 127.6870], 추라우미: [26.6943, 127.8779], 슈리성: [26.2172, 127.7195], 만좌모: [26.5049, 127.8505],
  아메리칸빌리지: [26.3164, 127.7570], 고우리: [26.6860, 128.0130], 나하공항: [26.2060, 127.6466],
  나고야성: [35.1856, 136.8999], 아쓰타: [35.1283, 136.9087], 오스: [35.1590, 136.9030], 나고야역: [35.1709, 136.8815], 지브리파크: [35.1736, 137.0880],
  주부공항: [34.8584, 136.8054], 센다이공항: [38.1397, 140.9170], 히로시마공항: [34.4361, 132.9194], 기타큐슈공항: [33.8459, 131.0349],
  구마모토공항: [32.8373, 130.8551], 가고시마공항: [31.8034, 130.7194], 오이타공항: [33.4794, 131.7372], 고베공항: [34.6328, 135.2239],
  미나토미라이: [35.4570, 139.6320], 차이나타운: [35.4437, 139.6460], 아카렌가: [35.4527, 139.6430], 컵누들: [35.4552, 139.6386],
  오와쿠다니: [35.2440, 139.0190], 아시노코: [35.2030, 139.0250], 하코네신사: [35.2048, 139.0255], 하코네유모토: [35.2329, 139.1059],
};
const COORD_KEYS = Object.keys(COORDS).sort((a, b) => b.length - a.length);
function locate(place) {
  const p = squash(place); if (!p) return null;
  if (state.geo && state.geo[p]) return state.geo[p];
  for (const k of COORD_KEYS) if (p.includes(squash(k))) return COORDS[k];
  return null;
}
const ARROW = /\s*(?:→|->|⇒|>)\s*/;
const TRAIL = /\s*(?:라피트|하루카|공항철도|리무진|버스|택시|신칸센|전철|지하철|JR|이동|도착|출발|타고|가기|쇼핑|구경|산책|체크인|체크아웃|관광)\s*$/;
function placeOf(s) { let t = String(s || '').trim(); for (let i = 0; i < 3; i++) t = t.replace(TRAIL, ''); return t.trim() || String(s || '').trim(); }
function ends(it) {
  if (it.flight) { const ap = it.flight.ap || '공항'; return { from: ap, to: ap, move: false }; }
  const parts = it.title.split(ARROW).map(placeOf).filter(Boolean);
  if (parts.length >= 2) return { from: parts[0], to: parts[parts.length - 1], move: true };
  const p = placeOf(it.title); return { from: p, to: p, move: false };
}
const withCity = (place, city) => city && !place.includes(city) && !/공항$/.test(place) ? `${place} ${city}` : place;
const G = 'https://www.google.com/maps/dir/?api=1';
const dirUrl = (from, to, city) => `${G}&origin=${encodeURIComponent(withCity(from, city))}&destination=${encodeURIComponent(withCity(to, city))}&travelmode=transit`;
const goUrl = (to, city) => `${G}&destination=${encodeURIComponent(withCity(to, city))}&travelmode=transit`;
const mapUrl = (title, city) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(withCity(title, city));
const dayRouteUrl = (places, city) => 'https://www.google.com/maps/dir/' + places.map(p => encodeURIComponent(withCity(p, city))).join('/');

function km(a, b) {
  const R = 6371, r = x => x * Math.PI / 180;
  const dLat = r(b[0] - a[0]), dLng = r(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
// 직선거리로 대략 추정
function estimate(from, to) {
  const a = locate(from), b = locate(to); if (!a || !b) return null;
  const d = km(a, b);
  let mode, min;
  if (d < 1.1) { mode = '도보'; min = d * 1.3 / 4.5 * 60; }
  else if (d < 15) { mode = '전철'; min = 10 + d * 1.35 / 28 * 60; }
  else if (d < 120) { mode = '전철'; min = 15 + d * 1.3 / 55 * 60; }
  else if (d < 600) { mode = '신칸센'; min = 30 + d / 200 * 60; }
  else { mode = '비행기'; min = 150 + d / 700 * 60; }
  return { mode, min: Math.max(5, Math.round(min / 5) * 5), est: true };
}
const legKey = (f, t) => squash(f) + '>' + squash(t);
function legInfo(d, from, to) {
  const a = d.legs && d.legs[legKey(from, to)];
  return a ? { ...a, est: false } : estimate(from, to);
}
// 겹치면 나중에 적은 숙소가 우선
const stayFor = night => (state.stays || []).slice().reverse().find(x => night >= x.from && night < x.from + x.nights);
// 하루 동선: (전날 묵은 숙소) → 일정들 → (오늘 묵을 숙소)
function daySeq(di) {
  const d = state.days[di], seq = [];
  const a = stayFor(di - 1), b = stayFor(di);
  if (a && !(d.items[0] && d.items[0].flight && d.items[0].flight.dir === 'out')) seq.push({ stay: a, title: a.name, pos: 'start' });
  seq.push(...d.items);
  const lastIt = d.items[d.items.length - 1];
  if (b && !(lastIt && lastIt.flight && lastIt.flight.dir === 'back')) seq.push({ stay: b, title: b.name, pos: 'end' });
  return seq;
}
function dayLegs(di) {
  const legs = [], seq = daySeq(di);
  seq.forEach((it, i) => {
    const e = ends(it);
    if (i > 0) { const pe = ends(seq[i - 1]); if (squash(pe.to) !== squash(e.from)) legs.push({ at: i, from: pe.to, to: e.from }); }
    if (e.move) legs.push({ at: i, inner: true, from: e.from, to: e.to });
  });
  return legs;
}
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const durText = m => m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ' ' + (m % 60) + '분' : ''}` : `${m}분`;
function legHTML(d, prev, cur) {
  const pe = ends(prev), ce = ends(cur);
  if (squash(pe.to) === squash(ce.from)) return '';
  const info = legInfo(d, pe.to, ce.from);
  let tight = '';
  if (info && prev.time && cur.time) {
    const gap = toMin(cur.time) - toMin(prev.time);
    if (gap >= 0 && gap < info.min) tight = `<span class="tight">간격 ${durText(gap)} — 빠듯해요</span>`;
  }
  const body = info
    ? `<span class="mode">${esc(info.mode)}</span> ${info.est ? '약 ' : ''}${durText(info.min)}${info.route ? ` <span class="route">${esc(info.route)}</span>` : ''}`
    : '<span class="route">이동 시간은 길찾기에서</span>';
  return `<li class="leg"><span></span><span class="leg-line"></span><div class="leg-body">${body}
    <a href="${dirUrl(pe.to, ce.from, d.city)}" target="_blank" rel="noopener">길찾기</a>${tight}</div></li>`;
}

/* ================= AI (claude.ai에서 열었을 때만) ================= */
let ai = null;
try {
  if (window.claude && typeof window.claude.use === 'function')
    window.claude.use('sample').then(s => { if (s) { ai = s; renderPlan(); resolvePending().then(geocodePending); } }, () => {});
} catch (e) {}
function aiFail(e, msg) {
  if (e && e.code === 'not_granted') { ai = null; toast('AI 사용이 허용되지 않아 AI 기능은 숨길게요'); return true; }
  toast(e && e.code === 'rate_limited' ? '요청이 많아요. 잠시 후 다시 해 주세요' : msg); return false;
}
async function aiDay(di, btn) {
  const d = state.days[di], legs = dayLegs(di);
  if (!ai || !legs.length) return;
  btn.disabled = true; btn.textContent = '계산 중… (최대 1분)';
  const city = d.city || state.trip.cities.join(', ') || '일본';
  const list = legs.map((l, i) => `${i + 1}. ${l.from} → ${l.to}`).join('\n');
  const prompt = `일본 ${city} 여행 일정이에요. 아래 각 구간을 관광객이 가장 흔히 이동하는 방법과 걸리는 시간(대기·환승·걷기 포함, 분 단위)을 추정해 주세요.\n${list}\n\nJSON 배열로만 답하세요. 형식: [{"i":1,"mode":"도보|전철|버스|택시|신칸센|비행기 중 하나","minutes":25,"route":"노선·경로 요약, 한국어 20자 이내 (예: 미도스지선 난바→우메다)"}]`;
  try {
    const r = await ai.json(prompt, { modelTier: 'default' });
    const arr = Array.isArray(r) ? r : (r && r.legs) || [];
    d.legs = d.legs || {};
    let n = 0;
    for (const x of arr) {
      const l = legs[(+x.i || 0) - 1], mm = Math.round(+x.minutes);
      if (!l || !(mm > 0 && mm < 1000)) continue;
      d.legs[legKey(l.from, l.to)] = { mode: String(x.mode || '이동').slice(0, 6), min: mm, route: String(x.route || '').slice(0, 40) };
      n++;
    }
    save(); renderPlan(); toast(n ? `${di + 1}일차 이동 ${n}구간을 계산했어요` : '결과를 읽지 못했어요. 다시 눌러 주세요');
  } catch (e) { aiFail(e, '계산하지 못했어요. 잠시 후 다시 눌러 주세요'); renderPlan(); }
}
// 모호한 장소 → 실제 장소 후보
let resolving = false;
async function resolvePending() {
  if (!ai || resolving) return;
  const targets = [];
  state.days.forEach(d => d.items.forEach(it => { if (it.ask) targets.push({ it, city: d.city || state.trip.cities.join(', ') }); }));
  if (!targets.length) return;
  resolving = true;
  targets.forEach(x => { x.it.cands = 'loading'; });
  renderPlan();
  const list = targets.slice(0, 10).map((x, i) => `${i + 1}. "${x.it.title}" (도시: ${x.city || '미정'})`).join('\n');
  const prompt = `일본 여행 일정에 사용자가 대충 적은 장소들이에요. 각 입력이 실제로 가리킬 만한 구체적인 장소 후보를 최대 3개씩, 가능성 높은 순서로 알려 주세요.
- 실제로 존재한다고 확신하는 장소만 넣으세요. 확실하지 않으면 빼세요.
- 입력이 이미 하나의 장소를 분명히 가리키면 그 장소 하나만 넣으세요.
- 장소가 아니라 할 일·메모라면 빈 배열로 두세요.
${list}

JSON 배열로만 답하세요: [{"i":1,"candidates":[{"name":"한국어로 흔히 부르는 이름","area":"지역·건물, 12자 이내","note":"무엇인지 한 줄, 20자 이내","type":"관광|식사|카페|쇼핑 중 하나"}]}]`;
  try {
    const r = await ai.json(prompt, { modelTier: 'default' });
    const arr = Array.isArray(r) ? r : [];
    targets.forEach((x, i) => {
      const hit = arr.find(a => +a.i === i + 1);
      const cands = (hit && Array.isArray(hit.candidates) ? hit.candidates : []).slice(0, 3)
        .map(c => ({ name: String(c.name || '').slice(0, 40), area: String(c.area || '').slice(0, 24), note: String(c.note || '').slice(0, 40), type: TYPES.includes(c.type) ? c.type : '' }))
        .filter(c => c.name);
      delete x.it.ask;
      if (cands.length && !(cands.length === 1 && squash(cands[0].name) === squash(x.it.title))) x.it.cands = cands; else delete x.it.cands;
    });
    save();
    const n = targets.filter(x => Array.isArray(x.it.cands)).length;
    if (n) toast(`장소 ${n}곳의 후보를 찾았어요. 일정에서 골라 주세요`);
  } catch (e) {
    targets.forEach(x => { delete x.it.cands; });
    if (aiFail(e, '장소 후보를 찾지 못했어요')) targets.forEach(x => delete x.it.ask);
  }
  resolving = false; renderPlan();
}
function pickCand(it, c) {
  it.title = c.name;
  if (c.area && !String(it.memo).includes(c.area)) it.memo = it.memo ? `${c.area} · ${it.memo}` : c.area;
  if (c.type) it.type = c.type;
  delete it.cands; delete it.ask;
}

/* ================= 예시 ================= */
function exampleText(key, start) {
  const d = n => { const x = addDays(start, n); return `${x.getMonth() + 1}/${x.getDate()}`; };
  if (key === '도쿄') return `${d(0)}~${d(3)} 도쿄 3박 4일 2명
가는 편 KE703 ${d(0)} 09:00 인천 → 11:30 나리타
오는 편 KE704 ${d(3)} 13:00 나리타 → 15:40 인천
항공권 104만원
숙소 신주쿠 3박 9만엔
첫째날 도쿄
오후 1시 나리타공항 → 신주쿠 (나리타 익스프레스) 3,250엔
오후 4시 신주쿠 호텔 체크인
저녁 6시 신주쿠 오모이데요코초 4천엔
- 야키토리 골목
둘째날
9시 센소지
- 아침 일찍 가면 한산해요
12시 츠키지 장외시장 5천엔
오후 3시 도쿄 스카이트리 3,500엔
셋째날
10시 메이지 신궁
12시 하라주쿠 다케시타 거리
오후 4시 시부야 스카이 2,500엔 (일몰 시간대 예약)
넷째날
9시 신주쿠 → 나리타공항 3,250엔
챙길 것: 동전지갑, 보조배터리`;
  if (key === '후쿠오카') return `${d(0)}~${d(2)} 후쿠오카 2박 3일 2명
가는 편 7C1401 ${d(0)} 08:00 인천 → 09:25 후쿠오카
오는 편 7C1406 ${d(2)} 17:30 후쿠오카 → 19:00 인천
항공권 42만원
숙소 하카타 2박 36000엔
첫째날 후쿠오카
10시 후쿠오카공항 → 하카타역 260엔
11시 캐널시티 하카타
오후 1시 하카타 라멘 2,000엔
오후 3시 다자이후 텐만구
- 우메가에모치 먹기
저녁 7시 나카스 야타이 6천엔
둘째날
10시 오호리 공원
12시 후쿠오카 타워 1,000엔
오후 2시 모모치 해변
오후 5시 텐진 지하상가 쇼핑 1만엔
셋째날
10시 하카타역 쇼핑 (명란젓 사기)
오후 3시 하카타역 → 후쿠오카공항 260엔
챙길 것: 우산, 동전지갑`;
  return `${d(0)}~${d(3)} 오사카·교토 먹방 여행 2명
가는 편 KE723 ${d(0)} 09:00 인천 → 10:50 간사이
오는 편 KE724 ${d(3)} 18:00 간사이 → 20:00 인천
항공권 56만원
숙소 난바 3박 45000엔
eSIM 4일 18000원
첫째날 오사카
오후 12시 간사이공항 → 난바 라피트 2,900엔
오후 4시 구로몬 시장 4천엔
- 참치 초밥 꼭 먹기
저녁 7시 도톤보리
둘째날 교토
아침 8시 후시미 이나리 (사람 적을 때)
오후 2시 기요미즈데라 500엔
셋째날 오사카
아침 9시 유니버설 스튜디오 재팬 2만엔 (입장권 미리 예매)
넷째날
10시 신사이바시스지 쇼핑 1만엔
오후 3시 난바 → 간사이공항 2,900엔
챙길 것: 우산, 컵라면`;
}
const SAMPLE_TITLES = { 오사카: '오사카·교토 먹방 3박 4일', 도쿄: '도쿄 핵심 3박 4일', 후쿠오카: '후쿠오카 2박 3일' };
function loadSample(key = '오사카') {
  const s = freshState();
  applyText(exampleText(key, addDays(today(), 30)), s, 0);
  s.days.forEach(d => d.items.forEach(it => { delete it.ask; delete it.cands; }));
  s.trip.title = SAMPLE_TITLES[key];
  s.sample = key; s.lastDay = 0; state = s; save(); renderAll();
}

/* ================= 입력창 ================= */
const cText = $('#c-text'), cPrev = $('#c-preview'), cSave = $('#c-save');
function preview() {
  const text = cText.value;
  cSave.disabled = !text.trim();
  if (!text.trim()) { cPrev.innerHTML = ''; return; }
  const clone = JSON.parse(JSON.stringify(state.sample ? freshState() : state));
  const { log } = applyText(text, clone, state.sample ? 0 : state.lastDay);
  cPrev.innerHTML = log.map(l => `<div class="pv ${l.skip ? 'skip' : ''}"><span class="k ${l.k.replace(/\s/g, '')}">${l.k}</span>
    <span>${esc(l.t)}${l.s ? ` <span class="s">${esc(l.s)}</span>` : ''}</span></div>`).join('');
}
let pvTimer;
cText.addEventListener('input', () => { clearTimeout(pvTimer); pvTimer = setTimeout(preview, 120); autoGrow(); });
function autoGrow() { cText.style.height = 'auto'; cText.style.height = Math.min(cText.scrollHeight + 2, 420) + 'px'; }
cText.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commit(); } });
cSave.addEventListener('click', commit);
document.querySelectorAll('[data-example]').forEach(b => b.addEventListener('click', () => {
  cText.value = exampleText(b.dataset.example, addDays(today(), 30)); autoGrow(); preview(); cText.focus();
}));
$('#c-day').addEventListener('change', e => { state.lastDay = +e.target.value; save(); preview(); });

function commit() {
  const text = cText.value; if (!text.trim()) return;
  const before = JSON.stringify(state);
  if (state.sample) state = freshState();
  const { log, day } = applyText(text, state, state.lastDay || 0);
  const n = log.filter(l => !l.skip).length;
  if (!n) { state = JSON.parse(before); toast(log.length ? '이미 다 들어 있는 내용이에요' : '알아볼 수 있는 내용이 없었어요'); return; }
  state.lastDay = Math.min(day, Math.max(0, state.days.length - 1));
  if (!ai) state.days.forEach(d => d.items.forEach(it => { delete it.ask; }));
  save(); cText.value = ''; autoGrow(); preview(); renderAll();
  const days = [...new Set(log.filter(l => l.day !== undefined).map(l => l.day))];
  days.forEach(i => { const el = document.querySelector(`.day[data-day="${i}"]`); if (el) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); } });
  if (days.length) document.querySelector(`.day[data-day="${days[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const upd = log.filter(l => l.k === '수정' || l.k === '삭제').length;
  toast(upd ? `${n - upd}개 추가, ${upd}개 고쳤어요` : `${n}개 정리해서 저장했어요`,
    () => { state = JSON.parse(before); save(); renderAll(); cText.value = text; autoGrow(); preview(); });
  resolvePending().then(geocodePending);
}

/* ================= 토스트 ================= */
let toastTimer;
function toast(msg, undo) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button>되돌리기</button>' : ''}`;
  el.hidden = false;
  if (undo) el.querySelector('button').onclick = () => { undo(); el.hidden = true; };
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 6000);
}

/* ================= 히어로 ================= */
function flightHTML(f) {
  const date = f.date ? dshort(parseDate(f.date)) : '';
  const ap = a => esc((a || '?').replace('공항', ''));
  return `<div class="flight"><span class="f-dir">${f.dir === 'out' ? '가는 편' : '오는 편'}</span>
    <span class="f-code">${esc(f.code || '항공편')}</span>
    <span class="f-route"><b>${f.dep || '--:--'}</b> ${ap(f.from)} <i>→</i> <b>${f.arr || '--:--'}</b> ${ap(f.to)}</span>
    ${date ? `<span class="f-date">${date}</span>` : ''}</div>`;
}
function stayHTML(x) {
  const s = parseDate(state.trip.start);
  return `<div class="flight"><span class="f-dir">숙소</span><span class="f-code">${esc(x.name)}</span>
    <span class="f-date">${s ? `${dshort(addDays(s, x.from))} ~ ${dshort(addDays(s, x.from + x.nights))} · ` : `${x.from + 1}일차부터 `}${x.nights}박</span></div>`;
}
function renderHero() {
  const t = state.trip, s = parseDate(t.start), n = tripLength();
  let stamp = '', meta;
  if (s) {
    const end = addDays(s, n - 1), d = diffDays(today(), s);
    const [big, small] = d > 0 ? ['D-' + d, '출발까지'] : today() <= end ? [`${1 - d}일차`, '여행 중'] : ['完', '다녀왔어요'];
    stamp = `<div class="stamp" aria-label="${small} ${big}"><b>${big}</b><small>${small}</small></div>`;
    meta = `${dlong(s)} — ${dlong(end)} · ${n - 1}박 ${n}일 · ${t.people}명`;
  } else {
    meta = '아래에 “12/16~19 오사카 2명”처럼 적으면 날짜가 잡혀요';
  }
  const fl = (state.flights || []).slice().sort((a, b) => a.dir === 'out' ? -1 : b.dir === 'out' ? 1 : 0);
  $('#hero').innerHTML = `<div class="hero-text"><p class="eyebrow">JAPAN TRIP · 日本旅行</p>
    <h1 class="${t.title ? '' : 'placeholder'}">${esc(t.title || '어디로 떠나세요?')}</h1>
    <p class="h-meta">${meta}<button class="ghost" data-open-settings>수정</button></p>
    ${t.cities.length ? `<div class="h-cities">${t.cities.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}
    ${fl.length || (state.stays || []).length ? `<div class="flights">${fl.map(flightHTML).join('')}${(state.stays || []).map(stayHTML).join('')}</div>` : ''}</div>${stamp}`;
  $('#sample-banner').hidden = !state.sample;
}

/* ================= 일정 ================= */
const dayTotal = d => d.items.reduce((s, it) => s + num(it.cost), 0);

function candsHTML(it) {
  if (it.cands === 'loading') return '<div class="cands"><span class="c-q">정확한 장소를 찾는 중…</span></div>';
  if (!Array.isArray(it.cands) || !it.cands.length) return '';
  return `<div class="cands"><span class="c-q">혹시 이곳인가요?</span>${it.cands.map((c, i) =>
    `<button data-cand="${i}" title="${esc(c.note)}">${esc(c.name)}${c.area ? ` <small>${esc(c.area)}</small>` : ''}</button>`).join('')}
    <button data-cand="-1" class="ghost">그대로 두기</button></div>`;
}
function evHTML(it, di) {
  const d = state.days[di];
  if (it.id === editingId) {
    return `<li class="ev editing" data-id="${it.id}" data-day="${di}">
      <div class="ed">
        <input type="time" data-f="time" value="${esc(it.time)}" aria-label="시간">
        <input class="title" data-f="title" value="${esc(it.title)}" placeholder="장소·할 일" aria-label="장소">
        <select data-f="type" aria-label="종류">${TYPES.map(x => `<option ${x === it.type ? 'selected' : ''}>${x}</option>`).join('')}</select>
        <input data-f="cost" inputmode="numeric" value="${it.cost ? fmt(it.cost) : ''}" placeholder="비용(엔)" aria-label="비용(엔)">
        <input class="memo" data-f="memo" value="${esc(it.memo)}" placeholder="메모 — 예약번호, 출구, 가는 법…" aria-label="메모">
      </div>
      <div class="ed-acts">
        <a href="${mapUrl(placeOf(it.title), d.city)}" target="_blank" rel="noopener">지도</a>
        <button data-act="up" aria-label="위로">↑</button><button data-act="down" aria-label="아래로">↓</button>
        <button data-act="del" class="danger">삭제</button><span class="sp"></span>
        <button data-act="done" class="primary">완료</button>
      </div></li>`;
  }
  const e = ends(it);
  const inner = e.move ? legInfo(d, e.from, e.to) : null;
  const meta = [`<span class="tag">${esc(it.type)}</span>`, it.cost ? yen(it.cost) : '',
    inner ? `<span>${esc(inner.mode)} ${inner.est ? '약 ' : ''}${durText(inner.min)}${inner.route ? ' · ' + esc(inner.route) : ''}</span>` : ''].filter(Boolean).join('');
  const go = it.flight ? (it.flight.dir === 'back' && e.to ? goUrl(e.to, '') : '') : e.move ? dirUrl(e.from, e.to, d.city) : goUrl(e.to, d.city);
  return `<li class="ev ${it.flight ? 'is-flight' : ''}" data-id="${it.id}" data-day="${di}" style="--c:${tcolor(it.type)}" tabindex="0" role="button" aria-label="${esc(it.title)} 수정">
    <span class="ev-time ${it.time ? '' : 'none'}">${it.time || '—'}</span><span class="ev-dot"></span>
    <div><div class="ev-title">${esc(it.title)}</div><div class="ev-meta">${meta}</div>
    ${it.memo ? `<div class="ev-memo">${esc(it.memo)}</div>` : ''}${candsHTML(it)}</div>
    ${go ? `<a class="ev-go" href="${go}" target="_blank" rel="noopener" title="구글맵 길찾기 (내 위치에서)">길찾기</a>` : '<span></span>'}</li>`;
}

function stayRowHTML(x, d) {
  const go = goUrl(x.title, d.city);
  return `<li class="stay"><span class="ev-time">${x.pos === 'start' ? '출발' : '숙소로'}</span><span class="ev-dot stay-dot">宿</span>
    <div><div class="ev-title">${esc(x.stay.name)}</div><div class="ev-meta"><span>${x.pos === 'start' ? '어젯밤 묵은 숙소' : '오늘 밤 숙소'}</span></div></div>
    <a class="ev-go" href="${go}" target="_blank" rel="noopener" title="구글맵 길찾기 (내 위치에서)">길찾기</a></li>`;
}
function renderPlan() {
  syncDays();
  const s = parseDate(state.trip.start), n = tripLength();
  const totalYen = state.days.reduce((a, d) => a + dayTotal(d), 0);
  if (!state.days.some(d => d.items.length) && !s) {
    $('#plan').innerHTML = `<div class="sec-h"><h2>일정</h2></div>
      <div class="plan-empty"><b>아직 일정이 없어요.</b><br>위 입력창에 날짜, 항공편, 가고 싶은 곳을 편하게 적어 보세요. 나눠서 여러 번 적어도 돼요.</div>`;
    renderDaySelect(); return;
  }
  const days = state.days.map((d, di) => {
    const date = s ? addDays(s, di) : null;
    const cityOpts = ['', ...new Set([...state.trip.cities, ...(d.city ? [d.city] : [])])]
      .map(c => `<option value="${esc(c)}" ${c === d.city ? 'selected' : ''}>${c || '도시'}</option>`).join('');
    const added = new Set(d.items.map(i => squash(i.title)));
    const recs = (CITIES[d.city] || []).filter(([nm]) => !added.has(squash(nm))).slice(0, 6);
    const seq = daySeq(di);
    const route = [];
    seq.forEach(it => { const e = ends(it); [e.from, e.to].forEach(p => { if (p && squash(route[route.length - 1]) !== squash(p)) route.push(p); }); });
    return `<article class="day" data-day="${di}">
      <div class="day-h"><span class="day-no">DAY ${di + 1}</span>
        ${date ? `<span class="day-date">${dshort(date)}</span>` : ''}
        <select class="day-city" data-city-of="${di}" aria-label="${di + 1}일차 도시">${cityOpts}</select>
        ${s && di >= n ? '<span class="day-sum">여행 기간 밖</span>' : `<span class="day-sum">${dayTotal(d) ? yen(dayTotal(d)) : ''}</span>`}</div>
      ${d.items.length ? `<ul class="evs">${seq.map((it, i) => (i && !editingId ? legHTML(d, seq[i - 1], it) : '') + (it.stay ? stayRowHTML(it, d) : evHTML(it, di))).join('')}</ul>` : '<p class="day-empty">비어 있어요. 위 입력창에 “' + (di + 1) + '일차 …”로 적거나 아래에서 골라 보세요.</p>'}
      <div class="day-f"><button data-new="${di}">+ 직접 추가</button>
        ${route.length >= 1 ? `<button data-mapday="${di}" class="ghost">지도에서 보기</button>` : ''}
        ${route.length >= 2 ? `<a class="pill-a" href="${dayRouteUrl(route, d.city)}" target="_blank" rel="noopener">구글맵에서 하루 경로</a>` : ''}
        ${ai && dayLegs(di).length ? `<button data-ai="${di}" class="ghost">AI로 이동 시간 계산</button>` : ''}
        ${d.items.filter(x => x.time).length > 1 ? `<button data-sort="${di}" class="ghost">시간순</button>` : ''}
        ${s && di >= n && !d.items.length ? `<button data-dropday="${di}" class="ghost">이 날 지우기</button>` : ''}</div>
      ${recs.length ? `<div class="recs">${recs.map(([nm, ty]) => `<button data-add="${esc(nm)}" data-type="${ty}">+ ${esc(nm)}</button>`).join('')}</div>` : ''}
    </article>`;
  }).join('');
  $('#plan').innerHTML = `<div class="sec-h"><h2>일정</h2>
    <span class="s" id="plan-total">${totalYen ? `현지 비용 ${yen(totalYen)} ≈ ${won(toKRW(totalYen, 'jpy'))}` : ''}</span></div>${days}`;
  renderDaySelect();
  renderMap();
}
function renderDaySelect() {
  const s = parseDate(state.trip.start), len = Math.max(state.days.length, 1);
  if ((state.lastDay || 0) >= len) state.lastDay = len - 1;
  $('#c-day').innerHTML = Array.from({ length: len }, (_, i) =>
    `<option value="${i}" ${i === (state.lastDay || 0) ? 'selected' : ''}>${i + 1}일차${s ? ' · ' + dshort(addDays(s, i)) : ''}</option>`).join('');
}

function itemOf(el) {
  const li = el.closest('.ev'); if (!li) return {};
  const d = state.days[+li.dataset.day]; const i = d.items.findIndex(x => x.id === li.dataset.id);
  return { d, i, it: d.items[i], li };
}
function refreshTotals() {
  state.days.forEach((d, di) => { const el = document.querySelector(`.day[data-day="${di}"] .day-sum`); if (el && !/밖/.test(el.textContent)) el.textContent = dayTotal(d) ? yen(dayTotal(d)) : ''; });
  const totalYen = state.days.reduce((a, d) => a + dayTotal(d), 0);
  const t = $('#plan-total'); if (t) t.textContent = totalYen ? `현지 비용 ${yen(totalYen)} ≈ ${won(toKRW(totalYen, 'jpy'))}` : '';
  renderBudget();
}
const plan = $('#plan');
plan.addEventListener('input', e => {
  const f = e.target.dataset.f; if (!f) return;
  const { it, li } = itemOf(e.target); if (!it) return;
  if (f === 'cost') it.cost = num(e.target.value); else it[f] = e.target.value;
  if (f === 'title') { delete it.cands; li.querySelector('.ed-acts a').href = mapUrl(placeOf(it.title), state.days[+li.dataset.day].city); }
  save(); if (f === 'cost') refreshTotals();
});
plan.addEventListener('change', e => {
  if (e.target.dataset.f === 'cost') e.target.value = num(e.target.value) ? fmt(num(e.target.value)) : '';
  if (e.target.dataset.cityOf !== undefined) { state.days[+e.target.dataset.cityOf].city = e.target.value; save(); renderPlan(); }
});
plan.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('.ev:not(.editing)')) { e.preventDefault(); e.target.click(); }
  if (e.key === 'Enter' && e.target.matches('.ed input')) { e.preventDefault(); stopEditing(); }
  if (e.key === 'Escape' && editingId) stopEditing();
});
function stopEditing() {
  const d = state.days.find(x => x.items.some(i => i.id === editingId));
  if (d) { const it = d.items.find(i => i.id === editingId); if (!it.title.trim()) d.items.splice(d.items.indexOf(it), 1); }
  editingId = null; save(); renderPlan(); renderBudget();
}
plan.addEventListener('click', e => {
  if (e.target.closest('a')) return;
  const b = e.target.closest('button');
  if (b && b.dataset.ai !== undefined) return aiDay(+b.dataset.ai, b);
  if (b && b.dataset.mapday !== undefined) { mapDay = +b.dataset.mapday; renderMap(); $('#mapsec').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  if (b && b.dataset.cand !== undefined) {
    const { it } = itemOf(b); if (!it) return;
    const i = +b.dataset.cand;
    if (i >= 0 && Array.isArray(it.cands)) { const c = it.cands[i]; pickCand(it, c); toast(`‘${c.name}’(으)로 바꿨어요`); }
    else { delete it.cands; delete it.ask; }
    save(); renderPlan(); return;
  }
  if (!b) {
    const li = e.target.closest('.ev:not(.editing)');
    if (li) { if (editingId) stopEditing(); editingId = li.dataset.id; renderPlan(); document.querySelector(`.ev[data-id="${editingId}"] [data-f="title"]`)?.focus(); }
    return;
  }
  if (b.dataset.new !== undefined) {
    if (editingId) stopEditing();
    const id = uid(); state.days[+b.dataset.new].items.push({ id, time: '', title: '', type: '관광', cost: 0, memo: '' });
    editingId = id; renderPlan(); document.querySelector(`.ev[data-id="${id}"] [data-f="title"]`)?.focus(); return;
  }
  if (b.dataset.add) {
    const di = +b.closest('.day').dataset.day;
    state.days[di].items.push({ id: uid(), time: '', title: b.dataset.add, type: b.dataset.type, cost: 0, memo: '' });
    save(); renderPlan(); return;
  }
  if (b.dataset.sort !== undefined) {
    state.days[+b.dataset.sort].items.sort((a, c) => (a.time || '99').localeCompare(c.time || '99'));
    save(); renderPlan(); return;
  }
  if (b.dataset.dropday !== undefined) { state.days.splice(+b.dataset.dropday, 1); save(); renderAll(); return; }
  const { d, i } = itemOf(b); if (!d) return;
  const act = b.dataset.act;
  if (act === 'done') return stopEditing();
  if (act === 'del') {
    const it = d.items[i]; d.items.splice(i, 1); editingId = null;
    if (it.flight) state.flights = (state.flights || []).filter(f => f.dir !== it.flight.dir);
    save(); renderAll();
    toast(`‘${it.title || '일정'}’ 지웠어요`, () => { d.items.splice(i, 0, it); save(); renderAll(); }); return;
  }
  if (act === 'up' && i > 0) [d.items[i - 1], d.items[i]] = [d.items[i], d.items[i - 1]];
  if (act === 'down' && i < d.items.length - 1) [d.items[i + 1], d.items[i]] = [d.items[i], d.items[i + 1]];
  save(); renderPlan();
});

/* ================= 예산 ================= */
const EXTRA_COLOR = { 항공: 'var(--ink)', 숙소: 'var(--t-숙소)', 교통패스: 'var(--t-이동)', 통신: 'var(--muted)', 보험: 'var(--muted)', 기타: 'var(--muted)' };
function renderBudget() {
  const groups = {};
  for (const x of state.extras) { const k = x.cat; groups[k] = groups[k] || { v: 0, c: EXTRA_COLOR[x.cat] || 'var(--muted)' }; groups[k].v += toKRW(num(x.amount), x.cur); }
  let localYen = 0;
  for (const d of state.days) for (const it of d.items) {
    localYen += num(it.cost);
    const k = it.type; groups[k] = groups[k] || { v: 0, c: tcolor(k) }; groups[k].v += toKRW(num(it.cost), 'jpy');
  }
  const rows = Object.entries(groups).filter(([, g]) => g.v > 0).sort((a, b) => b[1].v - a[1].v);
  const total = rows.reduce((a, [, g]) => a + g.v, 0), p = state.trip.people || 1;
  $('#budget').innerHTML = `<h2>예산 <small>100엔 = ${fmt(state.trip.rate)}원</small></h2>
    <div class="big">${won(total)}</div>
    <div class="subnums"><div><span>1인당</span><b>${won(total / p)}</b></div><div><span>현지에서 쓸 돈</span><b>${yen(localYen)}</b></div></div>
    ${rows.length ? `<div class="stack">${rows.map(([, g]) => `<span style="width:${g.v / total * 100}%;background:${g.c}"></span>`).join('')}</div>
    <ul class="legend">${rows.map(([k, g]) => `<li><i style="background:${g.c}"></i><span>${esc(k)}</span><span>${won(g.v)}</span></li>`).join('')}</ul>`
    : '<p class="hint">“항공권 56만원”, “숙소 3박 45000엔”처럼 적으면 여기에 모여요.</p>'}
    ${state.extras.length ? `<div class="xs"><p>항공·숙소 등 — 같은 항목을 다시 적으면 금액이 바뀌어요</p>${state.extras.map(x => `<div class="x" data-x="${x.id}">
      <input data-f="name" value="${esc(x.name)}" aria-label="항목 이름">
      <input data-f="amount" class="amt" inputmode="numeric" value="${fmt(x.amount)}${x.cur === 'jpy' ? '엔' : '원'}" aria-label="금액">
      <button data-xdel aria-label="${esc(x.name)} 삭제">✕</button></div>`).join('')}</div>` : ''}`;
}
const budget = $('#budget');
budget.addEventListener('change', e => {
  const x = state.extras.find(v => v.id === e.target.closest('[data-x]')?.dataset.x); if (!x) return;
  if (e.target.dataset.f === 'name') x.name = e.target.value;
  if (e.target.dataset.f === 'amount') { const mo = parseMoney(e.target.value); if (mo) { x.amount = mo.value; x.cur = mo.cur; } else x.amount = num(e.target.value); }
  save(); renderBudget();
});
budget.addEventListener('click', e => {
  if (!e.target.closest('[data-xdel]')) return;
  const id = e.target.closest('[data-x]').dataset.x; state.extras = state.extras.filter(x => x.id !== id); save(); renderBudget();
});

/* ================= 준비물 ================= */
function renderPack() {
  const groups = [...new Set([...Object.keys(DEFAULT_PACK), ...state.pack.map(p => p.group)])];
  const done = state.pack.filter(p => p.done).length, all = state.pack.length;
  $('#pack').innerHTML = `<h2>준비물 <small>${done} / ${all}</small></h2>
    <div class="prog"><span style="width:${all ? done / all * 100 : 0}%"></span></div>
    ${groups.map(g => { const list = state.pack.filter(p => p.group === g); return list.length ? `<div class="pg"><p class="pg-h">${esc(g)}</p>
      ${list.map(p => `<div class="pk ${p.done ? 'done' : ''}"><input type="checkbox" id="pk-${p.id}" data-pk="${p.id}" ${p.done ? 'checked' : ''}>
        <label for="pk-${p.id}">${esc(p.text)}</label><button data-pdel="${p.id}" aria-label="${esc(p.text)} 삭제">✕</button></div>`).join('')}</div>` : ''; }).join('')}
    <p class="hint">“챙길 것: 우산, 컵라면”처럼 적으면 추가돼요.</p>`;
}
$('#pack').addEventListener('change', e => { const p = state.pack.find(x => x.id === e.target.dataset.pk); if (p) { p.done = e.target.checked; save(); renderPack(); } });
$('#pack').addEventListener('click', e => { const id = e.target.closest('[data-pdel]')?.dataset.pdel; if (id) { state.pack = state.pack.filter(p => p.id !== id); save(); renderPack(); } });

/* ================= 팁 ================= */
function renderTips() {
  $('#tips').innerHTML = `<h2>알아두면 좋은 것</h2><div class="tip-grid">
  <div class="card"><h2>이렇게 적어 보세요</h2><ul class="tip-list">
    <li><b>항공편</b> — <code>가는 편 KE723 12/16 09:00 인천 → 10:50 간사이</code></li>
    <li><b>숙소</b> — <code>숙소 난바 OO호텔 3박 45000엔</code>, 도중에 바꾸면 <code>숙소 교토 OO료칸 3일차 1박</code></li>
    <li><b>나중에 추가</b> — <code>3일차 오후 2시 금각사</code> 처럼 날짜를 붙여 언제든 더 적어요.</li>
    <li><b>고치기</b> — <code>기요미즈데라 오후 4시로</code>, <code>구로몬 시장 5천엔</code>, <code>금각사 2일차로</code></li>
    <li><b>빼기</b> — <code>도톤보리 빼기</code></li>
    <li><b>대충 적기</b> — <code>이케부쿠로 치이카와</code>처럼 적으면 후보를 보여줘요. (오타는 바로, 모호한 곳은 claude.ai에서 AI가 찾아줘요)</li>
  </ul></div>
  <div class="card"><h2>꼭 알아둘 것</h2><ul class="tip-list">
    <li><b>입국</b> — 출발 전 Visit Japan Web에 등록해 두면 QR코드로 빠르게 통과해요.</li>
    <li><b>교통카드</b> — Suica·PASMO·ICOCA 하나면 전철·버스·편의점까지 돼요. 아이폰은 지갑 앱에 넣을 수 있어요.</li>
    <li><b>교통패스</b> — 하루 3~4번 이상 탈 때만 이득인 경우가 많아요. 일정의 ‘이동’ 비용과 비교해 보세요.</li>
    <li><b>전기</b> — 100V, 11자 A타입이라 돼지코가 필요해요. 휴대폰 충전기는 대부분 그대로 써요.</li>
    <li><b>면세</b> — 2026년 11월부터 ‘세금 포함해 결제하고 출국 때 환급’ 방식으로 바뀌었어요. 구매 시 여권을 챙기세요.</li>
    <li><b>현금</b> — 작은 식당·신사·버스는 현금만 받기도 해요. 동전 지갑이 있으면 편해요.</li>
  </ul></div>
  <div class="card"><h2>바로 쓰는 일본어</h2>${PHRASES.map(([ja, pr, ko]) =>
    `<div class="phr"><span class="ja" lang="ja">${ja}</span><span class="pr">${pr}</span><span class="ko">${ko}</span></div>`).join('')}</div>
  <div class="card"><h2>급할 때</h2><ul class="tip-list">
    <li>경찰 <b>110</b> · 구급차·소방 <b>119</b></li>
    <li>외교부 영사콜센터 <b>+82-2-3210-0404</b> (24시간)</li>
    <li>여권을 잃어버리면 가까운 경찰서에서 분실 신고서를 받고, 한국 대사관·영사관에서 여행증명서를 발급받아요.</li>
  </ul></div></div>`;
}

/* ================= 설정 ================= */
const dlg = $('#settings');
function openSettings() {
  const t = state.trip;
  $('#t-title').value = t.title; $('#t-start').value = t.start; $('#t-end').value = t.end;
  $('#t-people').value = t.people; $('#t-rate').value = fmt(t.rate);
  $('#city-picks').innerHTML = Object.keys(CITIES).map(c => `<button type="button" data-city="${c}" aria-pressed="${t.cities.includes(c)}">${c}</button>`).join('');
  $('#io-msg').textContent = '';
  dlg.showModal();
}
document.addEventListener('click', e => { if (e.target.closest('[data-open-settings], #open-settings')) openSettings(); });
function onTrip() {
  const t = state.trip;
  t.title = $('#t-title').value.trim(); t.start = $('#t-start').value;
  t.end = $('#t-end').value && $('#t-end').value >= t.start ? $('#t-end').value : t.start;
  t.people = Math.max(1, Math.min(20, num($('#t-people').value) || 1)); t.rate = num($('#t-rate').value) || 930;
  state.sample = false; save(); renderAll();
}
['#t-title', '#t-start', '#t-end', '#t-people', '#t-rate'].forEach(s => $(s).addEventListener('change', onTrip));
$('#city-picks').addEventListener('click', e => {
  const b = e.target.closest('[data-city]'); if (!b) return;
  const list = state.trip.cities, c = b.dataset.city, i = list.indexOf(c);
  if (i >= 0) list.splice(i, 1); else list.push(c);
  b.setAttribute('aria-pressed', i < 0);
  state.days.forEach(d => { if (!d.city) d.city = list[0] || ''; });
  save(); renderAll();
});
const ioMsg = t => { $('#io-msg').textContent = t; };
$('#export').addEventListener('click', async () => {
  const text = JSON.stringify(state); $('#io-text').value = text;
  try { await navigator.clipboard.writeText(text); ioMsg('복사했어요. 메신저나 메모에 붙여넣어 보관하세요.'); }
  catch (e) { $('#io-text').select(); ioMsg('아래 내용을 길게 눌러 복사하세요.'); }
});
$('#import').addEventListener('click', () => {
  try { const s = JSON.parse($('#io-text').value); if (!s || !s.trip || !Array.isArray(s.days)) throw 0;
    state = Object.assign(freshState(), s, { sample: false }); save(); renderAll(); ioMsg('불러왔어요.');
  } catch (e) { ioMsg('내용을 읽을 수 없어요. 내보내기로 복사한 글 전체를 붙여넣었는지 확인하세요.'); }
});
$('#print').addEventListener('click', () => { dlg.close(); setTimeout(() => window.print(), 100); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sample]'); if (!b) return;
  loadSample(b.dataset.sample); if (dlg.open) dlg.close();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast(`${SAMPLE_TITLES[b.dataset.sample]} 예시를 불러왔어요`);
});
let armed = false;
$('#reset').addEventListener('click', () => {
  const b = $('#reset');
  if (!armed) { armed = true; b.textContent = '정말 지울까요? 한 번 더'; setTimeout(() => { armed = false; b.textContent = '전체 초기화'; }, 4000); return; }
  armed = false; b.textContent = '전체 초기화';
  state = freshState(); save(); renderAll(); dlg.close(); toast('모두 지웠어요');
});
$('#clear-sample').addEventListener('click', () => { state = freshState(); save(); renderAll(); cText.focus(); });


/* ================= 지도 ================= */
const DAY_COLORS = ['#c43d27', '#3d68b0', '#2f8a65', '#8b58a8', '#cf7426', '#8d5f3d', '#d14d8f', '#2a8a9a'];
let map = null, mapLayer = null, tileLayer = null, mapDay = 0, tilesFailed = 0, tilesOk = false;
let base = null, labelLayer = null;
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
// 지도 배경을 외부에서 못 불러올 때 쓰는 자체 배경 (해안선·철도·역)
function loadBase() {
  if (base) return;
  base = 'loading';
  fetch('japan-base.json').then(r => r.json()).then(data => { base = data; drawBase(); }).catch(() => { base = null; });
}
function drawBase() {
  if (!map || !base || base === 'loading') return;
  const r = L.canvas({ padding: 0.3, pane: 'base' });
  const land = cssVar('--land'), coast = cssVar('--coast'), rail = cssVar('--rail'), shin = cssVar('--shin');
  L.polygon(base.land.map(a => { const pts = []; for (let i = 0; i < a.length; i += 2) pts.push([a[i + 1], a[i]]); return pts; }),
    { renderer: r, pane: 'base', fillColor: land, fillOpacity: 1, color: coast, weight: 1, interactive: false }).addTo(map);
  for (const [name, kind, ids] of base.ln) {
    const segs = []; let cur = [];
    const gap = kind === 2 ? 0.9 : 0.12;
    ids.forEach(i => { const s0 = base.st[i], ll = [s0[1], s0[2]], prev = cur[cur.length - 1];
      if (prev && Math.abs(prev[0] - ll[0]) + Math.abs(prev[1] - ll[1]) > gap) { if (cur.length > 1) segs.push(cur); cur = []; }
      cur.push(ll); });
    if (cur.length > 1) segs.push(cur);
    if (segs.length) L.polyline(segs, { renderer: r, pane: 'base', color: kind === 2 ? shin : rail, weight: kind === 2 ? 2.5 : kind === 1 ? 1.6 : 1.1, opacity: .9, interactive: false }).addTo(map);
  }
  map.attributionControl.addAttribution(base.credit);
  updateLabels();
}
// 확대하면 역 이름(일본어)과 주요 장소(한국어)를 보여줌
function updateLabels() {
  if (!map || !labelLayer) return;
  labelLayer.clearLayers();
  if (tilesOk) return;
  const z = map.getZoom(), b = map.getBounds().pad(0.1);
  if (z >= 12) {
    const seen = new Set(); let n = 0;
    for (const [k, ll] of Object.entries(COORDS)) {
      const key = ll.join(); if (/^[A-Z]+$/.test(k) || seen.has(key) || !b.contains(ll)) continue; seen.add(key);
      if (++n > 60) break;
      L.marker(ll, { pane: 'labels', interactive: false, icon: L.divIcon({ className: 'lb-ko', html: `<span>${esc(k)}</span>`, iconSize: [0, 0] }) }).addTo(labelLayer);
    }
  }
  if (base && base !== 'loading' && z >= 13) {
    let n = 0;
    for (const [name, la, ln] of base.st) {
      if (!b.contains([la, ln])) continue;
      if (++n > 160) break;
      L.marker([la, ln], { pane: 'labels', interactive: false, icon: L.divIcon({ className: 'lb-st', html: `<i></i>${z >= 14 ? `<span lang="ja">${esc(name)}</span>` : ''}`, iconSize: [0, 0] }) }).addTo(labelLayer);
    }
  }
}
const darkMode = () => matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.dataset.theme !== 'light' || document.documentElement.dataset.theme === 'dark';
// 하루 동선의 지도 점들
function dayPoints(di) {
  const pts = [], missing = [];
  const add = (name, kind, label) => {
    const ll = locate(name);
    if (!ll) { if (!missing.includes(name)) missing.push(name); return; }
    const last = pts[pts.length - 1];
    if (last && last.ll[0] === ll[0] && last.ll[1] === ll[1]) return;
    pts.push({ ll, name, kind, label });
  };
  let n = 0;
  for (const it of daySeq(di)) {
    if (it.stay) { add(it.stay.name, 'stay', '宿'); continue; }
    const e = ends(it);
    if (it.flight) { add(e.to, 'air', '✈'); continue; }
    if (e.move) { add(e.from, 'pass', ''); add(e.to, 'pass', ''); continue; }
    n++; add(e.to, 'stop', String(n));
  }
  return { pts, missing };
}
function renderMap() {
  const sec = $('#mapsec'); if (!sec) return;
  const len = state.days.length;
  if (!len || !state.days.some(d => d.items.length) && !(state.stays || []).length) { sec.hidden = true; return; }
  sec.hidden = false;
  if (mapDay !== 'all' && mapDay >= len) mapDay = 0;
  const s = parseDate(state.trip.start);
  $('#map-tabs').innerHTML = `<button data-md="all" aria-pressed="${mapDay === 'all'}">전체</button>` + state.days.map((d, i) =>
    `<button data-md="${i}" aria-pressed="${mapDay === i}"><i style="background:${DAY_COLORS[i % DAY_COLORS.length]}"></i>DAY ${i + 1}${s ? ' · ' + dshort(addDays(s, i)) : ''}</button>`).join('');
  const days = mapDay === 'all' ? state.days.map((_, i) => i) : [mapDay];
  const sets = days.map(i => ({ i, ...dayPoints(i) }));
  const missing = [...new Set(sets.flatMap(x => x.missing))];
  $('#map-miss').innerHTML = missing.length ? `<span>위치를 몰라 지도에 없는 곳: ${missing.map(esc).join(', ')}</span>${ai ? ' <button class="link" data-geo>AI로 위치 찾기</button>' : ''}` : '';
  const all = sets.flatMap(x => x.pts);
  $('#map-empty').hidden = all.length > 0;
  if (window.L) drawLeaflet(sets, all); else drawSvg(sets, all);
}
function markerHTML(p, color) {
  if (p.kind === 'pass') return `<span class="mk k-pass" style="border-color:${color}"></span>`;
  return `<span class="mk k-${p.kind}" style="background:${p.kind === 'stop' ? color : ''}">${esc(p.label)}</span>`;
}
function drawLeaflet(sets, all) {
  const el = $('#map');
  if (!map) {
    map = L.map(el, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    map.createPane('base').style.zIndex = 150;
    map.createPane('labels').style.zIndex = 350;
    map.getPane('labels').style.pointerEvents = 'none';
    labelLayer = L.layerGroup().addTo(map);
    map.on('zoomend moveend', updateLabels);
    loadBase();
    const style = darkMode() ? 'dark_all' : 'rastertiles/voyager';
    tileLayer = L.tileLayer(`https://{s}.basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png`, {
      maxZoom: 19, subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);
    tileLayer.on('tileerror', () => { if (++tilesFailed === 3 && !tilesOk) map.removeLayer(tileLayer); });
    tileLayer.on('tileload', () => { if (!tilesOk) { tilesOk = true; el.classList.add('tiles-ok'); updateLabels(); } });
    mapLayer = L.layerGroup().addTo(map);
    map.setView([35.68, 139.76], 5);
  }
  mapLayer.clearLayers();
  for (const set of sets) {
    const color = DAY_COLORS[set.i % DAY_COLORS.length];
    if (set.pts.length >= 2) L.polyline(set.pts.map(p => p.ll), { color, weight: 4, opacity: .85, dashArray: mapDay === 'all' ? '1 8' : null, lineCap: 'round' }).addTo(mapLayer);
    for (const p of set.pts) {
      L.marker(p.ll, { icon: L.divIcon({ className: 'mk-wrap', html: markerHTML(p, color), iconSize: [26, 26], iconAnchor: [13, 13] }), title: p.name, zIndexOffset: p.kind === 'stop' ? 1000 : 0 })
        .bindTooltip(`${mapDay === 'all' ? `DAY ${set.i + 1} · ` : ''}${p.name}`, { direction: 'top', offset: [0, -12] }).addTo(mapLayer);
    }
  }
  setTimeout(() => {
    map.invalidateSize();
    if (all.length === 1) map.setView(all[0].ll, 14);
    else if (all.length) map.fitBounds(L.latLngBounds(all.map(p => p.ll)), { padding: [36, 36], maxZoom: 15 });
    else map.setView([35.0, 136.5], 6);
  }, 0);
}
// 지도 라이브러리를 못 불러왔을 때: 위치만 비율대로 그린 간단한 그림
function drawSvg(sets, all) {
  const el = $('#map'); el.classList.add('svg-map');
  if (!all.length) { el.innerHTML = ''; return; }
  const lats = all.map(p => p.ll[0]), lngs = all.map(p => p.ll[1]);
  const minLa = Math.min(...lats), maxLa = Math.max(...lats), minLn = Math.min(...lngs), maxLn = Math.max(...lngs);
  const W = 600, H = 360, pad = 36, k = Math.cos((minLa + maxLa) / 2 * Math.PI / 180);
  const sx = (maxLn - minLn) * k || 0.01, sy = (maxLa - minLa) || 0.01, sc = Math.min((W - pad * 2) / sx, (H - pad * 2) / sy);
  const xy = ll => [W / 2 + ((ll[1] - (minLn + maxLn) / 2) * k) * sc, H / 2 - (ll[0] - (minLa + maxLa) / 2) * sc];
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="일정 위치 그림">${sets.map(set => {
    const c = DAY_COLORS[set.i % DAY_COLORS.length];
    const line = set.pts.length >= 2 ? `<polyline points="${set.pts.map(p => xy(p.ll).join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ${mapDay === 'all' ? 'stroke-dasharray="2 7"' : ''}/>` : '';
    const dots = set.pts.map(p => { const [x, y] = xy(p.ll);
      return `<g><circle cx="${x}" cy="${y}" r="${p.kind === 'pass' ? 5 : 11}" fill="${p.kind === 'stop' ? c : p.kind === 'pass' ? 'var(--surface)' : 'var(--ink)'}" stroke="${p.kind === 'pass' ? c : 'var(--surface)'}" stroke-width="2"/>
        ${p.label ? `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="${p.kind === 'stop' ? '#fff' : 'var(--bg)'}">${esc(p.label)}</text>` : ''}
        <text x="${x + 14}" y="${y + 4}" font-size="11" fill="var(--ink)">${esc(p.name)}</text><title>${esc(p.name)}</title></g>`; }).join('');
    return line + dots; }).join('')}</svg>`;
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-md]');
  if (t) { mapDay = t.dataset.md === 'all' ? 'all' : +t.dataset.md; renderMap(); return; }
  if (e.target.closest('[data-geo]')) geocodePending(true);
});
// 위치를 모르는 장소 → AI에게 좌표 묻기 (claude.ai에서만)
let geocoding = false;
async function geocodePending(force) {
  if (!ai || geocoding) return;
  state.geoMiss = state.geoMiss || [];
  const want = [];
  state.days.forEach((d, di) => daySeq(di).forEach(it => {
    const names = it.stay ? [it.stay.name] : it.flight ? [] : (() => { const e = ends(it); return e.move ? [e.from, e.to] : [e.to]; })();
    names.forEach(n => { const k = squash(n); if (n && !locate(n) && (force || !state.geoMiss.includes(k)) && !want.some(w => w.k === k)) want.push({ k, n, city: d.city || state.trip.cities.join(', ') }); });
  }));
  if (!want.length) return;
  geocoding = true;
  const btn = document.querySelector('[data-geo]'); if (btn) { btn.disabled = true; btn.textContent = '찾는 중…'; }
  const list = want.slice(0, 15);
  const prompt = `일본 여행 일정의 장소들이에요. 각 장소의 대략적인 위도·경도를 알려 주세요. 숙소 이름이 지역 이름뿐이면 그 지역 중심 좌표를 주세요. 어디인지 확실하지 않으면 null로 두세요.
${list.map((w, i) => `${i + 1}. ${w.n} (도시: ${w.city || '미정'})`).join('\n')}

JSON 배열로만 답하세요: [{"i":1,"lat":34.6687,"lng":135.5013}]`;
  try {
    const r = await ai.json(prompt, { modelTier: 'default' });
    const arr = Array.isArray(r) ? r : [];
    let n = 0;
    list.forEach((w, i) => {
      const h = arr.find(a => +a.i === i + 1);
      const la = h && +h.lat, ln = h && +h.lng;
      if (la > 20 && la < 46 && ln > 122 && ln < 154) { state.geo[w.k] = [la, ln]; n++; } else if (!state.geoMiss.includes(w.k)) state.geoMiss.push(w.k);
    });
    save(); renderPlan(); if (n) toast(`장소 ${n}곳의 위치를 지도에 올렸어요`);
  } catch (e) { aiFail(e, '위치를 찾지 못했어요'); renderMap(); }
  geocoding = false;
}

/* ================= 시작 ================= */
function renderAll() { syncDays(); renderHero(); renderPlan(); renderBudget(); renderPack(); }
renderTips();
if (firstVisit) loadSample('오사카'); else renderAll();
