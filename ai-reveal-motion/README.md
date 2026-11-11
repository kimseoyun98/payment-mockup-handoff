# AI 추천 결제창 모션 핸드오프

결제창에 붙일 **모션 모듈 5개 + 색상 토큰**입니다. 결제창 화면 자체는 이미 서비스 코드에 있으므로, 여기서 가져갈 것은 `src/` 폴더뿐입니다.

| 모듈 | 하는 일 |
|---|---|
| AI 추천 버튼 | 눌림 → 동그란 별 버튼으로 줄어듦(로딩) → 적용되면 사라짐 |
| AI 채팅 모달 | 요청 자동 타이핑 → 보내기 → 생각 중 → 결과 글이 써짐. 터치로 넘기기, X·바깥 터치로 닫기 |
| Generating Reveal | 스켈레톤 + 뒤 배경 빛 → 글로우가 위에서 아래로 쓸며 블러 → 선명으로 새 내용 등장 |
| 컬러 드롭다운 | 팔레트 버튼 → 알약이 늘어나며 컬러칩 7개 등장 → 고른 테마로 결제창 색 변경 |
| M3 색상 토큰 | Figma 변수(M3 · Palette / M3 · Theme)를 CSS 변수로. 라이트 모드, 테마 8개 |
| 연결 (`bindAIRecommend`) | 버튼 → 채팅 모달 → Reveal 순서 연결 + 서비스가 끼어드는 훅 3개 |

- **프레임워크 없이** 순수 JS(Web Animations API + Canvas) + CSS. Electron(Chromium)에서 그대로 동작합니다.
- **AI에게 붙이는 작업을 맡길 때**는 [`AI_HANDOFF.md`](AI_HANDOFF.md)를 같이 넘기면 됩니다.
- **데모:** 이 폴더에서 `python -m http.server 8770` → http://localhost:8770/demo/ . `demo/`는 가짜 결제창이라 서비스에 넣지 않습니다.

## 폴더 구성

```
src/
  index.js / index.css        ← 이 두 개만 불러오면 전부 쓸 수 있음
  ai-button.js / .css         AI 추천 버튼 (createAIButton)
  ai-chat.js / .css           AI 채팅 모달 (createAIChat)
  ai-star.js                  AI 별 아이콘 (버튼·채팅 '생각 중' 공용)
  generation-reveal.js / .css Generating Reveal (GenerationReveal)
  color-dropdown.js / .css    컬러 드롭다운 (createColorDropdown)
  m3-theme.css / .js / .json  M3 색상 토큰 (자동 생성 파일, 직접 고치지 않음)
  ai-recommend.js             연결 (bindAIRecommend)
  motion-tokens.js            공통 이징 값
tools/
  figma-palette-light.json    Figma M3 · Palette 라이트 값 (토큰 원본)
  gen-m3-theme.py             원본 → m3-theme.css/js/json 만들기
demo/                         가짜 결제창 데모 (서비스에 넣지 않음, 연결 예시로만 참고)
```

## 붙이는 방법

```js
import {
  createAIButton, createAIChat, GenerationReveal, createColorDropdown, setM3Theme, bindAIRecommend,
} from './ai-reveal-motion/src/index.js';
// CSS: <link rel="stylesheet" href="./ai-reveal-motion/src/index.css">

const root = document.querySelector('.payment');          // 결제창 루트 (position: relative)

// 1) 컬러 드롭다운 — 칩을 고르면 결제창 테마 변경
createColorDropdown(headerEl, { onSelect: (theme) => setM3Theme(root, theme) });

// 2) Reveal — 결제수단 영역을 .rv-root 구조로 감싸 둠 (아래 '결제창 쪽에서 할 일' 2번)
const reveal = new GenerationReveal(root.querySelector('.rv-root'));

// 3) AI 추천 버튼 + 채팅 모달 + 연결
const recommend = bindAIRecommend(createAIButton(root), reveal, {
  chat: createAIChat(root, { tapToAdvance: true }),  // 빼면 채팅 없이 바로 Reveal
  prompt: '우리회사 코어 타겟군과 실제 결제 수단 선택률에 맞게 결제창 세팅해줘',
  steps: [
    { loading: '고객 데이터 분석 중…', done: '중화권 고객 비중 70% 이상' },
    { loading: '결제 수단 선택률 확인 중…', done: '선택률 확인 완료' },
  ],
  once: true,                  // 한 번 적용되면 AI 추천 버튼이 사라짐
  onBeforeReveal: async () => { /* ★ 결제창 내용을 추천 결과로 교체 + 스켈레톤 준비 */ },
  onSweepStart:   () => { /* ★ Reveal 영역 밖(헤더 색·로고)을 글로우와 같은 순간에 교체 */ },
  onAfterReveal:  () => { /* ★ 마무리 (테마를 결제창 전체로 옮기기 등) */ },
});
// recommend.reset() → 진행 중이던 것을 모두 멈추고 버튼을 처음 상태로
```

