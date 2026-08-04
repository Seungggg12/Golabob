import { Stepper } from "../components/Stepper";
import { DiningRequest, Navigate, Offer, Reservation } from "../types";

interface Props {
  request: DiningRequest | null;
  offer: Offer | null;
  reservation: Reservation | null;
  onNavigate: Navigate;
}

export function ReservationConfirmation({ request, offer, reservation, onNavigate }: Props) {
  if (!request || !offer || !reservation) {
    return (
      <section className="empty-state">
        <h1>확정된 예약 정보가 없습니다.</h1>
        <button type="button" onClick={() => onNavigate("userHome")}>내 요청으로 돌아가기</button>
      </section>
    );
  }

  const benefit = [offer.serviceDescription, offer.seatDescription]
    .filter(Boolean)
    .join(", ") || "추가 혜택 없음";

  return (
    <section className="confirmation-page">
      <Stepper current={2} labels={["요청", "확정", "완료"]} />
      <div className="confirmation-card">
        <span className="success-mark">
          <span className="material-symbols-outlined badge-icon" aria-hidden="true">
            check_circle
          </span>
          예약 확정
        </span>
        <h1>{offer.restaurantName || `식당 #${offer.restaurantId}`}</h1>
        <p>{reservation.reservationDate} {reservation.reservationTime} · {reservation.headCount}명 · {request.region}</p>
        <dl className="receipt-list">
          <div>
            <dt>예약 번호</dt>
            <dd>{reservation.id}</dd>
          </div>
          <div>
            <dt>1인 제안 가격</dt>
            <dd>{offer.pricePerPerson.toLocaleString()}원</dd>
          </div>
          <div>
            <dt>예상 총 금액</dt>
            <dd>{(offer.pricePerPerson * reservation.headCount).toLocaleString()}원</dd>
          </div>
          <div>
            <dt>포함 혜택</dt>
            <dd>{benefit}</dd>
          </div>
        </dl>
        <button className="wide-primary" type="button" onClick={() => onNavigate("userHome")}>
          내 요청으로 돌아가기
        </button>
      </div>
    </section>
  );
}
