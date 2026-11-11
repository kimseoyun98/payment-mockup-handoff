# 3D Cylinder + Elastic Capsule Payment Motion (`PaymentCapsuleMotion`)

결제·송금 화면에서 **송금 진행 중(3D 실린더 스핀 + 쫀득 캡슐 스트레치 웨이브)** 상태부터 **송금 완료(캡슐 중앙 합체 + 하단 서클 라이징 + 체크 드로잉)**까지 Lottie 없이 순수 SVG 직교 3D 투영(Orthographic Cylinder Projection)으로 구현한 마이크로 인터랙션입니다.

## 모션 4단계 구성 (Keyframe Spec)

| 단계 | 시간 구간 | 설명 |
| :--- | :--- | :--- |
| **Phase 1. 1차 3D 스핀 & 컬러 전환** | `0.00s ~ 0.46s` | 쿨그레이(`#E2E5EB`) 3D 원통이 두께감(`22px`)과 하이라이트(Sheen)를 드러내며 180° 회전, 스카이 블루로 워밍업 |
| **Phase 2. 쫀득 캡슐 스트레치 & 2차 스핀** | `0.46s ~ 0.75s` | Z축 시차(Parallax)가 적용된 3개의 캡슐이 Squash & Stretch 텐션으로 물결치며 2차 가속 스핀 |
| **Phase 3. 캡슐 중앙 합체 + 서클 라이징** | `0.75s ~ 1.00s` | 3개의 캡슐이 중앙으로 합쳐지는 동시에 하단(`cy: 132 -> 100`)에서 완료 서클(`#3182F6`)이 `easeOutBack` 탄성으로 솟아오름 |
| **Phase 4. 체크 마크 스트로크 드로잉** | `1.00s ~ 1.28s` | 둥근 끝단(`stroke-linecap="round"`)의 체크 마크가 좌측 끝 점부터 우측 상단까지 `stroke-dashoffset`으로 그려짐 |

## 파일 구성

- `index.html`: 브라우저에서 바로 열어 원샷 재생, 실제 API 대기→완료 시뮬레이션, 4가지 컬러 테마를 테스트할 수 있는 인터랙티브 데모 페이지
- `PaymentCapsuleMotion.tsx`: React / Next.js 환경에서 바로 사용할 수 있는 무의존성(Zero-dependency) 컴포넌트

## React 사용 예시

```tsx
import { useState } from "react";
import PaymentCapsuleMotion from "./PaymentCapsuleMotion";

export default function CheckoutModal() {
  const [isCompleted, setIsCompleted] = useState(false);

  return (
    <div className="flex flex-col items-center p-6">
      {/* 1. API 응답 대기 제어 모드: isCompleted가 true로 바뀔 때 완료 모션으로 부드럽게 전환 */}
      <PaymentCapsuleMotion
        size={160}
        palette="toss"
        isCompleted={isCompleted}
        onComplete={() => console.log("결제 완료 모션 종료!")}
      />

      {/* 2. 원샷 자동 재생 모드: isCompleted를 생략하면 1.3초 동안 전체 시퀀스 자동 재생 */}
      {/* <PaymentCapsuleMotion size={160} palette="toss" /> */}
    </div>
  );
}
```

## 부스 화면에 끼워 넣기 (`?embed`)

`booth-motion/` 4번 화면이 `../video-mockup/?embed`로 이 페이지를 불러옵니다. embed 모드에서는 목업 화면(126 × 265)만 창에 꽉 차게 그리고, 언어 버튼이 없으며, 스스로 재생하지 않습니다.

- 부모 → 이 페이지: `{type:'video-mockup:play', lang:'ko'|'en'}` 처음부터 1회 재생 · `{type:'video-mockup:stop'}` 멈추고 첫 화면으로
- 이 페이지 → 부모: `{type:'video-mockup:end'}` 결제 성공까지 끝남 (마지막 흰 화면 전환은 부스 쪽에서)

## 결제 성공 원 질감

결제 성공 체크 원에 은은한 입체감을 줍니다 (위쪽이 살짝 밝은 면 + 위쪽 옅은 하늘색 빛 + 면 위로 비스듬히 미끄러지는 하늘색(#93C5FD) 새틴 광택, 그림자 없음, `create2BMotionSVG(uid, true)` · `stone2B`). 단독 페이지와 부스 화면(`?embed`) 모두 같습니다.
