/**
 * AI 채팅창 (Rovo 채팅 패널 형태, 로고·이름 자리는 비움)
 *
 * run({ prompt, steps }) 한 번이면 아래 순서로 자동 재생
 *   1. open()      채팅창이 오른쪽 아래(AI 버튼 쪽)에서 커지며 열림 320ms
 *   2. type()      입력란에 요청 문장이 한 글자씩 타이핑 (글자당 35ms, 깜빡이는 커서)
 *   3. send()      보내기 버튼 눌림 → 입력란이 비고 문장이 내 말풍선으로 올라감
 *   4. runSteps()  생각 중 표시 한 줄(별 아이콘 + 문구) → 단계마다 결과 문구가 한 글자씩 써짐 → 끝나면 생각 중 표시 사라짐
 *   5. close()     채팅창이 오른쪽 아래로 작아지며 닫힘 320ms (가감속)
 * 각 단계 사이 onSent 콜백(보낸 직후)을 받아 버튼 로딩 등을 시작할 수 있음
 *
 * 터치로 넘기기 (tapToAdvance: true)
 *   - 글이 나오는 중(타이핑·생각 중·결과 써지는 중)에 터치 → 그 글이 바로 완성됨
 *   - 글이 다 나온 뒤 터치 → 다음으로 넘어감 (타이핑 완성 → 보내기 / 분석 결과 → 닫기)
 *   - 터치를 받는 영역: tapTarget (기본: 채팅창). false면 기존처럼 정해진 시간마다 자동으로 넘어감
 *
 * 중간에 닫기: 헤더 X(.aic-close) 또는 채팅창 바깥 터치 → 채팅창이 닫히고 run()이 false를 돌려줌
 *
 * 만들기: createAIChat(container, options) → 마크업(채팅창 + 뒤 투명 막)을 container 안에 만들고 AIChatPanel을 돌려줌
 * 위치·z-index는 서비스 CSS에서 .aic 에 지정 (예: position:absolute; right:16px; bottom:76px; --aic-z:30)
 */
import { DECEL, EASE_OUT } from './motion-tokens.js';
import { aiStarSvg } from './ai-star.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// 생각 중 표시: AI 추천 버튼과 같은 별 아이콘이 프레임 단위로 뚝뚝 바뀌며 커졌다 작아지기를 반복
//   큰 별·작은 별이 서로 엇갈려 움직임 (한쪽이 클 때 다른 쪽은 작음), 프레임마다 조금씩 회전
const THINK_SCALE = [0.35, 0.55, 0.75, 0.95, 1.1, 0.95, 0.75, 0.55]; // 프레임별 크기
const THINK_TURN = 15; // 프레임마다 회전 각도(도)
const THINK_MS = 120; // 프레임 하나당 시간
const SCAN_MS = 55; // 문구: 진한 글자 묶음이 한 글자씩 오른쪽으로 옮겨 가는 간격 (Claude 'Thinking…' 방식)
const SCAN_W = 3; // 진하게 보이는 글자 수

export const CHAT_DEFAULTS = {
  typeSpeed: 35, // ms, 글자당 타이핑 시간
  afterType: 350, // ms, 다 친 뒤 보내기까지 쉬는 시간
  stepLoading: 1800, // ms, 단계마다 생각 중 표시가 보이는 시간
  resultSpeed: 30, // ms, 결과 문구 글자당 써지는 시간
  stepGap: 300, // ms, 결과가 다 써진 뒤 다음 단계 생각 중으로 넘어가기까지
  holdResult: 900, // ms, 결과가 다 나온 뒤 닫히기 전까지 보여주는 시간 (tapToAdvance: false일 때)
  tapToAdvance: false, // true: 터치로 글 완성 → 다음으로 넘기기
  tapTarget: null, // 터치를 받을 요소 (기본: 채팅창)
};