위치는 서비스 CSS에서 지정합니다: `.ai-btn`(AI 버튼), `.aic`(채팅 모달), `.cp`(팔레트 버튼). 데모 값은 `demo/demo.css` 참고.

### 훅 3개가 불리는 순서

| 훅 | 불리는 때 | 데모에서 한 일 |
|---|---|---|
| `onBeforeReveal` | 채팅 모달이 닫히기 시작하고 Reveal 재생 직전 (async 가능) | 스켈레톤에 이전 화면을 연하게 깔고, 결제수단 영역을 추천 결과로 다시 그림. 새 내용 레이어(`.rv-sharp`, `.rv-blur`)에만 Rose 테마 적용 → 글로우가 지나간 자리부터 Rose 색으로 드러남 |
| `onSweepStart` | 스켈레톤 대기가 끝나고 글로우가 위에서 쓸기 시작하는 순간 | 헤더(배경·금액·아이콘)에 Rose 테마 + 로고 PAYVERSE → MEIMEI 교체 (0.45s 전환) |
| `onAfterReveal` | 글로우가 다 사라진 뒤 | Rose를 결제창 루트로 옮기고 부분별 테마 표시 정리 (같은 색이라 화면 변화 없음) |

React 등에서는 `onBeforeReveal`에서 상태를 바꾼 뒤 **다음 렌더가 끝날 때까지 기다렸다가** resolve해야 합니다. Reveal은 `play()` 시점의 `.rv-sharp` 내용을 복제해서 블러 레이어로 쓰기 때문입니다.

## 결제창 쪽에서 할 일 (체크리스트)

1. **색을 토큰으로:** 결제창 요소 색을 `var(--md-sys-color-<역할>, <기존 색>)`으로 바꿈. 역할은 아래 '요소 ↔ 토큰' 표대로. 테마를 안 고르면 기존 색이 그대로 나옴
   ```css
   /* 기존 */ .amount { color: #3c62dd; }
   /* 변경 */ .amount { color: var(--md-sys-color-primary, #3c62dd); }
   ```
2. **Reveal 영역 감싸기:** AI가 바꾸는 영역(대표 결제수단 ~ 나라별 결제수단 목록)을 아래 구조로 감쌈
   ```html
   <div class="rv-root">                     <!-- position 기준. --rv-bg: 영역 배경색 -->
     <div class="rv-skel">
       <canvas class="rv-ambient"></canvas>  <!-- 반드시 첫 자식: 스켈레톤 뒤 배경 빛 -->
       <!-- 스켈레톤 도형 (position: absolute) -->
     </div>
     <div class="rv-sharp"> 기존 결제수단 영역 </div>
     <div class="rv-blur"></div>             <!-- 비워 둠 -->
     <canvas class="rv-canvas"></canvas>
   </div>
   ```
   - 새 내용 레이어에 테마를 따로 붙일 때 배경도 따라가도록 `.rv-sharp[data-m3-theme], .rv-blur[data-m3-theme] { --rv-bg: var(--md-sys-color-background, <기존 배경>); }` 추가 (데모 `demo.css` 참고)
3. **스켈레톤 만들기:** 아래 '스켈레톤 규칙'대로. `onBeforeReveal`에서 바뀌기 전 화면 기준으로 채움
4. **위치 지정:** `.ai-btn`, `.aic`, `.cp` 위치. 채팅 모달의 겹침 순서는 `--aic-z`(기본 30). 모달이 열려 있는 동안 모달을 띄운 영역 전체를 투명 막이 덮어서 다른 버튼이 눌리지 않음
5. **테마 바뀔 때 부드럽게(선택):** 결제창 요소에 `transition: background-color .45s, color .45s, fill .45s, border-color .45s, box-shadow .45s` (AI 버튼·채팅 모달은 제외)
6. **폰트:** 채팅 모달은 Pretendard 기준 (없으면 system-ui)

