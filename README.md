# 페이버스 결제창 핸드오프

코리아 핀테크위크 결제창 관련 핸드오프 자료입니다. 서로 독립적이라 필요한 폴더만 쓰면 됩니다.

| 폴더 | 내용 | 용도 |
|---|---|---|
| [`booth-motion/`](booth-motion/) | 부스 터치 화면 1 → 8 인트로 흐름 (결제창 체험 전 단계, KR/EN) | 부스 키오스크 앱(Electron)에 띄우는 체험 전 화면 |
| [`video-mockup/`](video-mockup/) | 부스 영상용 결제 흐름 목업 (KR/EN, 결제 진행 중·완료 3D 캡슐 모션 포함) | 부스 키오스크 앱(Electron)에 그대로 띄우는 화면 |
| [`ai-reveal-motion/`](ai-reveal-motion/) | AI 추천 버튼 + AI Generating Reveal 모션, 결제창 컬러 변경 드롭다운, M3 색상 테마 토큰 | 실제 서비스 코드에 옮겨 넣을 모션 참고 구현 |

각 폴더의 README에 실행 방법과 연결 방법이 있습니다.

## 로컬에서 보기

```bash
python -m http.server 8770
```
- 부스 터치 화면: http://localhost:8770/booth-motion/
- 영상용 목업: http://localhost:8770/video-mockup/ (`?lang=en`으로 영어)
- AI 모션 데모: http://localhost:8770/ai-reveal-motion/demo/