export class AIChatPanel {
  /** @param {HTMLElement} panel  .aic 요소 */
  constructor(panel, options = {}) {
    this.o = { ...CHAT_DEFAULTS, ...options };
    this.panel = panel;
    this.msgs = panel.querySelector('.aic-msgs');
    this.text = panel.querySelector('.aic-text');
    this.ph = panel.querySelector('.aic-ph');
    this.sendBtn = panel.querySelector('.aic-send');
    this.phase = 'idle'; // 'busy' 글 나오는 중 | 'wait' 다음으로 넘길 터치 대기 | 'idle'
    this.skipping = false;
    this.cancelled = false;
    (this.o.tapTarget || panel).addEventListener('click', () => this.tap());
    // 닫기: 헤더 X 버튼 또는 채팅창 바깥 터치 → 진행을 멈추고 채팅창을 닫음 (Reveal로 넘어가지 않음)
    panel.querySelector('.aic-close')?.addEventListener('click', (e) => { e.stopPropagation(); this.cancel(); });
    // 채팅창이 열려 있는 동안 뒤 화면을 덮는 투명 막: 다른 버튼(팔레트 등)이 눌리지 않고, 누르면 채팅창만 닫힘
    this.scrim = document.createElement('div');
    this.scrim.className = 'aic-scrim';
    this.scrim.hidden = true;
    panel.before(this.scrim);
    this.scrim.addEventListener('click', (e) => { e.stopPropagation(); this.cancel(); });
  }

  /** 중간에 닫기: 기다리는 중인 단계를 모두 풀고 채팅창을 닫음. run()은 false를 돌려줌 */
  cancel() {
    if (this.cancelled || this.panel.hidden || this.closing) return;
    this.cancelled = true;
    this.skipping = true;
    this.wake?.();
    const go = this.advance;
    this.advance = null;
    go?.();
    this.close();
  }

  /** 터치: 글 나오는 중이면 바로 완성, 다 나온 뒤면 다음으로 */
  tap() {
    if (this.phase === 'wait') {
      const go = this.advance;
      this.advance = null;
      this.phase = 'idle';
      go?.();
    } else if (this.phase === 'busy') {
      this.skipping = true;
      this.wake?.();
    }
  }

  /** 기다리기. 글 나오는 중에 터치하면 바로 끝남 */
  sleep(ms) {
    if (this.skipping || this.cancelled) return Promise.resolve();
    return new Promise((r) => {
      const t = setTimeout(r, ms);
      this.wake = () => { clearTimeout(t); r(); };
    });
  }

  /** 글이 나오는 구간 시작/끝 */
  begin() { this.skipping = this.cancelled; this.phase = 'busy'; }
  end() { this.phase = 'idle'; this.skipping = false; this.wake = null; }

  /** 다음으로 넘어가기: tapToAdvance면 터치 대기, 아니면 ms 뒤 자동 */
  next(ms) {
    if (this.cancelled) return Promise.resolve(); // 닫힌 뒤에는 기다리지 않음
    if (!this.o.tapToAdvance) return wait(ms);
    this.phase = 'wait';
    return new Promise((r) => { this.advance = r; });
  }

  /** 애니메이션 없이 바로 닫고 처음 상태로 (화면 초기화용) */
  forceClose() {
    this.cancelled = true;
    this.skipping = true;
    this.wake?.();
    const go = this.advance;
    this.advance = null;
    go?.();
    this.panel.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    this.panel.hidden = true;
    this.scrim.hidden = true;
  }

  reset() {
    this.msgs.replaceChildren();
    this.text.textContent = '';
    this.ph.hidden = false;
    this.sendBtn.classList.remove('is-active');
  }

  /** 오른쪽 아래 모서리를 기준으로 0.6배 → 1배로 커지며 나타남 */
  async open() {
    this.reset();
    this.scrim.hidden = false;
    this.panel.hidden = false;
    await this.panel.animate(
      [{ opacity: 0, transform: 'translateY(12px) scale(.6)' }, { opacity: 1, transform: 'none' }],
      { duration: 320, easing: DECEL },
    ).finished;
  }

  async close() {
    if (this.closing) return this.closing;
    this.closing = this._close();
    try { await this.closing; } finally { this.closing = null; }
  }

