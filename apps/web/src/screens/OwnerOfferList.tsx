import { useMemo, useState } from "react";
import { Navigate, Offer } from "../types";

interface Props {
  offers: Offer[];
  isLoading: boolean;
  message: string;
  onNavigate: Navigate;
  onRefresh: () => void;
  onSelect: (offer: Offer) => void;
}

const statusOptions = [
  { value: "all", label: "전체" },
  { value: "pending", label: "응답 대기" },
  { value: "selected", label: "선택됨" },
  { value: "rejected", label: "미선택" },
  { value: "expired", label: "만료" },
];

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "응답 대기";
    case "selected":
      return "선택됨";
    case "rejected":
      return "미선택";
    case "expired":
      return "만료";
    case "canceled":
      return "취소";
    default:
      return status;
  }
}

export function OwnerOfferList({
  offers,
  isLoading,
  message,
  onNavigate,
  onRefresh,
  onSelect,
}: Props) {
  const [status, setStatus] = useState("all");
  const filteredOffers = useMemo(
    () => offers.filter((offer) => status === "all" || offer.status === status),
    [offers, status],
  );

  return (
    <section className="owner-offers-page">
      <header className="owner-offers-header">
        <div>
          <p className="eyebrow">MY OFFERS</p>
          <h1>보낸 오퍼</h1>
          <p>식당에서 제안한 오퍼와 예약 선택 상태를 확인하세요.</p>
        </div>
        <button type="button" className="owner-offers-refresh" onClick={onRefresh}>
          <span className="material-symbols-outlined">refresh</span>
          새로고침
        </button>
      </header>

      <div className="owner-offer-summary">
        <div><span>전체 오퍼</span><strong>{offers.length}</strong></div>
        <div><span>응답 대기</span><strong>{offers.filter((offer) => offer.status === "pending").length}</strong></div>
        <div><span>선택된 오퍼</span><strong>{offers.filter((offer) => offer.status === "selected").length}</strong></div>
      </div>

      <div className="owner-offer-filters" aria-label="오퍼 상태 필터">
        {statusOptions.map((option) => (
          <button
            type="button"
            key={option.value}
            className={status === option.value ? "active" : ""}
            onClick={() => setStatus(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {message ? <p className="owner-offer-message">{message}</p> : null}
      {isLoading ? <p className="data-state">보낸 오퍼를 불러오는 중...</p> : null}
      {!isLoading && !message && filteredOffers.length === 0 ? (
        <div className="empty-state compact">
          <span className="material-symbols-outlined">local_offer</span>
          <h2>{offers.length === 0 ? "아직 보낸 오퍼가 없어요." : "해당 상태의 오퍼가 없어요."}</h2>
          {offers.length === 0 ? <button onClick={() => onNavigate("ownerHome")}>회식 요청 보기</button> : null}
        </div>
      ) : null}

      <div className="owner-offer-list">
        {filteredOffers.map((offer) => (
          <article className="owner-offer-card" key={offer.id}>
            <div className="owner-offer-card-top">
              <div>
                <span className="owner-offer-restaurant">{offer.restaurantName || `식당 #${offer.restaurantId}`}</span>
                <h2>{offer.requestTitle || `회식 요청 #${offer.diningRequestId}`}</h2>
                <p>{offer.requestRegion || "지역 정보 없음"} · {offer.requestDiningDate || "날짜 미정"} {offer.requestDiningTime || ""}</p>
              </div>
              <span className={`owner-offer-status ${offer.status}`}>{statusLabel(offer.status)}</span>
            </div>
            <div className="owner-offer-card-info">
              <div><small>제안 메뉴</small><strong>{offer.menuDescription}</strong></div>
              <div><small>1인 제안가</small><strong>{offer.pricePerPerson.toLocaleString()}원</strong></div>
              <div><small>예약 시간</small><strong>{offer.availableTime}</strong></div>
            </div>
            <div className="owner-offer-card-footer">
              <span>{new Date(offer.createdAt).toLocaleDateString("ko-KR")} 제안</span>
              <button type="button" onClick={() => onSelect(offer)}>
                상세 보기
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
