/**
 * AI 추천 버튼 ↔ Generating Reveal 연결
 *
 * 버튼 터치
 *   → press()            눌림 (130ms 뒤 다음 단계)
 *   → startLoading()     글자 사라지고 동그란 별 버튼으로 줄어듦
 *   → onBeforeReveal()   ★ 여기서 결제창 내용을 AI 추천 결과로 교체 (서비스에서는 API 응답을 반영하는 자리)
 *   → reveal.play()      스켈레톤 → 글로우가 쓸고 내려가며 새 내용이 나타남
 *   → stopLoading()      원래 버튼으로 복귀
 * 재생 중에는 다시 눌러도 무시
 */
export function bindAIRecommend(button, reveal, { onBeforeReveal } = {}) {
  let busy = false;
  button.btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (busy) return;
    busy = true;
    try {
      await button.press();
      button.startLoading();
      await onBeforeReveal?.();
      await reveal.play();
    } finally {
      await button.stopLoading();
      busy = false;
    }
  });
}
