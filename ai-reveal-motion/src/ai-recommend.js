/**
 * AI 추천 버튼 ↔ AI 채팅창 ↔ Generating Reveal 연결
 *
 * 버튼 터치
 *   → press()              눌림 (130ms 뒤 다음 단계)
 *   → chat.run()           (chat을 넘긴 경우) 채팅창 열림 → 요청 자동 타이핑 → 보내기 → 생각 중 → 결과
 *        └ 보낸 직후 startLoading()   버튼 글자 사라지고 동그란 별 버튼으로 줄어듦
 *     (chat이 없으면 바로 startLoading())
 *   → 아래를 겹쳐서 실행 (급하게 끊기지 않게)
 *        chat.close()       채팅창이 접히며 닫힘
 *        reveal.capture()   지금 화면을 잡아 둠
 *        onBeforeReveal()   ★ 결제창 내용을 AI 추천 결과로 교체하는 자리 (서비스: API 응답 반영, 스켈레톤 준비)
 *        reveal.play()      잡아 둔 화면이 서서히 사라지며 스켈레톤 → 글로우가 쓸고 내려가며 새 내용 등장
 *          └ onSweepStart() ★ 글로우가 쓸기 시작하는 순간 (Reveal 영역 밖 요소 — 헤더 색·로고 — 를 바꾸는 자리)
 *   → onAfterReveal()      ★ Reveal이 다 끝난 뒤 (테마를 화면 전체로 옮기는 등 마무리)
 *   → 버튼: once면 hide()로 사라짐, 아니면 stopLoading()으로 원래 버튼
 *
 * 채팅창을 X·바깥 터치로 닫으면 Reveal 없이 버튼만 원래대로 돌아감
 * 재생 중에는 다시 눌러도 무시
 *
 * @param {import('./ai-button.js').AIButton} button
 * @param {import('./generation-reveal.js').GenerationReveal} reveal
 * @param {{
 *   chat?: import('./ai-chat.js').AIChatPanel,
 *   prompt?: string | (() => string),
 *   steps?: { loading: string, done: string }[] | (() => { loading: string, done: string }[]),
 *   onBeforeReveal?: () => any,
 *   onSweepStart?: () => any,
 *   onAfterReveal?: () => any,
 *   once?: boolean,
 * }} options
 * @returns {{ reset: () => void }}  reset(): 진행 중이던 것을 모두 멈추고 버튼을 처음 상태로 (화면 초기화용)
 */
export function bindAIRecommend(button, reveal, { chat, prompt, steps = [], onBeforeReveal, onSweepStart, onAfterReveal, once = false } = {}) {
  let busy = false;
  let applied = false; // once: 추천이 한 번 적용되면 버튼이 사라짐
  let run = 0; // reset()으로 끊긴 진행인지 구분
  button.btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (busy || (once && applied)) return;
    busy = true;
    const id = ++run;
    let loading = false;
    const startLoading = () => { loading = true; button.startLoading(); };
    try {
      await button.press();
      let closing;
      if (chat) {
        // prompt · steps가 함수면 누르는 순간 값을 읽음 (언어 전환 등으로 대사가 바뀌는 경우)
        const p = typeof prompt === 'function' ? prompt() : prompt;
        const st = typeof steps === 'function' ? steps() : steps;
        const done = await chat.run({ prompt: p, steps: st, onSent: startLoading, close: false });
        if (!done || id !== run) return; // X·바깥 터치로 닫힘 → Reveal 없이 버튼만 원래대로 (finally)
        closing = chat.close(); // 채팅창이 닫히는 동안 아래에서 화면이 스켈레톤으로 넘어가기 시작 (겹쳐서 실행)
      } else startLoading();
      reveal.capture(); // 바뀌기 전 화면을 잡아 둠 → 시작할 때 서서히 사라짐
      await onBeforeReveal?.();
      const playing = reveal.play({ onSweepStart });
      await closing;
      await playing;
      if (id !== run) return;
      await onAfterReveal?.();
      applied = true;
    } finally {
      if (id === run) {
        if (applied && once) await button.hide(); // 적용 완료 → 버튼 사라짐
        else if (loading) await button.stopLoading(); // 로딩 중이었으면 원래 버튼으로
        busy = false;
      }
    }
  });
  return {
    reset() {
      run++;
      busy = false;
      applied = false;
      chat?.forceClose();
      reveal.stop();
      button.show();
    },
  };
}
