/**
 * AI Generating Reveal
 *
 * 재생 순서 (play() 한 번)
 *   1. 대기 (waitDuration)  : 스켈레톤이 보이고, 스켈레톤 뒤 배경에서 넓은 빛 덩어리가 천천히 일렁임
 *                             마지막 300ms 동안 상단에서 쓸어내릴 글로우가 켜짐
 *   2. 생성 (duration)      : 울렁이는 글로우 띠가 위→아래로 쓸고 내려감
 *                             지나간 자리는 블러 → 선명으로 실제 콘텐츠가 나타남 (배경 빛도 같이 덮임)
 *   3. 마무리 (fadeOut)     : 글로우가 사라지고 Promise resolve
 *
 * 필요한 레이어 (root 안, 아래 → 위 순서). 클래스는 generation-reveal.css 참고
 *   .rv-skel              스켈레톤. 안에 canvas.rv-ambient(배경 빛)를 맨 처음에 두고, 그 위에 스켈레톤 도형을 그림
 *   .rv-sharp             실제 콘텐츠 (선명)
 *   .rv-blur              비워 둠. play() 때마다 .rv-sharp를 복제해서 블러로 씀
 *   canvas.rv-canvas      쓸어내리는 글로우
 *   (선택) .rv-keep       AI가 바꾸지 않는 부분. 스켈레톤·블러 없이 항상 선명, 글로우만 위로 지나감
 *
 * 콘텐츠를 바꾸는 시점: play() 직전에 .rv-sharp 내용을 새 내용으로 바꾸면 블러·선명 구간에 새 내용이 보임
 */
export const REVEAL_DEFAULTS = {
  waitDuration: 1000, // ms, 스켈레톤 + 배경 빛만 보이는 대기 시간
  duration: 4000, // ms, 위→아래로 쓸어내리는 시간
  fadeOut: 500, // ms, 다 내려간 뒤 글로우가 사라지는 시간

  colors: ['#6c9bff', '#a98bf0', '#b9c8ff'], // 파랑 → 보라 → 연보라 (AI 추천 버튼 색 계열)

  // 스켈레톤 뒤 배경 빛
  ambientAlpha: 0.3, // 0~1, 진하기
  ambientBlur: 50, // px, 블러

  // 쓸어내리는 글로우
  glowAlpha: 1, // 0~1, 진하기
  glowBlur: 39, // px, 블러
  glowHeight: 200, // px, 글로우 띠 높이
  waveAmp: 40, // px, 아래 가장자리 울렁임 세기

  // 콘텐츠
  blurBand: 143, // px, 글로우 바로 위에서 콘텐츠가 블러로 보이는 구간 높이
  contentBlur: 8, // px, 그 구간의 블러 세기
  skeletonOpacity: 1, // 0~1, 스켈레톤 레이어 전체 진하기
};

const easeInOutQuad = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
const mask = (node, stops) => {
  const g = stops ? `linear-gradient(to bottom, ${stops})` : '';
  node.style.webkitMaskImage = g;
  node.style.maskImage = g;
};

export class GenerationReveal {
  /**
   * @param {HTMLElement} root  .rv-root 요소
   * @param {Partial<typeof REVEAL_DEFAULTS>} options
   */
  constructor(root, options = {}) {
    this.o = { ...REVEAL_DEFAULTS, ...options };
    this.root = root;
    this.skel = root.querySelector('.rv-skel');
    this.sharp = root.querySelector('.rv-sharp');
    this.blur = root.querySelector('.rv-blur');
    this.canvas = root.querySelector('.rv-canvas');
    this.amb = root.querySelector('.rv-ambient');
    this.ctx = this.canvas.getContext('2d');
    this.actx = this.amb.getContext('2d');
    this.raf = 0;
    this.done = null;
    root.style.setProperty('--rv-content-blur', `${this.o.contentBlur}px`);
    new ResizeObserver(() => this.resize()).observe(root);
    this.resize();
    this.finish();
  }

