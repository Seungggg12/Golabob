import { BrandMark } from "../components/BrandMark";

export function SplashOnboarding({ onStart }: { onStart: () => void }) {
  return (
    <main className="splash-page">
      <header className="splash-header">
        <BrandMark />
      </header>

      <section className="splash-content" aria-label="골라밥 온보딩">
        <div className="splash-visual" aria-hidden="true">
          <div className="offer-stack stack-back"></div>
          <div className="offer-stack stack-mid"></div>
          <div className="splash-offer-card">
            <div className="splash-offer-top">
              <span></span>
              <strong>NEW OFFER</strong>
            </div>
            <div className="splash-restaurant-row">
              <div className="splash-restaurant-thumb"></div>
              <div>
                <b>강남 한식 다이닝</b>
                <small>회식 요청에 맞춤 제안 도착</small>
              </div>
            </div>
            <dl className="splash-offer-meta">
              <div>
                <dt>인원</dt>
                <dd>12명</dd>
              </div>
              <div>
                <dt>혜택</dt>
                <dd>룸 제공 + 음료 서비스</dd>
              </div>
              <div>
                <dt>예산</dt>
                <dd>1인 35,000원</dd>
              </div>
            </dl>
            <button type="button" tabIndex={-1}>
              오퍼 확인하기
            </button>
          </div>
        </div>

        <div className="splash-copy">
          <p className="eyebrow">Reverse Offer Dining</p>
          <h1>
            회식 조건을 올리면,
            <br />
            식당이 먼저 제안해요
          </h1>
          <p>
            인원, 예산, 위치만 입력하면 주변 식당 사장님들이 맞춤 오퍼를 보내고,
            가장 좋은 조건으로 단체 예약을 확정할 수 있습니다.
          </p>
        </div>

        <div className="splash-steps" aria-label="서비스 진행 방식">
          <span className="active"></span>
          <span></span>
          <span></span>
        </div>
      </section>

      <footer className="splash-footer">
        <button className="wide-primary" type="button" onClick={onStart}>
          시작하기
        </button>
        <button className="text-link-button" type="button" onClick={onStart}>
          이미 계정이 있으신가요? 로그인
        </button>
      </footer>
    </main>
  );
}
