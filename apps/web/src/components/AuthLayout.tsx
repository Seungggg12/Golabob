import { ReactNode } from "react";
import { BrandMark } from "./BrandMark";

interface AuthLayoutProps {
  alternateAction: string;
  alternatePrompt: string;
  children: ReactNode;
  onAlternate: () => void;
  onBack: () => void;
}

export function AuthLayout({
  alternateAction,
  alternatePrompt,
  children,
  onAlternate,
  onBack,
}: AuthLayoutProps) {
  return (
    <main className="auth-layout auth-page">
      <section className="auth-hero" aria-label="골라밥 서비스 소개">
        <div className="hero-nav">
          <BrandMark />
          <button
            className="icon-button auth-back-button"
            type="button"
            onClick={onBack}
            aria-label="온보딩으로 돌아가기"
            title="뒤로"
          >
            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
          </button>
        </div>

        <div className="dining-photo" aria-hidden="true">
          <div>
            <strong>조건은 하나, 제안은 여러 개</strong>
            <span>우리 팀에 맞는 회식 장소를 더 빠르게 결정하세요</span>
          </div>
        </div>

        <div className="auth-value-copy">
          <p className="eyebrow">Reverse Offer Dining</p>
          <h1>회식 조건을 올리면 식당이 먼저 제안해요</h1>
          <p>
            인원, 예산, 위치를 등록하면 주변 식당의 맞춤 오퍼를 한곳에서 비교하고
            단체 예약까지 확정할 수 있습니다.
          </p>
        </div>
      </section>

      <section className="auth-panel" aria-label="계정 인증">
        <div className="auth-card">{children}</div>
        <p className="auth-switch">
          {alternatePrompt}
          <button type="button" onClick={onAlternate}>{alternateAction}</button>
        </p>
      </section>
    </main>
  );
}