## 전체 타임라인 ([AI 추천] 터치 기준, 터치로 넘기지 않을 때)

| 시점 | 버튼 | 채팅 모달 | 결제창 |
|---|---|---|---|
| 0s | 0.93배로 눌림 | | |
| 0.13s | | 오른쪽 아래에서 커지며 열림 (320ms) | 뒤 화면 터치 막힘 |
| ~0.65s | | 요청 문장 자동 타이핑 (글자당 35ms) → 보내기 → 내 말풍선 | |
| ~2.5s | 글자 사라짐 → 동그란 별 버튼(로딩) | 생각 중 표시(별 아이콘 + 진한 글자 묶음 이동) 1.8s → 결과 문구가 한 글자씩 써짐, 단계마다 반복 | |
| ~7s | 〃 | 결과 보여준 뒤 접히며 닫힘 (280ms) | 이전 화면 0.45s 페이드 → 스켈레톤 + 뒤 배경 빛 (`onBeforeReveal`) |
| ~8s ~ 12s | 〃 | | 글로우가 위→아래로 쓸고 내려감, 블러 → 선명 (`onSweepStart`) |
| ~12.5s | 작아지며 사라짐 (`once`) | | 글로우 사라짐 (`onAfterReveal`) |

- `tapToAdvance: true`(데모 설정)면 시간 대신 모달 안 터치로 진행: 글이 나오는 중 터치 → 바로 완성, 다 나온 뒤 터치 → 다음으로
- 모달의 X 또는 모달 바깥 터치 → 모달이 닫히고 Reveal 없이 버튼만 원래대로
- 시간 값은 `CHAT_DEFAULTS`(ai-chat.js), `REVEAL_DEFAULTS`(generation-reveal.js)에서 한곳에 조절

## 스켈레톤 규칙 (이번 결제창에서 확정한 톤)

- 배경·카드·타일 같은 **구조는 실제 화면과 같은 밝기의 반투명** → 뒤 배경 빛이 비침
  - `#F5F5F5` 배경 → `rgba(0,0,0,.04)`, `#FAFAFA` → `rgba(0,0,0,.02)`, 흰 카드 → `rgba(255,255,255,.5)` (테두리 없음)
- 글자는 지우지 않고 **연하게**: `rgba(33,33,33,.16)`, 선택 강조 없이 모두 같은 색
- 선택 밑줄처럼 꽉 찬 선은 한 단계 더 연하게: `rgba(33,33,33,.1)`
- 구분선(stroke)은 뺌
- **바뀌기 전 로고**는 흑백 + 투명도 `.22`로 남김 → 글로우가 지나가면 새 로고로 바뀜
- 데모 구현: `demo/demo.js`의 `setSkeletonFrom`, `demo/demo.css`의 `.sk-*`

## M3 색상 토큰

Figma 변수 컬렉션 **M3 · Palette**(테마별 실제 색)와 **M3 · Theme**(역할별 색)를 옮긴 것입니다. **라이트 모드만** 있습니다.

- 결제창 루트에 `setM3Theme(root, 'Pink')`(= `data-m3-theme="Pink"`) → `--md-sys-color-*` 변수가 바뀜. `setM3Theme(root, null)` → 기존 색
- 테마: `Baseline` `Green` `Monochrome` `Pink` `Mint` `Orange` `Blue` (컬러칩 순서) + `Rose` (AI 추천 프리셋, 칩 없음)
- `Outline Variant Pressed` = Figma에서 Primary를 가리키는 별칭 (선택·눌림 테두리와 밑줄)
- JS에서 색 값이 필요하면 `M3_THEMES`, CSS가 아닌 환경은 `m3-theme.json`
- **값을 바꿀 때:** Figma 팔레트 값을 바꾼 뒤 `tools/figma-palette-light.json`에 같은 값을 넣고 `python tools/gen-m3-theme.py` 실행 → css/js/json이 다시 만들어짐

