"""
M3 테마 토큰 만들기: tools/figma-palette-light.json → src/m3-theme.css / .json / .js

figma-palette-light.json = Figma 변수 컬렉션 'M3 · Palette'의 Light 값 (테마 이름 → 역할 → 색)
Figma에서 팔레트 값을 바꾸면 이 JSON을 같이 고치고 다시 실행:  python tools/gen-m3-theme.py
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(os.path.join(ROOT, "tools", "figma-palette-light.json"), encoding="utf-8"))

ROLES = ["Primary", "Outline Variant Pressed", "On Primary", "Primary Container", "On Primary Container",
         "Background", "Surface", "On Surface", "On Surface Variant", "Outline Variant",
         "Surface Container Lowest", "Surface Container Low", "Surface Container"]
THEMES = ["Baseline", "Green", "Monochrome", "Pink", "Mint", "Orange", "Blue", "Rose"]
CHIP_THEMES = ["Baseline", "Green", "Monochrome", "Pink", "Mint", "Orange", "Blue"]  # 컬러 드롭다운 칩 순서 (Figma colorPicker-dropdown)
for n in P:
    P[n]["Outline Variant Pressed"] = P[n]["Primary"]  # Figma M3 · Theme: Outline Variant Pressed = Primary 별칭
var = lambda r: "--md-sys-color-" + r.lower().replace(" ", "-")

# ---- CSS
lines = ["/* =========================================================",
         "   M3 색상 테마 토큰 (라이트 모드만) — tools/gen-m3-theme.py 로 만든 파일, 직접 고치지 말 것",
         "   출처: Figma 변수 컬렉션",
         "     - M3 · Palette : 테마별 실제 색상값 (Schemes/<역할>/Light)",
         "     - M3 · Theme   : 역할별 색상 (Schemes/<역할>) → 이 파일의 --md-sys-color-<역할>",
         "   사용: 결제창 루트에 data-m3-theme=\"Pink\" 처럼 테마 이름을 붙이면 아래 변수가 바뀜 (m3-theme.js의 setM3Theme)",
         "         요소 색은 var(--md-sys-color-<역할>, <기존 색>) 처럼 기존 색을 두 번째 값으로 둘 것",
         "         → 테마를 고르지 않았을 때는 이 파일이 아무 값도 정하지 않아 기존 서비스 색이 그대로 나옴",
         "   테마 이름 = 컬러 드롭다운 칩 이름 (Rose는 AI 추천 프리셋용, 칩 없음)",
         "   ========================================================= */",
         ""]
for name in THEMES:
    lines.append(f'[data-m3-theme="{name}"] {{')
    lines += [f"  {var(r)}: {P[name][r]};" for r in ROLES]
    lines += ["}", ""]
open(os.path.join(ROOT, "src", "m3-theme.css"), "w", encoding="utf-8", newline="\n").write("\n".join(lines))

# ---- JSON (CSS가 아닌 환경용)
data = {"source": "Figma M3 · Palette (Light)", "roles": {r: var(r) for r in ROLES},
        "chipThemes": CHIP_THEMES, "themes": {n: P[n] for n in THEMES}}
open(os.path.join(ROOT, "src", "m3-theme.json"), "w", encoding="utf-8", newline="\n").write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")

# ---- JS
js = f"""/**
 * M3 색상 테마 (라이트 모드) — tools/gen-m3-theme.py 로 만든 파일, 직접 고치지 말 것
 * 색 값은 m3-theme.css 와 같음. JS에서 테마 목록·칩 색이 필요할 때 사용
 */

/** 테마 이름 → 역할 → 색 */
export const M3_THEMES = {json.dumps({n: P[n] for n in THEMES}, ensure_ascii=False, indent=2)};

/** 컬러 드롭다운 칩 순서 (Figma colorPicker-dropdown). Rose는 AI 추천 프리셋용이라 칩에 없음 */
export const M3_CHIP_THEMES = {json.dumps(CHIP_THEMES)};

/** 역할 → CSS 변수 이름 */
export const M3_ROLE_VARS = {json.dumps({r: var(r) for r in ROLES}, ensure_ascii=False, indent=2)};

/**
 * 요소에 테마 적용 (data-m3-theme 속성). 이름이 없으면 테마 해제 → 기존 서비스 색
 * @param {{HTMLElement}} el
 * @param {{string | null}} name
 */
export function setM3Theme(el, name) {{
  if (name) el.dataset.m3Theme = name;
  else delete el.dataset.m3Theme;
}}
"""
open(os.path.join(ROOT, "src", "m3-theme.js"), "w", encoding="utf-8", newline="\n").write(js)
print("ok")