  async _close() {
    // fill: 'forwards' → 애니메이션이 끝난 뒤 숨기기 전까지 한 프레임이라도 원래 모습으로 돌아와 깜빡이지 않게
    // FAB 접힘: 아래로 끌려가지 않고 오른쪽 아래 모서리(AI 버튼 쪽)로 제자리에서 작아짐
    //   안 내용이 먼저 120ms 동안 사라지고 → 빈 카드가 모서리로 작아지며 둥글어지고 흐려짐
    const inner = [...this.panel.children].map((el) =>
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: EASE_OUT, fill: 'forwards' }),
    );
    const a = this.panel.animate(
      [
        { opacity: 1, transform: 'scale(1)', borderRadius: '12px' },
        { opacity: 1, offset: 0.4 },
        { opacity: 0, transform: 'scale(.3)', borderRadius: '40px' },
      ],
      { duration: 280, easing: 'cubic-bezier(0.3, 0, 0.8, 0.15)', fill: 'forwards' }, // 천천히 출발 → 빠르게 접힘 (M3 퇴장 가속)
    );
    await a.finished;
    this.panel.hidden = true;
    this.scrim.hidden = true;
    a.cancel();
    inner.forEach((x) => x.cancel());
  }

  /** 입력란 타이핑. 도중에 터치하면 문장이 바로 완성됨 */
  async type(str) {
    this.ph.hidden = true;
    this.sendBtn.classList.add('is-active');
    this.begin();
    for (const ch of str) {
      if (this.skipping) { this.text.textContent = str; break; }
      this.text.textContent += ch;
      await this.sleep(this.o.typeSpeed);
    }
    this.end();
    await this.next(this.o.afterType);
  }

  /** 보내기: 버튼 눌림 → 입력란 비움 → 내 말풍선이 아래에서 올라오며 나타남 */
  async send() {
    this.sendBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(.85)' }, { transform: 'scale(1)' }], { duration: 220, easing: EASE_OUT });
    await wait(120);
    const str = this.text.textContent;
    this.text.textContent = '';
    this.ph.hidden = false;
    this.sendBtn.classList.remove('is-active');
    const bubble = document.createElement('div');
    bubble.className = 'aic-me';
    bubble.textContent = str;
    this.msgs.append(bubble);
    await bubble.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: DECEL }).finished;
  }

  /**
   * 분석 단계: [{ loading: '고객 데이터 분석 중…', done: '중화권 고객 비중 70% 이상' }, ...]
   * 생각 중 표시(별 아이콘 + 문구)는 한 줄만 나오고, 단계마다 문구만 바뀜
   *   → stepLoading 동안 생각 중 → 결과 문구가 그 위에 한 글자씩 써짐 → 다음 단계
   *   → 마지막 단계가 끝나면 생각 중 표시가 사라짐
   * 도중에 터치하면 남은 결과가 모두 바로 써짐
   */
  async runSteps(steps) {
    const list = document.createElement('div');
    list.className = 'aic-steps';
    this.msgs.append(list);
    const results = document.createElement('div');
    results.className = 'aic-results';
    const think = document.createElement('div');
    think.className = 'aic-thinking';
    think.innerHTML = `<span class="aic-ico">${aiStarSvg('aic-think', 'aic')}</span><span class="aic-label is-thinking"></span>`;
    list.append(results, think);
    const label = think.querySelector('.aic-label');
    const big = think.querySelector('.aic-star-l');
    const small = think.querySelector('.aic-star-s');
    const n = THINK_SCALE.length;
    let f = 0;
    let pos = -SCAN_W;
    let chars = [];
    const draw = () => {
      big.style.transform = `rotate(${f * THINK_TURN}deg) scale(${THINK_SCALE[f % n]})`;
      small.style.transform = `rotate(${-f * THINK_TURN}deg) scale(${THINK_SCALE[(f + n / 2) % n]})`;
    };
    // 생각 중 문구 바꾸기 (글자마다 span → 진한 글자 묶음이 한 글자씩 이동)
    const setLabel = (str) => {
      chars = [...str].map((ch) => {
        const c = document.createElement('span');
        c.textContent = ch;
        return c;
      });
      label.replaceChildren(...chars);
      pos = -SCAN_W;
    };
    draw();
    const timers = [];
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timers.push(setInterval(() => { f++; draw(); }, THINK_MS));
      timers.push(setInterval(() => {
        pos = pos > chars.length + 6 ? -SCAN_W : pos + 1; // 끝까지 가면 잠깐 쉬었다가 처음부터
        chars.forEach((c, k) => c.classList.toggle('on', k >= pos && k < pos + SCAN_W));
      }, SCAN_MS));
    }
    const lines = steps.map(() => null);
    const addLine = (i) => {
      const p = document.createElement('p');
      p.className = 'aic-result';
      const t = document.createElement('span'); // 글자 그라데이션용
      p.append(t);
      results.append(p);
      return (lines[i] = t);
    };

    this.begin();
    think.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: DECEL });
    for (let i = 0; i < steps.length && !this.skipping; i++) {
      setLabel(steps[i].loading);
      await this.sleep(this.o.stepLoading);
      if (this.skipping) break;
      const p = addLine(i);
      for (const ch of steps[i].done) { // 결과 문구가 한 글자씩 써짐
        if (this.skipping) break;
        p.textContent += ch;
        await this.sleep(this.o.resultSpeed);
      }
      if (!this.skipping && i < steps.length - 1) await this.sleep(this.o.stepGap);
    }
    // 터치로 건너뛴 경우: 남은 결과를 모두 바로 채움
    steps.forEach((st, i) => { (lines[i] || addLine(i)).textContent = st.done; });
    timers.forEach(clearInterval);
    this.end();
    await think.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished;
    think.remove();
    await this.next(this.o.holdResult);
  }

  /**
   * 전체 자동 재생 (열림 → 타이핑 → 보내기 → 분석 단계). onSent: 보낸 직후 호출 (버튼 로딩 시작 등)
   * close: true(기본)면 마지막에 닫기까지 기다림. false면 닫지 않고 끝냄 → 쓰는 쪽에서 close()를 다음 연출과 겹쳐 실행
   */
  /** 끝까지 진행하면 true, 중간에 닫히면(X·바깥 터치) false */
  async run({ prompt, steps, onSent, close = true }) {
    this.cancelled = false;
    await this.open();
    const go = async (fn) => { if (!this.cancelled) await fn(); };
    await go(() => wait(200));
    await go(() => this.type(prompt));
    await go(() => this.send());
    if (this.cancelled) return false;
    onSent?.();
    await go(() => wait(250));
    await go(() => this.runSteps(steps));
    if (this.cancelled) return false;
    if (close) await this.close();
    return true;
  }
}

