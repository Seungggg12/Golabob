import { offers } from "../mockData";
import { Navigate } from "../types";

interface OfferItem {
  restaurantId?: string;
  name: string;
  category: string;
  distance: string;
  rating: string | number;
  price: string;
  time: string;
  benefit: string;
  best?: boolean;
}

interface OfferComparisonProps {
  onNavigate: Navigate;
  onSelectRestaurant: (restaurantId: string) => void;
}

export function OfferComparison({
  onNavigate,
  onSelectRestaurant,
}: OfferComparisonProps) {
  const offerList = offers as OfferItem[];

  const selectOffer = (offer: OfferItem) => {
    if (!offer.restaurantId) {
      window.alert(
        "이 오퍼에 연결된 식당 ID가 없습니다. mockData.ts에 실제 restaurantId를 추가해주세요.",
      );
      return;
    }

    onSelectRestaurant(offer.restaurantId);
    onNavigate("confirmation");
  };

  return (
    <>
      <section className="summary-banner">
        <span>현재 진행 중인 요청</span>
        <h1>12월 24일 오후 7:00 · 강남역</h1>
        <p>성인 15명 · 회식/단체 모임 · 희망 예산 5만원 이하</p>
        <strong>오퍼 마감까지 02:45:12</strong>
      </section>

      <div className="filter-row">
        {[
          "필터",
          "가격 낮은 순",
          "혜택 많은 순",
          "거리 가까운 순",
          "룸 가능",
        ].map((filter, index) => (
          <button
            className={index === 1 ? "active" : ""}
            type="button"
            key={filter}
          >
            {filter}
          </button>
        ))}

        <span>총 {offerList.length}개의 오퍼 도착</span>
      </div>

      <div className="offer-list">
        {offerList.map((offer, index) => (
          <article
            className={offer.best ? "offer-card best" : "offer-card"}
            key={`${offer.name}-${index}`}
          >
            {offer.best ? (
              <span className="best-badge">BEST VALUE</span>
            ) : null}

            <div className="offer-visual">
              <span>{offer.distance}</span>
            </div>

            <div className="offer-body">
              <div className="offer-title-row">
                <div>
                  <p>{offer.category}</p>
                  <h2>{offer.name}</h2>
                </div>

                <strong>{offer.rating}</strong>
              </div>

              <dl className="offer-details">
                <div>
                  <dt>1인당 가격</dt>
                  <dd>{offer.price}</dd>
                </div>

                <div>
                  <dt>예약 가능 시간</dt>
                  <dd>{offer.time}</dd>
                </div>
              </dl>

              <p className="benefit-copy">{offer.benefit}</p>

              <div className="offer-actions">
                <button type="button">상세 보기</button>

                <button
                  type="button"
                  onClick={() => selectOffer(offer)}
                >
                  이 오퍼 선택
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}