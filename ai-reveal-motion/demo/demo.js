/**
 * 데모 전용 코드: 결제창 목업 (HTML로 그린 결제창 + 스켈레톤 + 처음/AI 추천 두 상태)
 * 서비스에 넣을 때 참고할 부분은 맨 아래 '모듈 연결' 블록. 나머지는 목업을 그리기 위한 코드
 * 좌표는 Figma 190×296 프레임 기준 값을 2배(k)로 키워 씀. Reveal 영역은 Figma y 61부터
 */
import { AIButton } from '../src/ai-button.js';
import { GenerationReveal } from '../src/generation-reveal.js';
import { ColorDropdown } from '../src/color-dropdown.js';
import { bindAIRecommend } from '../src/ai-recommend.js';

const k = 2, top = 61;
const px = (v) => `${v * k}px`;
const el = (tag, cls, style = {}, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  Object.assign(n.style, style);
  if (text != null) n.textContent = text;
  return n;
};

/* ---------- 컬러칩 (Figma colorPicker-dropdown 순서, 그라데이션 0% / 45% / 100%) ---------- */
const CHIPS = [
  ['Baseline', '#efe4ff', '#d0bcff', '#7049d9'],
  ['Green', '#e0f0e2', '#a5d7ad', '#2fb081'],
  ['Monochrome', '#fafafa', '#ffffff', '#000000'],
  ['Pink', '#ffdceb', '#feb0d1', '#df267b'],
  ['Mint', '#e4f5f0', '#9ae4d4', '#0093a0'],
  ['Orange', '#ffeee2', '#ffb68c', '#ff893a'],
  ['Blue', '#ebf0f7', '#a9ceff', '#2b5893'],
];
document.getElementById('cp-panel').append(...CHIPS.map(([name, c0, c1, c2]) => {
  const b = el('button', 'cp-chip');
  b.type = 'button';
  b.dataset.color = name; // = src/m3-theme.css 의 테마 이름
  b.setAttribute('aria-label', name);
  b.style.cssText = `--c0:${c0};--c1:${c1};--c2:${c2}`;
  return b;
}));

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

/* ---------- 선명 레이어: 결제창 그리기 ---------- */
const screen = document.querySelector('.pw');
let current = STATE_BEFORE;
function render(state) {
  current = state;
  const tabs = el('div', 'tabs');
  tabs.append(el('span', '', { left: '47px' }, '신용카드'), el('span', 'on', { left: '164px' }, '간편결제'), el('span', '', { left: '281px' }, '계좌이체'), el('b'));
  const nav = el('div', 'nav');
  nav.append(...state.nav.map((t, i) => el('span', i === 0 ? 'on' : '', {}, t)));
  screen.replaceChildren(
    el('div', 'gs'),
    ...CARDS.map((c) => box(c, 'card')),
    tabs,
    nav,
    el('div', 'list'),
    ...state.heads.map((t, i) => el('h4', '', { left: px(56.5), top: px(HEADS[i] - top) }, t)),
    ...TILES.map((t) => box(tileBox(t), 'tile')),
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
    ...state.nav.map((t, i) => el('span', 'sk-txt sk-prev', { left: 0, top: px(147.7 + 25.6 * i + 6.4 - top), width: px(49.7), textAlign: 'center' }, t)),
    ...state.heads.map((t, i) => el('span', 'sk-txt h sk-prev', { left: px(56.5), top: px(HEADS[i] - top) }, t)),
    ...state.cards.map((n, i) => logo(n, CARDS[i], 'sk-logo sk-prev')),
    ...state.tiles.map((n, i) => logo(n, tileBox(TILES[i]), 'sk-logo sk-prev')),
  );
}

/* ---------- 모듈 연결 (서비스에서도 이 형태로 연결) ---------- */
const phone = document.querySelector('.phone');
const reveal = new GenerationReveal(document.getElementById('region'));
const button = new AIButton(document.getElementById('ai'));
bindAIRecommend(button, reveal, {
  // 스켈레톤엔 이전 상태를 연하게, 선명 레이어는 AI 추천 결과로 교체 (Rose 테마는 이번 데모에서 적용하지 않음)
  onBeforeReveal: () => { setSkeletonFrom(current); render(STATE_AI); },
});
const dropdown = new ColorDropdown(document.getElementById('cp'), document.getElementById('cp-panel'), {
  onSelect: (theme) => { phone.dataset.m3Theme = theme; }, // 칩 이름 = m3-theme.css 테마 이름
});
phone.addEventListener('click', () => dropdown.close()); // 바깥 터치 시 닫힘
document.getElementById('reset').addEventListener('click', () => {
  reveal.stop();
  render(STATE_BEFORE);
  delete phone.dataset.m3Theme;
});
