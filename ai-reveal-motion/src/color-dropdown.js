/**
 * 결제창 컬러 변경 드롭다운 (Figma colorPicker-dropdown)
 *
 * - 팔레트 버튼 터치: 버튼 자리에서 회색 알약이 아래로 늘어나고(300ms), 컬러칩이 위에서부터 차례로 나타남
 *   (맨 위 Default 칩 = 흰 배경 + 팔레트 아이콘 → 선택 상태 표시. 펼친 알약이 원래 버튼을 덮으므로 닫기 역할도 함)
 * - Default 칩 터치 / 컬러칩 선택 / close() 호출: 칩이 아래부터 사라지고 알약이 버튼 크기로 줄어듦(220ms)
 *
 * 필요한 마크업과 클래스는 color-dropdown.css / README.md 참고
 */
import { DECEL, ACCEL } from './motion-tokens.js';

export class ColorDropdown {
  /**
   * @param {HTMLElement} trigger  팔레트 버튼 (.cp-trigger)
   * @param {HTMLElement} panel    알약 컨테이너 (.cp-panel). 첫 자식 .cp-default + 컬러칩 .cp-chip 들
   * @param {{ onSelect?: (color: string) => void }} options  칩 선택 시 data-color 값을 넘겨줌
   */
  constructor(trigger, panel, { onSelect } = {}) {
    this.trigger = trigger;
    this.panel = panel;
    this.def = panel.querySelector('.cp-default');
    this.chips = [...panel.querySelectorAll('.cp-chip')];
    this.open = false;
    this.anims = [];
    trigger.addEventListener('click', (e) => { e.stopPropagation(); this.show(); });
    this.def.addEventListener('click', (e) => { e.stopPropagation(); this.close(); });
    this.chips.forEach((c) => c.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelect?.(c.dataset.color);
      this.close();
    }));
  }

  /** [닫힌 높이 = Default 칩 + 위아래 여백, 열린 높이 = 내용 전체] */
  heights() {
    const cs = getComputedStyle(this.panel);
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    return [this.def.offsetHeight + pad, this.panel.scrollHeight];
  }

  /** 펼침: 알약 높이 300ms (DECEL) + 칩이 8px 위에서 내려오며 나타남 220ms (40ms 뒤부터 칩마다 25ms 간격) */
  show() {
    if (this.open) return;
    this.open = true;
    this.anims.forEach((a) => a.cancel());
    this.panel.hidden = false;
    const [h0, h1] = this.heights();
    this.anims = [
      this.panel.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration: 300, easing: DECEL, fill: 'both' }),
      ...this.chips.map((c, i) => c.animate(
        [{ transform: 'translateY(-8px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
        { duration: 220, delay: 40 + i * 25, easing: DECEL, fill: 'both' },
      )),
    ];
  }

  /** 접힘: 칩이 아래부터 사라짐 120ms (칩마다 15ms 간격) + 알약 높이 220ms (40ms 뒤, ACCEL) */
  close() {
    if (!this.open) return;
    this.open = false;
    this.anims.forEach((a) => a.cancel());
    const [h0, h1] = this.heights();
    const n = this.chips.length;
    this.anims = [
      ...this.chips.map((c, i) => c.animate(
        [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-8px)', opacity: 0 }],
        { duration: 120, delay: (n - 1 - i) * 15, easing: ACCEL, fill: 'both' },
      )),
      this.panel.animate([{ height: `${h1}px` }, { height: `${h0}px` }], { duration: 220, delay: 40, easing: ACCEL, fill: 'both' }),
    ];
    Promise.all(this.anims.map((a) => a.finished)).then(() => { if (!this.open) this.panel.hidden = true; }).catch(() => {});
  }
}
