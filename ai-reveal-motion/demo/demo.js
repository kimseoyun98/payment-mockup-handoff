/**
 * 데모 전용 코드: 결제창 목업 (HTML로 그린 결제창 + 스켈레톤 + 처음/AI 추천 두 상태)
 * 서비스에 넣을 때 참고할 부분은 맨 아래 '모듈 연결' 블록. 나머지는 목업을 그리기 위한 코드
 * 좌표는 Figma 190×296 프레임 기준 값을 2배(k)로 키워 씀. Reveal 영역은 Figma y 61부터
 */
import { createAIButton, createAIChat, GenerationReveal, createColorDropdown, setM3Theme, bindAIRecommend } from '../src/index.js';

const k = 2, top = 61;
const px = (v) => `${v * k}px`;
const el = (tag, cls, style = {}, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  Object.assign(n.style, style);
  if (text != null) n.textContent = text;
  return n;
};

/* ---------- 결제창 데이터: 처음 화면 / AI 추천 결과 ---------- */
// 로고: [파일 이름, 로고 이미지 원본 크기 w, h] — Figma 로고 칸(상단 80×50, 타일 84×53)을 그대로 뽑은 이미지
const L = {
  paypal: [80, 50], googlepay: [80, 50], applepay: [80, 50],
  wechatpay: [84, 53], alipay: [84, 53], alipayhk: [84, 53],
  kakaopay: [84, 53], tosspay: [84, 53], npay: [84, 53], samsungwallet: [84, 53], ssgpay: [84, 53], lpay: [84, 53],
  'woori-tile': [40.9, 30.2], // 우리카드는 타일 전체 크기로 뽑음 (임시 로고)
};
const CARDS = [[9.7, 65.6, 170.5, 24.4], [9.7, 92.9, 84.3, 24.4], [96, 92.9, 84.3, 24.4]]; // 대표 결제수단 카드 3개
const TILES = [[56.5, 168.5], [99.4, 168.5], [56.5, 220.4], [99.4, 220.4], [142.3, 220.4], [56.5, 254.5], [99.4, 254.5], [142.3, 254.5]];
const HEADS = [154.5, 206.5]; // 지역 제목 y (첫 지역 타일 2칸, 둘째 지역 타일 6칸)

const STATE_BEFORE = {
  cards: ['paypal', 'googlepay', 'applepay'],
  nav: ['글로벌', '중국', '홍콩', '한국', '인도네시아', '말레이시아'],
  heads: ['중국', '한국'],
  tiles: ['wechatpay', 'alipay', 'kakaopay', 'tosspay', 'npay', 'samsungwallet', 'ssgpay', 'lpay'],
};
// AI 추천: 상단 알리페이 / 위챗페이 / 알리페이 홍콩, 나라 싱가포르 > 태국 > 베트남 > 인도네시아 > 말레이시아 > 한국
// 나라별 결제수단 로고가 아직 없어 타일은 우리카드 로고로 임시 표시
const STATE_AI = {
  cards: ['alipay', 'wechatpay', 'alipayhk'],
  nav: ['싱가포르', '태국', '베트남', '인도네시아', '말레이시아', '한국'],
  heads: ['싱가포르', '태국'],
  tiles: Array(8).fill('woori-tile'),
};

/** 로고를 칸 크기에 맞춰 가운데 배치 (칸 좌표는 Reveal 영역 기준) */
const logo = (name, [x, y, w, h], cls = 'logo-img') => {
  const [lw, lh] = L[name];
  const sc = Math.min(w / lw, h / lh);
  const iw = lw * sc, ih = lh * sc;
  const img = el('img', cls, { position: 'absolute', left: px(x + (w - iw) / 2), top: px(y - top + (h - ih) / 2), width: px(iw), height: px(ih) });
  img.src = `./assets/pay/${name}.png`;
  img.alt = '';
  return img;
};
const tileBox = ([x, y]) => [x, y, 40.9, 30.2];
const box = ([x, y, w, h], cls) => el('i', cls, { left: px(x), top: px(y - top), width: px(w), height: px(h) });

