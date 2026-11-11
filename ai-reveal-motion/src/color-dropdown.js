/**
 * 결제창 컬러 변경 드롭다운 (Figma colorPicker-dropdown)
 *
 * - 팔레트 버튼 터치: 버튼 자리에서 회색 알약이 아래로 늘어나고(300ms), 컬러칩이 위에서부터 차례로 나타남
 *   (맨 위 Default 칩 = 흰 배경 + 팔레트 아이콘 → 선택 상태 표시. 펼친 알약이 원래 버튼을 덮으므로 닫기 역할도 함)
 * - Default 칩 터치 / 컬러칩 선택 / close() 호출: 칩이 아래부터 사라지고 알약이 버튼 크기로 줄어듦(220ms)
 *
 * - 펼친 상태에서 드롭다운 바깥을 누르면 닫힘
 *
 * 만들기: createColorDropdown(container, { onSelect }) → 팔레트 버튼 + 알약 마크업을 만들고 ColorDropdown을 돌려줌
 *   칩 = m3-theme.js의 M3_CHIP_THEMES 순서, 칩 색 = 각 테마의 Primary
 * 위치는 서비스 CSS에서 .cp 에 지정 (예: position:absolute; right:20px; top:20px)
 */
import { DECEL, ACCEL } from './motion-tokens.js';
import { M3_THEMES, M3_CHIP_THEMES } from './m3-theme.js';

const PALETTE_ICON = '<svg viewBox="0 0 10 10" aria-hidden="true"><path fill-rule="evenodd" d="M4.91221 0.416664C7.32108 0.416664 9.40791 2.22939 9.582 4.67054L9.58208 4.67116C9.65921 5.77646 9.03016 6.94604 7.80146 7.17416C7.30254 7.26679 6.77529 7.16612 6.28371 7.30087C6.15533 7.33604 6.07787 7.44475 6.17254 7.56162C6.41271 7.85816 6.7215 8.08008 6.7215 8.50508C6.7215 8.725 6.66929 8.93067 6.54821 9.10504C6.23562 9.55508 5.62875 9.58333 5.13183 9.58333C2.70635 9.58333 0.423172 7.53316 0.423172 4.91758C0.423172 2.44314 2.43155 0.469747 4.90654 0.419502L4.91221 0.416664ZM5.0065 1.25186C2.92856 1.25018 1.25651 2.88749 1.25651 4.91758C1.25651 7.04241 3.13548 8.75 5.13183 8.75C5.44204 8.75 5.65491 8.73354 5.78662 8.68C5.85887 8.65062 5.92329 8.57471 5.88262 8.49104C5.80571 8.33271 5.63429 8.22108 5.52496 8.08612C5.31366 7.82525 5.24079 7.48362 5.33762 7.16871C5.43695 6.84562 5.69987 6.59679 6.06341 6.49716C6.58421 6.35446 7.12525 6.45212 7.64937 6.35483C8.35666 6.2235 8.80645 5.52771 8.75075 4.72929C8.59891 2.60497 6.87325 1.25336 5.0065 1.25186Z"/><circle cx="2.7" cy="4.64" r=".57"/><circle cx="3.93" cy="2.92" r=".57"/><circle cx="6.08" cy="2.92" r=".57"/><circle cx="7.3" cy="4.64" r=".57"/></svg>';

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
    document.addEventListener('click', (e) => { if (!this.panel.contains(e.target)) this.close(); }); // 바깥 터치 → 닫힘
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

/**
 * 컬러 드롭다운 만들기: container 안에 [팔레트 버튼 + 알약] 마크업을 만들고 ColorDropdown을 돌려줌
 * @param {HTMLElement} container
 * @param {{ themes?: string[], onSelect?: (theme: string) => void, label?: string }} options
 *   themes: 칩으로 보여줄 테마 이름 (기본 M3_CHIP_THEMES) / onSelect: 고른 테마 이름 / label: 팔레트 버튼 접근성 이름
 */
export function createColorDropdown(container, { themes = M3_CHIP_THEMES, onSelect, label = '결제창 컬러 변경' } = {}) {
  const root = document.createElement('div');
  root.className = 'cp';
  root.innerHTML = `<button class="cp-trigger" type="button">${PALETTE_ICON}</button>`
    + `<div class="cp-panel" hidden><button class="cp-default" type="button" aria-label="닫기">${PALETTE_ICON}</button></div>`;
  const trigger = root.querySelector('.cp-trigger');
  trigger.setAttribute('aria-label', label);
  const panel = root.querySelector('.cp-panel');
  panel.append(...themes.map((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cp-chip';
    b.dataset.color = name; // = m3-theme.css 테마 이름
    b.setAttribute('aria-label', name);
    b.style.setProperty('--c', M3_THEMES[name].Primary);
    return b;
  }));
  container.append(root);
  return new ColorDropdown(trigger, panel, { onSelect });
}
