import React, { useEffect, useRef } from "react";

export type MotionPaletteKey = "toss" | "deepblue" | "mint" | "gold";

export interface PaymentCapsuleMotionProps {
  /** 렌더링 크기(px). 기본값 160 */
  size?: number;
  /** 컬러 테마 프리셋. 기본값 "toss" */
  palette?: MotionPaletteKey;
  /**
   * 제어 모드 여부:
   * - undefined (기본값): 마운트 시 1.3초 원샷(로딩 -> 체크 완료)으로 자동 재생
   * - false: 3D 실린더 & 쫀득 캡슐 로딩을 무한 유지 (API 응답 대기 중)
   * - true: 로딩 상태에서 즉시 캡슐 중앙 합체 -> 하단 서클 라이징 -> 체크 드로잉으로 완료 전환
   */
  isCompleted?: boolean;
  /** 체크 드로잉까지 모두 완료되었을 때 호출되는 콜백 */
  onComplete?: () => void;
}

const PALETTES: Record<
  MotionPaletteKey,
  {
    startRim: string;
    startFace: string;
    startSym: string;
    midSym: string;
    endRim: string;
    endFace: string;
    endSym: string;
    symShadow: string;
    edge1: string;
    edge2: string;
    edge3: string;
    circle: string;
    check: string;
  }