/* ---------- 언어: 한국어 / 영어 ----------
   영어 문구는 퍼즐 프로젝트 EN 스토리보드(video-mockup/assets/sb2-en.png, sb-list-en.png) 기준.
   싱가포르·베트남은 스토리보드에 없어 국가 영문명 그대로 씀. AI 채팅 대사는 번역 확정 전이라 한국어 유지 */
let LANG = 'ko';
const EN = {
  '결제 금액': 'Payment Amount', '10,000원': '10,000 won',
  '신용카드': 'Credit Card', '간편결제': 'Easy Payment', '계좌이체': 'Bank Transfer',
  '글로벌': 'Global', '중국': 'China', '홍콩': 'Hong Kong', '한국': 'South Korea', '인도네시아': 'Indonesia', '말레이시아': 'Malaysia',
  '태국': 'Thailand', '싱가포르': 'Singapore', '베트남': 'Vietnam',
};
const tr = (ko) => (LANG === 'en' ? EN[ko] ?? ko : ko);
/** 결제창 글자를 한국어/영어로 바꿈 (지금 보이는 결제수단 상태 그대로) */
function setLang(lang) {
  LANG = lang === 'en' ? 'en' : 'ko';
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-ko]').forEach((n) => { n.textContent = tr(n.dataset.ko); });
  render(current);
}
// HTML에 직접 적힌 글자(헤더 결제 금액, 스켈레톤 탭)는 원문을 data-ko로 기억해 두고 바꿈
document.querySelectorAll('.head .amt span, .sk-tabs span').forEach((n) => { n.dataset.ko = n.textContent; });

/* ---------- 선명 레이어: 결제창 그리기 ---------- */
const screen = document.querySelector('.pw');
let current = STATE_BEFORE;
function render(state) {
  current = state;
  const tabs = el('div', 'tabs');
  tabs.append(el('span', '', { left: '47px' }, tr('신용카드')), el('span', 'on', { left: '164px' }, tr('간편결제')), el('span', '', { left: '281px' }, tr('계좌이체')), el('b'));
  const nav = el('div', 'nav');
  nav.append(...state.nav.map((t, i) => el('span', i === 0 ? 'on' : '', {}, tr(t))));
  screen.replaceChildren(
    el('div', 'gs'),
    ...CARDS.map((c) => box(c, 'card')),
    tabs,
    nav,
    el('div', 'list'),
    ...state.heads.map((t, i) => el('h4', '', { left: px(56.5), top: px(HEADS[i] - top) }, tr(t))),
    ...TILES.map((t) => box(tileBox(t), 'tile')), // 진한 테두리는 누르고 있을 때만 (demo.css .tile:active)
    ...state.cards.map((n, i) => logo(n, CARDS[i])),
    ...state.tiles.map((n, i) => logo(n, tileBox(TILES[i]))),
  );
}
render(STATE_BEFORE);

/* ---------- 스켈레톤: 구조는 반투명으로, 이전 글자·로고는 연하게 ---------- */
const skel = document.getElementById('skel');
const CARD = { background: 'rgba(255,255,255,.5)' };
const skBox = ([x, y, w, h], r, style) => el('i', '', { left: px(x), top: px(y - top), width: px(w), height: px(h), borderRadius: px(r), ...style });
skel.append(
  skBox([0, 61, 190, 61.1], 0, { background: 'rgba(0,0,0,.04)' }), // 대표 결제수단 영역
  ...CARDS.map((c) => skBox(c, 3.9, CARD)),
  skBox([0, 147.7, 49.7, 154], 0, { background: 'rgba(0,0,0,.02)' }), // 나라 탭 열
  ...TILES.map((t) => skBox(tileBox(t), 3.9, CARD)),
);
/** 스켈레톤에 바뀌기 전 상태(나라 글자·지역 제목·로고)를 연하게 깔아 둠 */
function setSkeletonFrom(state) {
  skel.querySelectorAll('.sk-prev').forEach((n) => n.remove());
  skel.append(
    ...state.nav.map((t, i) => el('span', 'sk-txt sk-prev', { left: 0, top: px(147.7 + 25.6 * i + 6.4 - top), width: px(49.7), textAlign: 'center' }, tr(t))),
    ...state.heads.map((t, i) => el('span', 'sk-txt h sk-prev', { left: px(56.5), top: px(HEADS[i] - top) }, tr(t))),
    ...state.cards.map((n, i) => logo(n, CARDS[i], 'sk-logo sk-prev')),
    ...state.tiles.map((n, i) => logo(n, tileBox(TILES[i]), 'sk-logo sk-prev')),
  );
}

