import { StatusBadge } from "../components/StatusBadge";
import { DiningRequest, Navigate, Offer } from "../types";

interface Props { request: DiningRequest | null; offers: Offer[]; isLoading: boolean; message: string; onNavigate: Navigate; onRefresh: () => void; }

export function RequestWaiting({ request, offers, isLoading, message, onNavigate, onRefresh }: Props) {
  if (!request) return <section className="empty-state"><h1>선택한 요청이 없습니다.</h1><button onClick={() => onNavigate("userHome")}>목록으로</button></section>;
  return <section className="detail-page">
    <div className="request-summary-card"><div className="detail-card-header"><div><StatusBadge>{request.status === "open" ? "오퍼 모집 중" : request.status}</StatusBadge><h1>{request.title}</h1><p>{request.diningDate} {request.diningTime} · {request.region}</p></div><button className="icon-button" type="button" onClick={onRefresh}>↻</button></div>
      <div className="condition-chip-grid">{[`${request.headCount}명`, `인당 ${request.budgetPerPerson.toLocaleString()}원 이하`, request.preferredMenu || "메뉴 무관", request.requiredOptions || "추가 조건 없음"].map((label) => <span className="condition-chip" key={label}>{label}</span>)}</div>
      <div className="offer-progress-card"><span className="material-symbols-outlined">campaign</span><div><strong>현재 받은 오퍼 {offers.length}건</strong><p>{isLoading ? "확인 중..." : "도착한 오퍼를 비교해보세요."}</p></div></div>
    </div>
    <div className="waiting-offer-list"><div className="section-header"><h2>도착한 오퍼</h2><button onClick={onRefresh}>새로고침</button></div>{message ? <p className="data-state error">{message}</p> : null}{!isLoading && !message && offers.length === 0 ? <div className="empty-state compact"><h2>아직 도착한 오퍼가 없어요.</h2></div> : null}{offers.slice(0, 3).map((offer) => <article className="compact-offer-card" key={offer.id}><div className="compact-offer-thumb" /><div><span>{new Date(offer.createdAt).toLocaleString("ko-KR")}</span><h3>{offer.restaurantName || `식당 #${offer.restaurantId}`}</h3><p>{offer.menuDescription}</p><strong>{offer.pricePerPerson.toLocaleString()}원</strong></div></article>)}</div>
    <button className="wide-primary" disabled={offers.length === 0} onClick={() => onNavigate("offers")}>오퍼 비교하기</button>
  </section>;
}