> = {
  toss: {
    startRim: "#d5d8de",
    startFace: "#e2e5eb",
    startSym: "#4b5563",
    midSym: "#2563eb",
    endRim: "#93c5fd",
    endFace: "#dbeafe",
    endSym: "#2563eb",
    symShadow: "#60a5fa",
    edge1: "#93c5fd",
    edge2: "#eff6ff",
    edge3: "#60a5fa",
    circle: "#3182f6",
    check: "#ffffff",
  },
  deepblue: {
    startRim: "#cbd5e1",
    startFace: "#e2e8f0",
    startSym: "#334155",
    midSym: "#1d4ed8",
    endRim: "#60a5fa",
    endFace: "#bfdbfe",
    endSym: "#1e40af",
    symShadow: "#3b82f6",
    edge1: "#60a5fa",
    edge2: "#dbeafe",
    edge3: "#3b82f6",
    circle: "#1d4ed8",
    check: "#ffffff",
  },
  mint: {
    startRim: "#d5dad8",
    startFace: "#e2e7e5",
    startSym: "#4b5563",
    midSym: "#0d9488",
    endRim: "#6ee7b7",
    endFace: "#d1fae5",
    endSym: "#059669",
    symShadow: "#34d399",
    edge1: "#6ee7b7",
    edge2: "#ecfdf5",
    edge3: "#34d399",
    circle: "#10b981",
    check: "#ffffff",
  },
  gold: {
    startRim: "#d4d5d7",
    startFace: "#dedfe1",
    startSym: "#3f434a",
    midSym: "#63392b",
    endRim: "#e6cf83",
    endFace: "#f3e19e",
    endSym: "#de6b15",
    symShadow: "#b89855",
    edge1: "#e5cd65",
    edge2: "#f7ea9c",
    edge3: "#d4b84c",
    circle: "#fae62d",
    check: "#0b0b0b",
  },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function lerpColor(hex1: string, hex2: string, t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  const c1 = parseInt(hex1.slice(1), 16);
  const c2 = parseInt(hex2.slice(1), 16);
  const r = Math.round(lerp((c1 >> 16) & 255, (c2 >> 16) & 255, clamped));
  const g = Math.round(lerp((c1 >> 8) & 255, (c2 >> 8) & 255, clamped));
  const b = Math.round(lerp(c1 & 255, c2 & 255, clamped));
  return `rgb(${r}, ${g}, ${b})`;
}

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutBack(x: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function buildCapsulesMarkup(color: string, t: number, mergeP: number) {
  const phases = [0, 1.2, 2.4];
  const baseXs = [-27, 0, 27];
  let html = "";
  for (let i = 0; i < 3; i++) {
    const s = Math.sin(t * 12.5 - phases[i]);
    const stretch = Math.abs(Math.cos(t * 12.5 - phases[i]));
    const x = lerp(baseXs[i], 0, mergeP);
    const y = lerp(s * 9, 10, mergeP);
    const w = lerp(16 - stretch * 3.5, 16, mergeP);
    const h = lerp(16 + stretch * 14, 16, mergeP);
    const rx = w / 2;
    html += `<rect x="${(x - w / 2).toFixed(1)}" y="${(y - h / 2).toFixed(
      1
    )}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx.toFixed(
      1
    )}" fill="${color}" />`;
  }
  return html;
}

export default function PaymentCapsuleMotion({
  size = 160,
  palette = "toss",
  isCompleted,
  onComplete,
}: PaymentCapsuleMotionProps) {
  const cylGroupRef = useRef<SVGGElement>(null);
  const backCapRef = useRef<SVGEllipseElement>(null);
  const sideRectRef = useRef<SVGRectElement>(null);
  const frontRimRef = useRef<SVGEllipseElement>(null);
  const frontFaceRef = useRef<SVGEllipseElement>(null);
  const innerGroupRef = useRef<SVGGElement>(null);
  const capsShadowRef = useRef<SVGGElement>(null);
  const capsMainRef = useRef<SVGGElement>(null);
  const sheenElRef = useRef<SVGEllipseElement>(null);
  const riseCircleRef = useRef<SVGCircleElement>(null);
  const checkPathRef = useRef<SVGPathElement>(null);
  const e1Ref = useRef<SVGStopElement>(null);
  const e2Ref = useRef<SVGStopElement>(null);
  const e3Ref = useRef<SVGStopElement>(null);
  const e4Ref = useRef<SVGStopElement>(null);

  const startRef = useRef<number | null>(null);
  const finishTriggerRef = useRef<number | null>(null);
  const completedCallbackFired = useRef(false);

  useEffect(() => {
    if (isCompleted === true && finishTriggerRef.current === null && startRef.current !== null) {
      finishTriggerRef.current = (performance.now() - startRef.current) / 1000;
    } else if (isCompleted === false) {
      finishTriggerRef.current = null;
      completedCallbackFired.current = false;
    }
  }, [isCompleted]);

  useEffect(() => {
    const pal = PALETTES[palette];
    let rafId: number;
    const start = performance.now();
    startRef.current = start;
    completedCallbackFired.current = false;

    if (isCompleted === undefined) {
      finishTriggerRef.current = 0.75;
    } else if (isCompleted === true) {
      finishTriggerRef.current = 0.75;
    } else {
      finishTriggerRef.current = null;
    }

    const R = 72;
    const R_INNER = 65.5;
    const THICKNESS = 22;

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const transStart = finishTriggerRef.current;
      const isFinishing = transStart !== null && elapsed >= transStart;
      const finElapsed = isFinishing && transStart !== null ? elapsed - transStart : 0;

      let phi = 0;
      if (isCompleted !== undefined && !isFinishing) {
        const cycle = elapsed % 0.44;
        phi = easeInOutCubic(Math.min(1, cycle / 0.38)) * Math.PI;
      } else {
        if (elapsed > 0.08 && elapsed <= 0.46) {
          phi = easeInOutCubic((elapsed - 0.08) / 0.38) * Math.PI;
        } else if (elapsed > 0.52 && elapsed <= 0.75) {
          phi = easeInOutCubic((elapsed - 0.52) / 0.23) * Math.PI;
        }
      }

      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const absCos = Math.max(0.001, Math.abs(cosPhi));
      const dir = cosPhi >= 0 ? 1 : -1;
      const offset = (THICKNESS / 2) * sinPhi;
      const frontX = 100 + dir * offset;
      const backX = 100 - dir * offset;

      const parallaxX = dir * sinPhi * 5.5;
      const shadowShiftX = -dir * sinPhi * 3.5 + 2;

      const colorT = (elapsed - 0.1) / 0.32;
      const rimColor = lerpColor(pal.startRim, pal.endRim, colorT);
      const faceColor = lerpColor(pal.startFace, pal.endFace, colorT);
      const symColor =
        elapsed < 0.25
          ? lerpColor(pal.startSym, pal.midSym, (elapsed - 0.08) / 0.17)
          : lerpColor(pal.midSym, pal.endSym, (elapsed - 0.25) / 0.15);

      const edgeT = (elapsed - 0.35) / 0.25;
      const cE1 = lerpColor("#d5d7dc", pal.edge1, edgeT);
      const cE2 = lerpColor("#f1f3f6", pal.edge2, edgeT);
      const cE3 = lerpColor("#b8bcc4", pal.edge3, edgeT);

      e1Ref.current?.setAttribute("stop-color", cE1);
      e2Ref.current?.setAttribute("stop-color", cE2);
      e3Ref.current?.setAttribute("stop-color", cE3);
      e4Ref.current?.setAttribute("stop-color", cE1);

      frontRimRef.current?.setAttribute("cx", String(frontX));
      frontRimRef.current?.setAttribute("rx", String(R * absCos));
      frontRimRef.current?.setAttribute("fill", rimColor);

      frontFaceRef.current?.setAttribute("cx", String(frontX));
      frontFaceRef.current?.setAttribute("rx", String(R_INNER * absCos));
      frontFaceRef.current?.setAttribute("fill", faceColor);

      backCapRef.current?.setAttribute("cx", String(backX));
      backCapRef.current?.setAttribute("rx", String(R * absCos));

      sideRectRef.current?.setAttribute("x", String(Math.min(frontX, backX)));
      sideRectRef.current?.setAttribute(
        "width",
        String(Math.max(0.5, Math.abs(frontX - backX)))
      );

      innerGroupRef.current?.setAttribute(
        "transform",
        `translate(${(frontX + parallaxX).toFixed(1)}, 100) scale(${absCos}, 1)`
      );
      capsShadowRef.current?.setAttribute(
        "transform",
        `translate(${shadowShiftX.toFixed(1)}, 2.5)`
      );

      const mergeP =
        transStart !== null
          ? Math.max(0, Math.min(1, (elapsed - (transStart - 0.07)) / 0.15))
          : 0;

      if (capsShadowRef.current) {
        capsShadowRef.current.innerHTML = buildCapsulesMarkup(pal.symShadow, elapsed, mergeP);
      }
      if (capsMainRef.current) {
        capsMainRef.current.innerHTML = buildCapsulesMarkup(symColor, elapsed, mergeP);
      }

      sheenElRef.current?.setAttribute("cx", String(frontX));
      sheenElRef.current?.setAttribute("rx", String(R * absCos));
      sheenElRef.current?.setAttribute("opacity", String(Math.pow(sinPhi, 2) * 0.65));

      riseCircleRef.current?.setAttribute("fill", pal.circle);
      checkPathRef.current?.setAttribute("stroke", pal.check);

      if (!isFinishing) {
        cylGroupRef.current?.setAttribute("opacity", "1");
        riseCircleRef.current?.setAttribute("opacity", "0");
        checkPathRef.current?.setAttribute("opacity", "0");
        checkPathRef.current?.setAttribute("stroke-dashoffset", "72");
      } else {
        const p3 = Math.min(1, finElapsed / 0.22);
        cylGroupRef.current?.setAttribute("opacity", String(Math.max(0, 1 - p3 * 1.15)));

        const easeP3 = easeOutBack(Math.min(1, finElapsed / 0.24));
        riseCircleRef.current?.setAttribute("cy", String(lerp(132, 100, Math.min(1, p3 * 1.1))));
        riseCircleRef.current?.setAttribute(
          "r",
          String(Math.min(73.5, Math.max(24, lerp(30, 72, easeP3))))
        );
        riseCircleRef.current?.setAttribute("opacity", String(Math.min(1, finElapsed / 0.08)));

        if (finElapsed < 0.27) {
          checkPathRef.current?.setAttribute("opacity", "0");
          checkPathRef.current?.setAttribute("stroke-dashoffset", "72");
        } else {
          checkPathRef.current?.setAttribute("opacity", "1");
          const p4 = Math.min(1, (finElapsed - 0.27) / 0.24);
          const easedP4 = 1 - Math.pow(1 - p4, 2.2);
          checkPathRef.current?.setAttribute(
            "stroke-dashoffset",
            String(72 * (1 - easedP4))
          );
        }
      }

      if (!isFinishing || finElapsed < 0.6) {
        rafId = requestAnimationFrame(tick);
      } else if (!completedCallbackFired.current) {
        completedCallbackFired.current = true;
        onComplete?.();
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [palette]);

  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <linearGradient id="pcm-sheen-grad" x1="0%" y1="0%" x2="100%" y2="20%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pcm-edge-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" ref={e1Ref} stopColor="#93c5fd" />
          <stop offset="35%" ref={e2Ref} stopColor="#eff6ff" />
          <stop offset="70%" ref={e3Ref} stopColor="#60a5fa" />
          <stop offset="100%" ref={e4Ref} stopColor="#93c5fd" />
        </linearGradient>
      </defs>

      <g ref={cylGroupRef}>
        <ellipse ref={backCapRef} cx="100" cy="100" rx="72" ry="72" fill="url(#pcm-edge-grad)" />
        <rect ref={sideRectRef} x="100" y="28" width="0" height="144" fill="url(#pcm-edge-grad)" />
        <ellipse ref={frontRimRef} cx="100" cy="100" rx="72" ry="72" fill="#d5d8de" />
        <ellipse ref={frontFaceRef} cx="100" cy="100" rx="65.5" ry="65.5" fill="#e2e5eb" />

        <g ref={innerGroupRef} transform="translate(100, 100)">
          <g ref={capsShadowRef} opacity="0.32" />
          <g ref={capsMainRef} />
        </g>

        <ellipse ref={sheenElRef} cx="100" cy="100" rx="72" ry="72" fill="url(#pcm-sheen-grad)" opacity="0" />
      </g>

      <circle ref={riseCircleRef} cx="100" cy="132" r="30" fill="#3182f6" opacity="0" />

      <path
        ref={checkPathRef}
        d="M 75.5 101.5 L 92.5 118.5 L 125.5 84.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="72"
        strokeDashoffset="72"
        opacity="0"
      />
    </svg>
  );
}
