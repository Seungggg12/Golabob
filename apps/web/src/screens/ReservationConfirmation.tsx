import { Stepper } from "../components/Stepper";
import { Navigate } from "../types";

export function ReservationConfirmation({ onNavigate }: { onNavigate: Navigate }) {
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
        <h1>참숯구이 전문점</h1>
        <p>12월 24일 오후 7:00 · 15명 · 강남역 350m</p>
        <dl className="receipt-list">
          <div>
            <dt>1인 제안 가격</dt>
            <dd>45,000원</dd>
          </div>
          <div>
            <dt>예상 총 금액</dt>
            <dd>675,000원</dd>
          </div>
          <div>
            <dt>포함 혜택</dt>
            <dd>소주 2병 서비스, 프라이빗 룸</dd>
          </div>
        </dl>
        <label>
          예약자 연락처
          <input placeholder="010-0000-0000" />
        </label>
        <button className="wide-primary" type="button" onClick={() => onNavigate("userHome")}>
          예약 확정하기
        </button>
        <button className="wide-secondary" type="button" onClick={() => onNavigate("offers")}>
          다른 오퍼 보기
        </button>
      </div>
    </section>
  );
}