/**
 * 채팅창 만들기: container 안에 [투명 막 + 채팅창] 마크업을 만들고 AIChatPanel을 돌려줌
 * 헤더 아이콘(메뉴·새 대화·패널·더보기)은 모양만 있는 자리이고, X(닫기)만 동작함
 * @param {HTMLElement} container  채팅창이 뜰 영역 (position: relative 등 기준이 되는 요소). 투명 막이 이 영역을 덮음
 * @param {Partial<typeof CHAT_DEFAULTS> & { placeholder?: string }} options
 */
export function createAIChat(container, { placeholder = '질문하거나 요청을 입력하세요', ...options } = {}) {
  const panel = document.createElement('div');
  panel.className = 'aic';
  panel.hidden = true;
  panel.innerHTML = `
<div class="aic-head">
  <button aria-label="메뉴"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4h11M2.5 8h11M2.5 12h11"/></svg></button>
  <span class="aic-title"></span>
  <button aria-label="새 대화"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V7"/><path d="m7 9 6.5-6.5"/></svg></button>
  <button aria-label="사이드 패널"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="3" width="11" height="10" rx="1"/><path d="M9.5 3v10"/></svg></button>
  <button aria-label="더보기"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="3.5" cy="8" r=".6" fill="currentColor"/><circle cx="8" cy="8" r=".6" fill="currentColor"/><circle cx="12.5" cy="8" r=".6" fill="currentColor"/></svg></button>
  <button class="aic-close" type="button" aria-label="닫기"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4 4 8 8M12 4l-8 8"/></svg></button>
</div>
<div class="aic-body"><div class="aic-msgs"></div></div>
<div class="aic-input">
  <div class="aic-field"><span class="aic-text"></span><span class="aic-ph">${placeholder}</span><span class="aic-caret"></span></div>
  <div class="aic-tools">
    <button aria-label="추가"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v10M3 8h10"/></svg></button>
    <span class="aic-right">
      <button aria-label="음성 입력"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2.5" width="4" height="7" rx="2"/><path d="M4 8a4 4 0 0 0 8 0M8 12v1.5"/></svg></button>
      <button class="aic-send" aria-label="보내기"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12.5v-9M4.5 7 8 3.5 11.5 7"/></svg></button>
    </span>
  </div>
</div>`;
  container.append(panel);
  return new AIChatPanel(panel, options);
}
