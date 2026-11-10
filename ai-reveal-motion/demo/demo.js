/**
 * 데모 전용 코드: 결제창 목업 화면 구성 (Figma 화면 이미지 + 좌표로 그린 스켈레톤·로고·AI 추천 결과 화면)
 * 서비스에 넣을 때 참고할 부분은 맨 아래 '모듈 연결' 블록뿐. 나머지는 목업을 그리기 위한 코드
 * 좌표는 Figma 190×296 프레임 기준 값을 2배(k)로 키워 씀
 */
import { AIButton } from '../src/ai-button.js';
import { GenerationReveal } from '../src/generation-reveal.js';
import { ColorDropdown } from '../src/color-dropdown.js';
import { bindAIRecommend } from '../src/ai-recommend.js';

// 컬러칩: Figma colorPicker-dropdown 순서 (위→아래), 그라데이션 3색 (0% / 45% / 100%, 왼→오)
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
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'cp-chip';
  b.dataset.color = name;
  b.setAttribute('aria-label', name);
  b.style.cssText = `--c0:${c0};--c1:${c1};--c2:${c2}`;
  return b;
}));
const dropdown = new ColorDropdown(document.getElementById('cp'), document.getElementById('cp-panel'));
document.querySelector('.phone').addEventListener('click', () => dropdown.close()); // 바깥 터치 시 닫힘

// 스켈레톤 = 실제 화면 구조(배경·카드·타일)만 남기고 칸 안의 내용(로고·글자)은 비움
// 좌표: Figma 190 프레임 기준 [x, y, w, h, radius] → 2배, Reveal 영역 상단(y 61) 기준
const CARD = { background: 'rgba(255,255,255,.5)' }; // 은은한 반투명 흰색, 테두리 없음 → 뒤 배경 빛이 박스 안까지 비침
const STRUCT = [
  // 대표 결제수단 영역 회색 배경
  [[0, 61, 190, 61.1, 0], { background: 'rgba(0,0,0,.04)' }], // #F5F5F5와 같은 밝기, 뒤 빛이 비치도록 반투명
  // 대표 결제수단 카드 3개
  [[9.7, 65.6, 170.5, 24.4, 3.9], CARD], [[9.7, 92.9, 84.3, 24.4, 3.9], CARD], [[96, 92.9, 84.3, 24.4, 3.9], CARD],
  // 나라 탭 열 배경 (#FAFAFA). 선택 표시(흰 배경·파란 밑줄)는 바뀌는 내용이라 뺌
  [[0, 147.7, 49.7, 154, 0], { background: 'rgba(0,0,0,.02)' }], // #FAFAFA와 같은 밝기, 반투명
  // 결제수단 타일 8개
  ...[[56.5, 168.5], [99.4, 168.5], [56.5, 220.4], [99.4, 220.4], [142.3, 220.4], [56.5, 254.5], [99.4, 254.5], [142.3, 254.5]]
    .map(([x, y]) => [[x, y, 40.9, 30.2, 3.9], CARD]),
];
const k = 2, top = 61;
const rect = ([x, y, w, h, r], cls, style) => {
  const i = document.createElement('i');
  if (cls) i.className = cls;
  Object.assign(i.style, { left: x * k + 'px', top: (y - top) * k + 'px', width: w * k + 'px', height: h * k + 'px', borderRadius: r * k + 'px', ...style });
  return i;
};
document.getElementById('skel').append(...STRUCT.map(([g, s]) => rect(g, null, s)));
// 기존 나라 글자는 스켈레톤에서 연하게 남김 (탭과 같은 방식). 왼쪽 나라 탭: 행 높이 25.6, 열 폭 49.7 가운데 정렬
const skTxt = (text, x, y, cls = '') => {
  const s = document.createElement('span');
  s.className = 'sk-txt ' + cls;
  s.textContent = text;
  Object.assign(s.style, { left: x * k + 'px', top: (y - top) * k + 'px' });
  return s;
};
const navOld = ['글로벌', '중국', '홍콩', '한국', '인도네시아', '말레이시아'];
document.getElementById('skel').append(
  ...navOld.map((t, i) => { const s = skTxt(t, 0, 147.7 + 25.6 * i + 6.4); s.style.width = 49.7 * k + 'px'; s.style.textAlign = 'center'; return s; }),
  skTxt('중국', 56.5, 154.5, 'h'), skTxt('한국', 56.5, 206.5, 'h'),
);

