/**
 * AI 추천 결제창 모션 모듈 (한 곳에서 가져오기)
 *
 * JS:  import { createAIButton, createAIChat, GenerationReveal, createColorDropdown, setM3Theme, bindAIRecommend } from './ai-reveal-motion/src/index.js';
 * CSS: index.css 하나만 불러오면 됨 (모듈 CSS 전부 포함)
 */
export { createAIButton, AIButton } from './ai-button.js';
export { createAIChat, AIChatPanel, CHAT_DEFAULTS } from './ai-chat.js';
export { GenerationReveal, REVEAL_DEFAULTS } from './generation-reveal.js';
export { createColorDropdown, ColorDropdown } from './color-dropdown.js';
export { M3_THEMES, M3_CHIP_THEMES, M3_ROLE_VARS, setM3Theme } from './m3-theme.js';
export { bindAIRecommend } from './ai-recommend.js';
export * from './motion-tokens.js';
