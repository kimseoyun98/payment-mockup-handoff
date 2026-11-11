/**
 * AI 추천 버튼 모션
 *
 * 1) press()        : 눌림 1 → 0.93 → 1 (130ms 눌림 + 270ms 스프링 복귀)
 * 2) startLoading() : 글자 사라짐 → 버튼이 별 아이콘만 담은 동그라미로 줄어듦 → 별이 숨쉬고 흐릿한 빛이 지나감
 * 3) stopLoading()  : 동그라미가 원래 버튼으로 늘어나고 글자가 돌아옴 (Promise, 다 돌아오면 resolve)
 * 4) hide()         : (한 번만 쓰는 버튼) 로딩 동그라미가 작아지며 사라짐 → 버튼 숨김
 *    show()         : 숨긴 버튼을 원래 모습으로 되돌림 (초기화용)
 *
 * 줄어드는 방향은 버튼의 CSS 위치 기준을 따름 (right로 붙이면 오른쪽으로, left로 붙이면 왼쪽으로 모임)
 * 만들기: createAIButton(container, { label }) → 마크업을 container 안에 만들고 AIButton을 돌려줌
 * 위치는 서비스 CSS에서 .ai-btn 에 지정 (예: position:absolute; right:16px; bottom:16px)
 */
import { SPRING, DECEL, ACCEL, EASE_OUT, EASE_IN_OUT } from './motion-tokens.js';
import { aiStarSvg } from './ai-star.js';

export class AIButton {
  /** @param {HTMLElement} btn  .ai-btn 요소 */
  constructor(btn) {
    this.btn = btn;
    this.icon = btn.querySelector('.ai-icon'); // 별 아이콘 (svg)
    this.starS = btn.querySelector('.ai-star-s'); // 작은 별
    this.starL = btn.querySelector('.ai-star-l'); // 큰 별
    this.label = btn.querySelector('.ai-label'); // "AI 추천"
    this.sheen = btn.querySelector('.ai-sheen'); // 로딩 중 지나가는 빛
    this.loops = [];
    this.shape = null;
  }

  /** 눌림. 눌림이 바닥에 닿는 시점(130ms)에 resolve */
  press() {
    this.btn.animate(
      [
        { transform: 'scale(1)', easing: EASE_OUT },
        { transform: 'scale(.93)', offset: 0.325, easing: SPRING },
        { transform: 'scale(1)' },
      ],
      { duration: 400 },
    );
    return new Promise((r) => setTimeout(r, 130));
  }

  /**
   * 로딩 시작
   * - 글자 사라짐 120ms
   * - 60ms 뒤부터 폭이 원래 폭 → 버튼 높이와 같은 동그라미로 줄어듦 380ms (DECEL)
   * - 별 두 개가 1초 주기로 번갈아 커졌다 작아짐, 흐릿한 흰 빛이 2.4초마다 지나감
   */
  startLoading() {
    this.stopLoops();
    const f = { fill: 'forwards' };
    const cs = getComputedStyle(this.btn);
    this.full = { width: `${this.btn.offsetWidth}px`, paddingLeft: cs.paddingLeft, paddingRight: cs.paddingRight };
    const size = this.btn.offsetHeight; // 동그라미 지름 = 버튼 높이
    const pad = `${(size - this.icon.getBoundingClientRect().width) / 2}px`; // 별이 동그라미 가운데 오도록
    this.circle = { width: `${size}px`, paddingLeft: pad, paddingRight: pad };

    this.label.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: EASE_OUT, ...f });
    this.shape?.cancel();
    this.shape = this.btn.animate([this.full, this.circle], { duration: 380, delay: 60, easing: DECEL, ...f });

    this.loops.push(this.starL.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(.86)' }, { transform: 'scale(1)' }],
      { duration: 1000, easing: EASE_IN_OUT, iterations: Infinity },
    ));
    this.loops.push(this.starS.animate(
      [{ transform: 'scale(.8)', opacity: 0.7 }, { transform: 'scale(1.15)', opacity: 1 }, { transform: 'scale(.8)', opacity: 0.7 }],
      { duration: 1000, delay: -500, easing: EASE_IN_OUT, iterations: Infinity }, // 반 박자 어긋나게
    ));
    this.loops.push(this.sheen.animate(
      [{ transform: 'translateX(-110%)' }, { transform: 'translateX(160%)' }],
      { duration: 2400, easing: EASE_IN_OUT, iterations: Infinity },
    ));
  }

  /**
   * 로딩 끝
   * - 동그라미 → 원래 폭 420ms (SPRING, 살짝 튕김)
   * - 220ms 뒤부터 글자 나타남 200ms
   */
  async stopLoading() {
    this.stopLoops();
    const f = { fill: 'forwards' };
    this.shape?.cancel();
    this.shape = this.btn.animate([this.circle, this.full], { duration: 420, easing: SPRING, ...f });
    this.label.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 220, easing: EASE_OUT, ...f });
    await this.shape.finished.catch(() => {});
    this.shape.cancel(); // 고정해 둔 폭을 풀어 원래 레이아웃으로
    this.shape = null;
  }

  /** 사라짐: 0.6배로 작아지며 투명해짐 280ms (ACCEL) → 숨김 */
  async hide() {
    this.stopLoops();
    const a = this.btn.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.6)' }], { duration: 280, easing: ACCEL, fill: 'forwards' });
    await a.finished.catch(() => {});
    this.btn.hidden = true;
  }

  /** 숨긴 버튼을 원래 모습으로 (모든 애니메이션 해제) */
  show() {
    this.stopLoops();
    this.btn.getAnimations({ subtree: true }).forEach((x) => x.cancel());
    this.shape = null;
    this.btn.hidden = false;
  }

  stopLoops() {
    this.loops.forEach((a) => a.cancel());
    this.loops = [];
  }
}

/**
 * AI 추천 버튼 만들기: container 안에 버튼 마크업을 만들고 AIButton을 돌려줌
 * @param {HTMLElement} container
 * @param {{ label?: string }} options
 */
export function createAIButton(container, { label = 'AI 추천' } = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ai-btn';
  btn.innerHTML = `<span class="ai-icon-wrap">${aiStarSvg('ai-icon', 'ai')}</span>`
    + '<span class="ai-sheen" aria-hidden="true"></span>'
    + '<span class="ai-labels"><span class="ai-label"></span></span>';
  btn.querySelector('.ai-label').textContent = label;
  container.append(btn);
  return new AIButton(btn);
}