// 결제수단 로고: 로고 이미지는 Figma 로고 래퍼(상단 80×50, 타일 84×53)를 그대로 뽑은 것 → 칸 크기에 맞춰 축소, 가운데 정렬
// [이름, x, y, 칸 w, 칸 h, 로고 이미지 w, h]
// 처음 화면 (기존 시안 Figma 프레임 "2" 기준)
const PAY = [
  // 대표 결제수단 카드 3개: 카드 높이(24.4)에 맞춤
  // 로고 이미지(흰 여백 포함 전체)가 칸 높이에 꽉 차게. 필요하면 마지막에 실제 로고 영역 [x, y, w, h]를 넣어 그 영역만 꽉 채울 수도 있음
  ['paypal', 9.7, 65.6, 170.5, 24.4, 80, 50], ['googlepay', 9.7, 92.9, 84.3, 24.4, 80, 50], ['applepay', 96, 92.9, 84.3, 24.4, 80, 50],
  // 중국
  ['wechatpay', 56.5, 168.5, 40.9, 30.2, 84, 53], ['alipay', 99.4, 168.5, 40.9, 30.2, 84, 53],
  // 한국
  ['kakaopay', 56.5, 220.4, 40.9, 30.2, 84, 53], ['tosspay', 99.4, 220.4, 40.9, 30.2, 84, 53], ['npay', 142.3, 220.4, 40.9, 30.2, 84, 53],
  ['samsungwallet', 56.5, 254.5, 40.9, 30.2, 84, 53], ['ssgpay', 99.4, 254.5, 40.9, 30.2, 84, 53], ['lpay', 142.3, 254.5, 40.9, 30.2, 84, 53],
];
// AI 추천 결과 화면
// 상단: 알리페이 / 위챗페이 / 알리페이 홍콩
// 나라 탭: 싱가포르 > 태국 > 베트남 > 인도네시아 > 말레이시아 > 한국 (그 아래는 순서 무관, 화면 밖)
// 나라별 결제수단 로고가 아직 없어 타일은 전부 우리카드 로고로 임시 표시
const TILE = [40.9, 30.2, 40.9, 30.2]; // 우리카드 이미지는 타일 전체 크기로 뽑음
const PAY_AI = [
  ['alipay', 9.7, 65.6, 170.5, 24.4, 84, 53], ['wechatpay', 9.7, 92.9, 84.3, 24.4, 84, 53], ['alipayhk', 96, 92.9, 84.3, 24.4, 84, 53],
  ...[[56.5, 168.5], [99.4, 168.5], [56.5, 220.4], [99.4, 220.4], [142.3, 220.4], [56.5, 254.5], [99.4, 254.5], [142.3, 254.5]]
    .map(([x, y]) => ['woori-tile', x, y, ...TILE]),
];
const NAV_AI = ['싱가포르', '태국', '베트남', '인도네시아', '말레이시아', '한국'];
const SECTIONS_AI = [['싱가포르', 154.5], ['태국', 206.5]];

const shot = document.querySelector('.shot');
let current = PAY; // 지금 화면에 보이는 로고 목록
const logo = ([name, x, y, w, h, lw, lh, box]) => {
  const img = document.createElement('img');
  img.src = `./assets/pay/${name}.png`;
  img.alt = '';
  if (box) {
    // 상단 대표 결제수단: 실제 로고 영역만 잘라 칸 높이에 꽉 차게 (폭이 넘치면 폭에 맞춤)
    const [bx, by, bw, bh] = box;
    const sc = Math.min(w / bw, h / bh);
    const cw = bw * sc, ch = bh * sc;
    const clip = document.createElement('span');
    clip.className = 'pay-logo dyn';
    Object.assign(clip.style, { overflow: 'hidden', left: (x + (w - cw) / 2) * k + 'px', top: (y - top + (h - ch) / 2) * k + 'px', width: cw * k + 'px', height: ch * k + 'px' });
    Object.assign(img.style, { position: 'absolute', left: -bx * sc * k + 'px', top: -by * sc * k + 'px', width: lw * sc * k + 'px', height: lh * sc * k + 'px' });
    clip.append(img);
    return clip;
  }
  const sc = Math.min(w / lw, h / lh); // 칸 안에 들어가는 최대 배율
  const iw = lw * sc, ih = lh * sc;
  img.className = 'pay-logo dyn';
  Object.assign(img.style, { left: (x + (w - iw) / 2) * k + 'px', top: (y - top + (h - ih) / 2) * k + 'px', width: iw * k + 'px', height: ih * k + 'px' });
  return img;
};
/** 선명 레이어 내용을 처음 화면 / AI 추천 화면으로 바꿈 */
function renderState(ai) {
  shot.querySelectorAll('.dyn').forEach((n) => n.remove());
  current = ai ? PAY_AI : PAY;
  if (ai) {
    // 나라 탭 + 결제수단 영역을 새로 그림 (Figma y 147.7 기준 → .ai-after 안 좌표)
    const after = document.createElement('div');
    after.className = 'ai-after dyn';
    const nav = document.createElement('div');
    nav.className = 'nav';
    nav.append(...NAV_AI.map((t, i) => { const s = document.createElement('span'); s.textContent = t; if (i === 0) s.className = 'on'; return s; }));
    after.append(nav, ...SECTIONS_AI.map(([t, y]) => {
      const h = document.createElement('h4');
      h.textContent = t;
      Object.assign(h.style, { left: 56.5 * k + 'px', top: (y - 147.7) * k + 'px' });
      return h;
    }), ...PAY_AI.slice(3).map(([, x, y]) => {
      const d = document.createElement('i');
      d.className = 'tile';
      Object.assign(d.style, { left: x * k + 'px', top: (y - 147.7) * k + 'px' });
      return d;
    }));
    shot.append(after, ...PAY_AI.map(logo));
  } else {
    const cover = document.createElement('i');
    cover.className = 'nav-line-cover dyn';
    shot.append(cover, ...PAY.map(logo));
  }
}
renderState(false);

/** 스켈레톤에 바뀌기 전 로고를 연하게 깔아 둠 (생성 글로우가 지나가면 새 로고로 바뀜) */
const skel = document.getElementById('skel');
function setSkeletonLogos(list) {
  skel.querySelectorAll('.sk-logo').forEach((n) => n.remove());
  skel.append(...list.map((d) => { const img = logo(d); img.className = 'sk-logo'; return img; }));
}

/* ---------- 모듈 연결 (서비스에서도 이 형태로 연결) ---------- */
const reveal = new GenerationReveal(document.getElementById('region'));
const button = new AIButton(document.getElementById('ai'));
bindAIRecommend(button, reveal, { onBeforeReveal: () => { setSkeletonLogos(current); renderState(true); } }); // 스켈레톤엔 이전 로고를 연하게, 선명 레이어는 AI 추천 화면으로 교체
document.getElementById('reset').addEventListener('click', () => { reveal.stop(); renderState(false); });
