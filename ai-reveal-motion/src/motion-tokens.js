/**
 * 공통 이징 (모든 모듈이 같은 값을 씀)
 * - SPRING: 살짝 튕기며 멈춤 (Figma GENTLE, bounce 0.25 근사)
 * - DECEL : 빠르게 출발해 부드럽게 멈춤 (등장·펼침)
 * - ACCEL : 천천히 출발해 빠르게 사라짐 (퇴장·접힘)
 * - EASE_OUT / EASE_IN_OUT: 일반 감속 / 가감속
 */
export const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
export const DECEL = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const ACCEL = 'cubic-bezier(0.55, 0, 1, 0.45)';
export const EASE_OUT = 'cubic-bezier(0, 0, 0.58, 1)';
export const EASE_IN_OUT = 'cubic-bezier(0.42, 0, 0.58, 1)';