/* ---------- 모듈 연결 (서비스에서도 이 형태로 연결) ---------- */
const phone = document.querySelector('.phone');
const AI_THEME = 'Rose'; // AI 추천 결과에 적용할 테마 (m3-theme.css 테마 이름)

// 1) 컬러 드롭다운: 칩을 고르면 결제창 전체 테마 변경
createColorDropdown(phone, { onSelect: (theme) => setM3Theme(phone, theme) });

// 2) Reveal: #region(.rv-root) 안 레이어 구조는 index.html 참고
const reveal = new GenerationReveal(document.getElementById('region'));
const revealLayers = [...document.querySelectorAll('#region .rv-sharp, #region .rv-blur')];
const headerParts = [...document.querySelectorAll('.phone .head, .phone .globe, .phone .cp')]; // Reveal 영역 밖에서 색이 바뀌는 부분

// 3) AI 추천 버튼 + 채팅창 + 연결
const recommend = bindAIRecommend(createAIButton(phone), reveal, {
  // 채팅창: 창 안 터치 → 글이 나오는 중이면 바로 완성, 다 나온 뒤면 다음으로 / X·창 바깥 터치 → 닫기
  chat: createAIChat(phone, { tapToAdvance: true }),
  prompt: '우리회사 코어 타겟군과 실제 결제 수단 선택률에 맞게 결제창 세팅해줘',
  steps: [
    { loading: '고객 데이터 분석 중…', done: '중화권 고객 비중 70% 이상' },
    { loading: '결제 수단 선택률 확인 중…', done: '선택률 확인 완료' },
  ],
  once: true, // 한 번 적용되면 AI 추천 버튼이 사라짐
  // 내용 교체: 스켈레톤엔 이전 상태를 연하게, 선명 레이어는 AI 추천 결과로 + 새 내용에만 Rose 테마
  //   → 글로우가 쓸고 지나간 자리부터 Rose 색으로 드러남
  onBeforeReveal: () => {
    setSkeletonFrom(current);
    render(STATE_AI);
    revealLayers.forEach((el) => setM3Theme(el, AI_THEME));
  },
  // 글로우가 쓸기 시작하는 순간: Reveal 영역 밖인 헤더도 Rose로 (0.45s 전환) + 로고 교체 (PAYVERSE → MEIMEI)
  onSweepStart: () => {
    headerParts.forEach((el) => setM3Theme(el, AI_THEME));
    phone.classList.add('is-ai');
  },
  // 끝: 테마를 결제창 전체로 옮기고 부분별 표시는 정리 (같은 색이라 화면 변화 없음)
  onAfterReveal: () => {
    setM3Theme(phone, AI_THEME);
    clearPartThemes();
  },
});
function clearPartThemes() {
  [...revealLayers, ...headerParts].forEach((el) => setM3Theme(el, null));
}

/* ---------- 데모 전용: 처음 화면으로 ---------- */
document.getElementById('reset').addEventListener('click', () => {
  recommend.reset(); // 채팅창 닫기 + Reveal 중단 + AI 추천 버튼 다시 보이기
  render(STATE_BEFORE);
  setM3Theme(phone, null);
  clearPartThemes();
  phone.classList.remove('is-ai');
});

/* ---------- 부스 화면(booth-motion) 8번 안에 끼워 넣을 때 (?embed) ----------
   결제창만 창 폭에 맞춰 꽉 차게. 부스가 보내는 메시지: {type:'ai-demo:reset'} 처음 화면으로 · {type:'ai-demo:lang', lang:'ko'|'en'} 언어 전환 */
if (new URLSearchParams(location.search).has('embed')) {
  document.documentElement.classList.add('embed');
  const fitEmbed = () => document.documentElement.style.setProperty('--embed-k', innerWidth / 380);
  fitEmbed();
  addEventListener('resize', fitEmbed);
  addEventListener('message', (e) => {
    if (e.data?.type === 'ai-demo:reset') document.getElementById('reset').click();
    if (e.data?.type === 'ai-demo:lang') setLang(e.data.lang);
  });
}
