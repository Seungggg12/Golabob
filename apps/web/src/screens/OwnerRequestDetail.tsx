import { Navigate } from "../types";

export function OwnerRequestDetail({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="detail-page">
      <div className="page-title">
        <p className="eyebrow">Reverse Offer Request</p>
        <h1>강남역 인근 팀 회식</h1>
        <p>내 식당에서 450m 거리 · 2시간 전 도착</p>
      </div>

      <div className="bento-grid">
        <article className="detail-card wide">
          <h2>
            <span className="material-symbols-outlined" aria-hidden="true">
              star_outline
            </span>
            핵심 조건
          </h2>
          <div className="highlight-grid">
            {[
              ["meeting_room", "공간 요구사항", "룸 필수"],
              ["directions_car", "주차 요구사항", "주차 3대 필요"],
              ["account_balance_wallet", "비용 정책", "예산 엄수"],
            ].map(([icon, label, value]) => (
              <div className="highlight-card" key={label}>
                <span className="material-symbols-outlined" aria-hidden="true">
                  {icon}
                </span>
                <p>{label}</p>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="detail-card">
          <h2>
            <span className="material-symbols-outlined" aria-hidden="true">
              schedule
            </span>
            일정
          </h2>
          <p>2026년 12월 24일 오후 7:00</p>
          <strong>15명 방문 예정</strong>
        </article>

        <article className="detail-card">
          <h2>
            <span className="material-symbols-outlined" aria-hidden="true">
              notes
            </span>
            요청 메모
          </h2>
          <p>연말 팀 회식이라 분위기 좋고 조용한 룸이 있으면 좋겠습니다.</p>
        </article>
      </div>

      <div className="sticky-action-bar">
        <button className="wide-secondary" type="button" onClick={() => onNavigate("ownerHome")}>
          돌아가기
        </button>
        <button className="wide-primary" type="button" onClick={() => onNavigate("createOffer")}>
          맞춤 오퍼 작성
        </button>
      </div>
    </section>
  );
}