### 결제창 요소 ↔ 토큰 (Figma '커스터마이징 적용' 라이트 보드에서 컴포넌트에 연결된 값)

| 요소 | 속성 | 토큰 |
|---|---|---|
| 결제창 전체 바탕 (칠 없는 영역에 비침) | 배경 | Background |
| 헤더 배경, 결제수단 목록 영역 배경 | 배경 | Surface |
| "결제 금액", 지역 제목(중국·한국), 상태바 | 글자 | On Surface |
| 금액 "10,000원" | 글자 | Primary |
| 헤더 아이콘 (지구본·팔레트) 기본 | 아이콘 | On Primary Container (배경 없음) |
| 헤더 아이콘 눌림·선택 상태 | 배경 | Primary Container |
| 컬러 드롭다운 맨 위 칩 | 배경 / 아이콘 | Primary Container / On Primary Container |
| 컬러칩 (각 테마) | 칠 | 그 테마의 Primary |
| 대표 결제수단 영역 | 배경 | Surface Container |
| 대표 결제수단 카드, 결제수단 타일 | 배경 / 테두리 | Surface Container Lowest / Outline Variant |
| 결제수단 타일 눌림(Pressed) | 테두리 | Outline Variant Pressed (누르고 있을 때만) |
| 결제방식 탭 줄 | 배경 / 아래 선 | Background (칠 없음, 바탕이 비침) / Outline Variant |
| 결제방식 탭 (선택 안 됨 / 선택됨) | 글자 | On Surface Variant / On Primary Container |
| 결제방식 탭 (선택됨) | 밑줄 | Outline Variant Pressed |
| 나라 탭 행 (선택 안 됨) | 배경 / 글자 | Surface Container Low / On Surface Variant |
| 나라 탭 행 (선택됨) | 배경 / 글자 | Primary Container / On Primary Container |
| 하단 [결제하기] 버튼 | 배경 / 글자 | Primary / On Primary |

CSS 변수 이름 = `--md-sys-color-` + 역할 이름 소문자·하이픈 (예: Surface Container Low → `--md-sys-color-surface-container-low`).
AI 추천 버튼, 채팅 모달, 로고, Reveal 글로우 색은 테마와 무관하게 고정입니다.

## 접근성
- `prefers-reduced-motion: reduce`이면 Reveal은 애니메이션 없이 바로 최종 화면, 생각 중 아이콘은 멈춤

## 데모에서만 임시로 한 것
- AI 추천 결과: 상단 알리페이 / 위챗페이 / 알리페이 홍콩, 나라 탭 싱가포르 > 태국 > 베트남 > 인도네시아 > 말레이시아 > 한국
- 나라별 결제수단 로고가 없어 타일은 모두 우리카드 로고
- 추천 결과 로고 MEIMEI 美美는 가상 쇼핑몰 로고 (Figma component 섹션 `logo/MEIMEI 美美`)
- 결제창은 Figma 좌표대로 HTML로 그린 목업이라 크기 고정 (380×592)

## 부스 화면에 끼워 넣기 (`demo/?embed`)

`booth-motion/` 8번 화면이 `../ai-reveal-motion/demo/?embed`로 데모를 불러옵니다. embed 모드에서는 결제창만 창 폭에 맞춰 꽉 차게 그리고, 아래 안내 줄이 없습니다.

- 부모 → 데모: `{type:'ai-demo:reset'}` 처음 화면으로 · `{type:'ai-demo:lang', lang:'ko'|'en'}` 결제창 글자 언어 전환
- 데모 → 부모: 헤더 지구본을 누르면 `{type:'ai-demo:toggle-lang'}` (부스가 전체 언어를 바꾸고 `ai-demo:lang`으로 다시 알려 줌). 단독으로 열었을 때는 지구본이 결제창 언어를 바로 바꿈
- 영어 문구는 퍼즐 프로젝트 EN 스토리보드(`video-mockup/assets/sb2-en.png`, `sb-list-en.png`) 기준입니다. 싱가포르·베트남은 스토리보드에 없어 국가 영문명(Singapore, Vietnam)을 씁니다. AI 채팅 대사는 번역이 확정되지 않아 한국어로 둡니다.
