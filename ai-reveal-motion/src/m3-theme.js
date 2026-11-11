/**
 * M3 색상 테마 (라이트 모드) — tools/gen-m3-theme.py 로 만든 파일, 직접 고치지 말 것
 * 색 값은 m3-theme.css 와 같음. JS에서 테마 목록·칩 색이 필요할 때 사용
 */

/** 테마 이름 → 역할 → 색 */
export const M3_THEMES = {
  "Baseline": {
    "Primary": "#7049d9",
    "On Primary": "#ffffff",
    "Primary Container": "#efe4ff",
    "On Primary Container": "#4f378a",
    "Background": "#fef7ff",
    "Surface": "#f5f2ff",
    "On Surface": "#1d1b20",
    "On Surface Variant": "#49454f",
    "Outline Variant": "#efe9f5",
    "Surface Container Lowest": "#ffffff",
    "Surface Container Low": "#fdfaff",
    "Surface Container": "#f3edf7",
    "Outline Variant Pressed": "#7049d9"
  },
  "Green": {
    "Primary": "#28a415",
    "On Primary": "#ffffff",
    "Primary Container": "#e0f0e2",
    "On Primary Container": "#17472d",
    "Background": "#f7fcf7",
    "Surface": "#f3fff2",
    "On Surface": "#1d2523",
    "On Surface Variant": "#526257",
    "Outline Variant": "#eaf3ec",
    "Surface Container Lowest": "#ffffff",
    "Surface Container Low": "#f9fff8",
    "Surface Container": "#e1eedf",
    "Outline Variant Pressed": "#28a415"
  },
  "Monochrome": {
    "Primary": "#000000",
    "On Primary": "#e2e2e2",
    "Primary Container": "#fafafa",
    "On Primary Container": "#000000",
    "Background": "#f9f9f9",
    "Surface": "#f2f2f2",
    "On Surface": "#1b1b1b",
    "On Surface Variant": "#474747",
    "Outline Variant": "#eaeaea",
    "Surface Container Lowest": "#ffffff",
    "Surface Container Low": "#f0f0f0",
    "Surface Container": "#eeeeee",
    "Outline Variant Pressed": "#000000"
  },
  "Pink": {
    "Primary": "#df267b",
    "On Primary": "#ffffff",
    "Primary Container": "#ffd6ea",
    "On Primary Container": "#7a1d4f",
    "Background": "#fff4fa",
    "Surface": "#ffecf6",
    "On Surface": "#24161e",
    "On Surface Variant": "#5c3f50",
    "Outline Variant": "#f5dfeb",
    "Surface Container Lowest": "#ffffff",
    "Surface Container Low": "#fff6fb",
    "Surface Container": "#f9dcec",
    "Outline Variant Pressed": "#df267b"
  },
  "Mint": {
    "Primary": "#0093a0",
    "On Primary": "#ffffff",
    "Primary Container": "#e4f5f0",
    "On Primary Container": "#004e41",
    "Background": "#f4fcf9",
    "Surface": "#f2feff",
    "On Surface": "#1d2523",
    "On Surface Variant": "#4d655d",
    "Outline Variant": "#e3edea",
    "Surface Container Lowest": "#ffffff",
    "Surface Container Low": "#f8feff",
    "Surface Container": "#d8f0e8",
    "Outline Variant Pressed": "#0093a0"
  },
  "Orange": {
    "Primary": "#f7931e",
    "On Primary": "#ffffff",
    "Primary Container": "#fff0d6",
    "On Primary Container": "#7a4100",
    "Background": "#fffaf2",
    "Surface": "#fff7e8",
    "On Surface": "#221b12",
    "On Surface Variant": "#54473a",
    "Outline Variant": "#f3ece0",
    "Surface Container Lowest": "#ffffff",
    "Surface Container Low": "#fffcf5",
    "Surface Container": "#fff0d9",
    "Outline Variant Pressed": "#f7931e"
  },
  "Blue": {
    "Primary": "#2b5893",
    "On Primary": "#ffffff",
    "Primary Container": "#e1ecfa",
    "On Primary Container": "#143c6b",
    "Background": "#f7faff",
    "Surface": "#f2f7ff",
    "On Surface": "#1d2523",
    "On Surface Variant": "#536174",
    "Outline Variant": "#ebeef2",
    "Surface Container Lowest": "#ffffff",
    "Surface Container Low": "#f5f9ff",
    "Surface Container": "#dde4ed",
    "Outline Variant Pressed": "#2b5893"
  },
  "Rose": {
    "Primary": "#b04f5c",
    "On Primary": "#ffffff",
    "Primary Container": "#f6dfe1",
    "On Primary Container": "#6b2f38",
    "Background": "#fcf7f6",
    "Surface": "#f9eeee",
    "On Surface": "#241a1b",
    "On Surface Variant": "#6b5254",
    "Outline Variant": "#eee2e2",
    "Surface Container Lowest": "#ffffff",
    "Surface Container Low": "#fdf9f8",
    "Surface Container": "#f3e3e3",
    "Outline Variant Pressed": "#b04f5c"
  }
};

/** 컬러 드롭다운 칩 순서 (Figma colorPicker-dropdown). Rose는 AI 추천 프리셋용이라 칩에 없음 */
export const M3_CHIP_THEMES = ["Baseline", "Green", "Monochrome", "Pink", "Mint", "Orange", "Blue"];

/** 역할 → CSS 변수 이름 */
export const M3_ROLE_VARS = {
  "Primary": "--md-sys-color-primary",
  "Outline Variant Pressed": "--md-sys-color-outline-variant-pressed",
  "On Primary": "--md-sys-color-on-primary",
  "Primary Container": "--md-sys-color-primary-container",
  "On Primary Container": "--md-sys-color-on-primary-container",
  "Background": "--md-sys-color-background",
  "Surface": "--md-sys-color-surface",
  "On Surface": "--md-sys-color-on-surface",
  "On Surface Variant": "--md-sys-color-on-surface-variant",
  "Outline Variant": "--md-sys-color-outline-variant",
  "Surface Container Lowest": "--md-sys-color-surface-container-lowest",
  "Surface Container Low": "--md-sys-color-surface-container-low",
  "Surface Container": "--md-sys-color-surface-container"
};

/**
 * 요소에 테마 적용 (data-m3-theme 속성). 이름이 없으면 테마 해제 → 기존 서비스 색
 * @param {HTMLElement} el
 * @param {string | null} name
 */
export function setM3Theme(el, name) {
  if (name) el.dataset.m3Theme = name;
  else delete el.dataset.m3Theme;
}
