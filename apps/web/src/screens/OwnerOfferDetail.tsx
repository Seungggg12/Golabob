import { Navigate, Offer } from "../types";

interface Props {
  offer: Offer | null;
  isLoading: boolean;
  message: string;
  onNavigate: Navigate;
}

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "사용자 응답 대기";
    case "selected":
      return "내 오퍼 선택됨";
    case "rejected":
      return "다른 오퍼 선택";
    case "expired":
      return "오퍼 만료";
    case "canceled":
      return "오퍼 취소";
    default:
      return status;
  }
}

export function OwnerOfferDetail({ offer, isLoading, message, onNavigate }: Props) {
  if (!offer) {
    return (
      <section className="owner-offer-detail-page">
        <button className="owner-offer-back" type="button" onClick={() => onNavigate("ownerOffers")}>
          <span className="material-symbols-outlined">arrow_back</span>
          보낸 오퍼
        </button>
        <div className="empty-state">
          <h1>{isLoading ? "오퍼를 불러오는 중..." : "오퍼 정보가 없습니다."}</h1>
          {message ? <p className="data-state error">{message}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="owner-offer-detail-page">
      <button className="owner-offer-back" type="button" onClick={() => onNavigate("ownerOffers")}>
        <span className="material-symbols-outlined">arrow_back</span>
        보낸 오퍼
      </button>

      {message ? <p className="owner-offer-message">{message}</p> : null}
      <div className="owner-offer-detail-hero">
        <div>
          <span>{offer.restaurantName || `식당 #${offer.restaurantId}`}</span>
          <h1>{offer.requestTitle || `회식 요청 #${offer.diningRequestId}`}</h1>
          <p>{offer.requestRegion || "지역 정보 없음"} · {offer.requestDiningDate || "날짜 미정"} {offer.requestDiningTime || ""}</p>
        </div>
        <span className={`owner-offer-status large ${offer.status}`}>{statusLabel(offer.status)}</span>
      </div>

      <div className="owner-offer-detail-grid">
        <article className="owner-offer-detail-card primary">
          <p className="eyebrow">OFFER PRICE</p>
          <strong>{offer.pricePerPerson.toLocaleString()}원</strong>
          <span>1인 기준 제안 금액</span>
        </article>
        <article className="owner-offer-detail-card">
          <span className="material-symbols-outlined">schedule</span>
          <small>예약 가능 시간</small>
          <strong>{offer.availableTime}</strong>
        </article>
        <article className="owner-offer-detail-card">
          <span className="material-symbols-outlined">groups</span>
          <small>요청 인원</small>
          <strong>{offer.requestHeadCount ? `${offer.requestHeadCount}명` : "정보 없음"}</strong>
        </article>
        <article className="owner-offer-detail-card">
          <span className="material-symbols-outlined">payments</span>
          <small>고객 희망 예산</small>
          <strong>{offer.requestBudgetPerPerson ? `${offer.requestBudgetPerPerson.toLocaleString()}원` : "정보 없음"}</strong>
        </article>
      </div>

      <div className="owner-offer-detail-sections">
        <article>
          <h2>메뉴 구성</h2>
          <p>{offer.menuDescription}</p>
        </article>
        <article>
          <h2>제공 서비스</h2>
          <p>{offer.serviceDescription || "등록한 추가 서비스가 없습니다."}</p>
        </article>
        <article>
          <h2>좌석 정보</h2>
          <p>{offer.seatDescription || "등록한 좌석 정보가 없습니다."}</p>
        </article>
        <article className="wide">
          <h2>사장님 코멘트</h2>
          <p>{offer.ownerComment || "등록한 코멘트가 없습니다."}</p>
        </article>
      </div>

      <footer className="owner-offer-detail-footer">
        <div>
          <span>오퍼 번호 #{offer.id}</span>
          <span>{new Date(offer.createdAt).toLocaleString("ko-KR")} 등록</span>
        </div>
        <button type="button" onClick={() => onNavigate("ownerOffers")}>목록으로 돌아가기</button>
      </footer>
    </section>
  );
}