  /** 재생. 끝나면 resolve. prefers-reduced-motion이면 바로 최종 상태 */
  play() {
    this.finish();
    // 블러 레이어를 지금의 선명 레이어 내용으로 다시 채움 → 재생 직전에 내용을 바꿔도 블러 구간에 새 내용이 보임
    this.blur.replaceChildren(...[...this.sharp.childNodes].map((n) => n.cloneNode(true)));
    this.skel.style.opacity = this.o.skeletonOpacity;
    this.skel.hidden = false;
    this.blur.hidden = false;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.finish();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.done = resolve;
      this.t0 = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    });
  }

  /** 즉시 중단하고 최종 상태(선명한 콘텐츠)로 */
  stop() {
    this.finish();
  }

  resize() {
    const dpr = devicePixelRatio || 1;
    this.W = this.root.clientWidth;
    this.H = this.root.clientHeight;
    for (const [cv, cx] of [[this.canvas, this.ctx], [this.amb, this.actx]]) {
      cv.width = this.W * dpr;
      cv.height = this.H * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  finish() {
    cancelAnimationFrame(this.raf);
    mask(this.sharp, null);
    this.blur.hidden = true;
    this.skel.hidden = true;
    this.ctx.clearRect(0, 0, this.W || 0, this.H || 0);
    this.actx.clearRect(0, 0, this.W || 0, this.H || 0);
    const r = this.done;
    this.done = null;
    r?.();
  }

  /** 스켈레톤 뒤 배경 빛: 큰 빛 덩어리(colors 개수만큼)가 영역 전체를 천천히 떠다님 */
  drawAmbient(t, fade) {
    const { actx: c, W, H, o } = this;
    c.clearRect(0, 0, W, H);
    c.save();
    c.filter = `blur(${o.ambientBlur}px)`;
    c.globalAlpha = o.ambientAlpha * fade;
    o.colors.forEach((col, i) => {
      const x = W * (0.5 + 0.38 * Math.sin(t * 0.9 + i * 2.1));
      const y = H * (0.5 + 0.36 * Math.sin(t * 0.7 + i * 1.7 + 1));
      const r = Math.max(W, H) * (0.42 + 0.06 * Math.sin(t * 1.3 + i));
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    });
    c.restore();
  }

  /** 글로우 띠 아래쪽 물결선: 서로 다른 주기의 사인파 3개를 겹쳐 일렁임 */
  waveY(x, t, edge) {
    const a = this.o.waveAmp;
    return edge + a * (0.6 * Math.sin(x * 0.013 + t * 2.3) + 0.4 * Math.sin(x * 0.031 - t * 3.4) + 0.25 * Math.sin(x * 0.055 + t * 1.3));
  }

  /** 쓸어내리는 글로우: 물결 모양 아래 가장자리, 색은 가로로 계속 흐름(초당 70px), 위쪽은 투명하게 */
  drawGlow(t, edge, alpha) {
    const { ctx, W, H, o } = this;
    ctx.clearRect(0, 0, W, H);
    if (alpha <= 0.01) return;
    const gh = o.glowHeight;
    ctx.save();
    ctx.filter = `blur(${o.glowBlur}px)`;
    const cols = [...o.colors, ...o.colors, o.colors[0]];
    const off = -((t * 70) % W);
    const hg = ctx.createLinearGradient(off, 0, off + W * 2, 0);
    cols.forEach((c, i) => hg.addColorStop(i / (cols.length - 1), c));
    ctx.beginPath();
    ctx.moveTo(-60, edge - gh);
    for (let x = -60; x <= W + 60; x += 6) ctx.lineTo(x, this.waveY(x, t, edge));
    ctx.lineTo(W + 60, edge - gh);
    ctx.closePath();
    ctx.fillStyle = hg;
    ctx.globalAlpha = alpha * o.glowAlpha * 0.8;
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    const vg = ctx.createLinearGradient(0, edge - gh, 0, edge + o.waveAmp);
    vg.addColorStop(0, 'rgba(0,0,0,1)');
    vg.addColorStop(0.75, 'rgba(0,0,0,0)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, edge - gh - 80, W, gh + 80);
    ctx.restore();
  }

  frame = (now) => {
    const { o, H } = this;
    const t = now / 1000;
    const el = now - this.t0;
    const band = o.blurBand;
    let edge;
    let alpha = 1;
    this.drawAmbient(t, Math.min(1, el / 300)); // 처음 300ms 동안 켜짐
    if (el < o.waitDuration) {
      edge = -10;
      alpha = Math.max(0, (el - (o.waitDuration - 300)) / 300);
      mask(this.sharp, 'transparent 0, transparent 100%');
      mask(this.blur, 'transparent 0, transparent 100%');
    } else {
      const run = el - o.waitDuration;
      const p = Math.min(1, run / o.duration);
      edge = -10 + easeInOutQuad(p) * (H + band + 50); // 글로우 가장자리 위치
      if (p >= 1) {
        alpha = Math.max(0, 1 - (run - o.duration) / o.fadeOut);
        if (alpha === 0) return this.finish();
      }
      // 선명: 가장자리보다 band 위쪽까지 / 블러: 가장자리 바로 위 band 구간
      mask(this.sharp, `#000 ${edge - band}px, transparent ${edge - band * 0.4}px`);
      mask(this.blur, `transparent ${edge - band * 1.1}px, #000 ${edge - band * 0.6}px, #000 ${edge - 6}px, transparent ${edge + 10}px`);
    }
    this.drawGlow(t, edge, alpha);
    this.raf = requestAnimationFrame(this.frame);
  };
}
