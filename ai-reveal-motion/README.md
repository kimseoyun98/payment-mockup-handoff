# AI 추천 결제창 모션 핸드오프

결제창의 **[AI 추천] 버튼 → AI Generating Reveal** 인터랙션, **결제창 컬러 변경 드롭다운** 모션, 드롭다운에 따라 바뀌는 **M3 색상 테마 토큰**입니다.
영상용 목업이 아니라, 기존 서비스 코드에 옮겨 넣기 위한 참고 구현입니다. 프레임워크 없이 순수 JS(Web Animations API + Canvas)로 작성했습니다.

- 데모: `demo/index.html`을 로컬 서버로 열기 (예: 이 폴더에서 `python -m http.server 8770` → http://localhost:8770/demo/)
- 서비스에 옮길 코드: `src/` 폴더만. `demo/`는 목업 화면을 그리기 위한 코드라 옮길 필요 없음

## 폴더 구성

| 파일 | 역할 |
|---|---|
| `src/motion-tokens.js` | 공통 이징 값 |
| `src/m3-theme.css` / `.json` | Figma M3 색상 토큰 (라이트 모드, 8개 테마 × 12개 역할). 컬러 드롭다운 테마 전환에 사용 |
| `src/ai-button.js` / `.css` | AI 추천 버튼: 눌림 → 동그란 별 버튼으로 줄어듦(로딩) → 원래 버튼으로 복귀 |
| `src/generation-reveal.js` / `.css` | AI Generating Reveal: 스켈레톤 + 뒤 배경 빛 → 글로우가 위에서 아래로 쓸며 블러→선명으로 새 내용 등장 |
| `src/color-dropdown.js` / `.css` | 결제창 컬러 변경 드롭다운: 팔레트 버튼 → 알약이 늘어나며 컬러칩 7개 등장 |
| `src/ai-recommend.js` | 버튼과 Reveal을 순서대로 연결 |
| `demo/` | 결제창 목업 데모 (Figma 화면 이미지 + 좌표로 그린 스켈레톤·로고·AI 추천 결과 화면) |

## 전체 타임라인 ([AI 추천] 터치 기준)

| 시점 | 버튼 | 결제창 영역 |
|---|---|---|
| 0ms | 0.93배로 눌림 | |
| 130ms | 글자 사라짐(120ms) → 동그라미로 줄어듦(380ms) | `onBeforeReveal`에서 내용을 AI 추천 결과로 교체 → 스켈레톤 + 뒤 배경 빛 시작 |
| ~1.1s | 별 숨쉬기(1s 주기) + 흐릿한 빛(2.4s 주기) 반복 | 대기 마지막 300ms 동안 상단 글로우 켜짐 |
| ~1.1s ~ 5.1s | 〃 | 글로우가 위→아래로 쓸고 내려감, 지나간 자리는 블러 → 선명 |
| ~5.6s | 원래 버튼으로 늘어남(420ms) + 글자 등장 | 글로우 사라짐(500ms) |

시간 값은 모두 각 파일 상단의 옵션/주석에 있고, Reveal은 `REVEAL_DEFAULTS`로 한곳에서 조절합니다.

## 연결 방법

```js
import { AIButton } from './src/ai-button.js';
import { GenerationReveal } from './src/generation-reveal.js';
import { ColorDropdown } from './src/color-dropdown.js';
import { bindAIRecommend } from './src/ai-recommend.js';

const reveal = new GenerationReveal(document.querySelector('.rv-root'));      // 옵션: { duration: 3000, ... }
const button = new AIButton(document.querySelector('.ai-btn'));

bindAIRecommend(button, reveal, {
  // 버튼이 줄어든 직후, Reveal 재생 직전에 호출됨 (async 가능)
  // 여기서 .rv-sharp 안의 결제창 내용을 AI 추천 결과로 바꾸면, Reveal이 새 내용을 드러냄
  onBeforeReveal: async () => { /* 추천 결과 반영 */ },
});

new ColorDropdown(document.querySelector('.cp-trigger'), document.querySelector('.cp-panel'), {
  onSelect: (color) => { /* 'Baseline' | 'Green' | ... 결제창 테마 적용 */ },
});
```

React 등에서 쓸 때는 각 클래스를 `useEffect`에서 DOM ref로 생성하고, `onBeforeReveal`에서 상태를 갱신한 뒤 다음 렌더가 끝날 때까지 기다렸다가 resolve하면 됩니다. (Reveal은 `play()` 시점의 `.rv-sharp` 내용을 복제해 블러 레이어로 씁니다.)

## 필요한 마크업

### AI 추천 버튼
```html
<button class="ai-btn" type="button">
  <span class="ai-icon-wrap">
    <svg class="ai-icon" viewBox="0 0 8 8"> <path class="ai-star-s" .../> <path class="ai-star-l" .../> </svg>
  </span>
  <span class="ai-sheen" aria-hidden="true"></span>
  <span class="ai-labels"><span class="ai-label">AI 추천</span></span>
</button>
```
- 별 svg 경로는 `demo/index.html`에 있음 (Figma `Icon/Sparkle2`)
- 동그라미로 줄어드는 방향은 버튼의 CSS 위치 기준을 따름. 데모는 `right`로 붙여서 오른쪽으로 모임

### Generating Reveal
```html
<div class="rv-root">
  <div class="rv-skel">
    <canvas class="rv-ambient"></canvas>   <!-- 반드시 첫 자식: 스켈레톤 뒤 배경 빛 -->
    <!-- 스켈레톤 도형 (position: absolute 로 배치) -->
  </div>
  <div class="rv-sharp"><!-- 실제 결제창 내용 --></div>
  <div class="rv-blur"></div>               <!-- 비워 둠 -->
  <canvas class="rv-canvas"></canvas>
</div>
```
- `.rv-root`의 `--rv-bg`를 콘텐츠 배경색과 맞출 것 (기본 흰색)
- AI가 바꾸지 않는 부분을 스켈레톤·블러에서 빼고 싶으면 `.rv-keep` 요소를 `.rv-blur`와 `.rv-canvas` 사이에 둠 (이번 데모에서는 쓰지 않음)

### 스켈레톤 작성 규칙 (이번 결제창에서 확정한 톤)
- 배경·카드·타일 같은 **구조는 실제 화면과 같은 밝기의 반투명**으로 → 뒤 배경 빛이 비침
  - `#F5F5F5` 배경 → `rgba(0,0,0,.04)`, `#FAFAFA` → `rgba(0,0,0,.02)`, 흰 카드 → `rgba(255,255,255,.5)` (테두리 없음)
- 글자는 지우지 않고 **연하게**: `rgba(33,33,33,.16)`, 선택 강조 없이 모두 같은 색
- 선택 밑줄처럼 꽉 찬 선은 같은 색이면 더 진해 보여서 한 단계 연하게: `rgba(33,33,33,.1)`
- 구분선(stroke)은 뺌
- **바뀌기 전 로고**는 흑백 + 투명도 `.22`로 남김 → 글로우가 지나가면 새 로고로 바뀜
- 데모의 구현: `demo/demo.js`의 `STRUCT`, `skTxt`, `setSkeletonLogos`, `demo/demo.css`의 `.sk-*`

### 컬러 변경 드롭다운
```html
<div class="cp">
  <button class="cp-trigger" type="button" aria-label="결제창 컬러 변경"> 팔레트 svg </button>
  <div class="cp-panel" hidden>
    <button class="cp-default" type="button" aria-label="닫기"> 팔레트 svg </button>
    <button class="cp-chip" data-color="Baseline" style="--c0:#efe4ff;--c1:#d0bcff;--c2:#7049d9"></button>
    <!-- Green, Monochrome, Pink, Mint, Orange, Blue: 색 값은 color-dropdown.css 주석 참고 -->
  </div>
</div>
```
- 펼친 알약이 팔레트 버튼을 덮으므로, 맨 위 `.cp-default`가 닫기 역할
- 바깥 터치로 닫으려면 바깥 클릭에서 `dropdown.close()` 호출

## 컬러 드롭다운 → 결제창 테마 전환 (M3 토큰)

Figma 변수 컬렉션 **M3 · Palette**(테마별 실제 색)와 **M3 · Theme**(역할별 색)를 `src/m3-theme.css`로 옮겼습니다. **라이트 모드만** 넣었습니다.

- 결제창 루트에 `data-m3-theme="Pink"`처럼 테마 이름을 붙이면 `--md-sys-color-*` 변수가 바뀜
- 테마 이름 = 컬러 드롭다운 칩의 `data-color` 값: `Baseline` `Green` `Monochrome` `Pink` `Mint` `Orange` `Blue` (+ `Rose`: AI 추천 프리셋용, 칩 없음)
- 테마를 안 고르면 토큰 파일은 아무 값도 정하지 않음 → **기존 서비스 코드의 색이 그대로** 나옴
- 기존 코드의 색 지정을 `var(--md-sys-color-<역할>, <기존 색>)`으로 바꾸면 됨. 역할은 아래 표대로
  ```css
  /* 기존 */ .amount { color: #3c62dd; }
  /* 변경 */ .amount { color: var(--md-sys-color-primary, #3c62dd); }
  ```
- CSS가 아닌 환경(React Native·Flutter 등)은 `src/m3-theme.json` 사용 (테마 미선택이면 기존 색 유지)

```js
new ColorDropdown(trigger, panel, {
  onSelect: (theme) => { paymentRoot.dataset.m3Theme = theme; },
});
```

### 결제창 요소 ↔ 토큰 (Figma '커스터마이징 적용' 라이트 보드에서 컴포넌트에 연결된 값)

| 요소 | 속성 | 토큰 (CSS 변수) |
|---|---|---|
| 결제창 전체 바탕 (칠 없는 영역에 비침) | 배경 | Background (`--md-sys-color-background`) |
| 헤더 배경, 결제수단 목록 영역 배경 | 배경 | Surface (`--md-sys-color-surface`) |
| "결제 금액", 지역 제목(중국·한국), 상태바 | 글자 | On Surface (`--md-sys-color-on-surface`) |
| 금액 "10,000원" | 글자 | Primary (`--md-sys-color-primary`) |
| 대표 결제수단 영역 | 배경 | Surface Container (`--md-sys-color-surface-container`) |
| 대표 결제수단 카드, 결제수단 타일 | 배경 | Surface Container Lowest (`--md-sys-color-surface-container-lowest`) |
| 〃 | 테두리 | Outline Variant (`--md-sys-color-outline-variant`) |
| 결제방식 탭 줄 | 배경 | Background (`--md-sys-color-background`) — 탭 줄 자체엔 칠이 없고, 바깥 결제창 프레임의 Background가 비침 |
| 결제방식 탭 줄 | 아래 선 | Outline Variant |
| 결제방식 탭 (선택 안 됨) | 글자 | On Surface Variant (`--md-sys-color-on-surface-variant`) |
| 결제방식 탭 (선택됨) | 글자 | On Primary Container (`--md-sys-color-on-primary-container`) |
| 결제방식 탭 (선택됨) | 밑줄 | Primary |
| 나라 탭 행 (선택 안 됨) | 배경 / 글자 | Surface Container Low / On Surface Variant |
| 나라 탭 행 (선택됨) | 배경 / 글자 | Primary Container / On Primary Container |
| 하단 [결제하기] 버튼 | 배경 / 글자 | Primary / On Primary |

- 위 표는 Figma 레이어에 연결된 토큰을 그대로 옮긴 것. 칠이 없는 레이어(결제방식 탭 줄, 나라 탭 열 컨테이너 등)는 칠하지 않고 바탕 Background가 비치게 둠
- AI 추천 버튼, 컬러칩, 로고, Reveal 글로우 색은 테마와 무관하게 고정
- 데모 적용 예: `demo/demo.css` (모든 결제창 색이 `var(--역할, 기존 색)` 형태. 데모의 기존 색 = 원래 Figma 결제창 화면 색)

## 접근성
- `prefers-reduced-motion: reduce`이면 Reveal은 애니메이션 없이 바로 최종 화면으로 바뀜

## 데모에서만 임시로 한 것 (서비스에서는 실제 데이터로)
- AI 추천 결과: 상단 알리페이 / 위챗페이 / 알리페이 홍콩, 나라 탭 싱가포르 > 태국 > 베트남 > 인도네시아 > 말레이시아 > 한국
- 나라별 결제수단 로고가 없어 타일은 모두 우리카드 로고로 표시
- AI 추천 결과에 Rose 테마는 적용하지 않음 (모션 확인용)
- 결제창은 Figma 좌표대로 HTML로 그린 목업이라 크기가 고정 (380×592). 로고만 이미지
