import { useMemo, useState } from "react";
import { DiningRequest, Navigate, Offer } from "../types";

interface Props { request: DiningRequest | null; offers: Offer[]; message: string; onNavigate: Navigate; }

export function OfferComparison({ request, offers, message, onNavigate }: Props) {
  const [sort, setSort] = useState<"price" | "latest">("price");
  const sorted = useMemo(() => [...offers].sort((a, b) => sort === "price" ? a.pricePerPerson - b.pricePerPerson : Date.parse(b.createdAt) - Date.parse(a.createdAt)), [offers, sort]);
  if (!request) return <section className="empty-state"><h1>비교할 요청이 없습니다.</h1><button onClick={() => onNavigate("userHome")}>목록으로</button></section>;
  return <><section className="summary-banner"><span>현재 진행 중인 요청</span><h1>{request.diningDate} {request.diningTime} · {request.region}</h1><p>{request.headCount}명 · 희망 예산 {request.budgetPerPerson.toLocaleString()}원 이하</p><strong>총 {offers.length}개의 맞춤 오퍼</strong></section>
    <div className="filter-row"><button className={sort === "price" ? "active" : ""} onClick={() => setSort("price")}>가격 낮은 순</button><button className={sort === "latest" ? "active" : ""} onClick={() => setSort("latest")}>최신순</button><span>총 {offers.length}개</span></div>
    {message ? <p className="data-state error">{message}</p> : null}<div className="offer-list">{sorted.map((offer, index) => <article className={index === 0 && sort === "price" ? "offer-card best" : "offer-card"} key={offer.id}>{index === 0 && sort === "price" ? <span className="best-badge">LOWEST PRICE</span> : null}<div className="offer-visual"><span>식당 #{offer.restaurantId}</span></div><div className="offer-body"><div className="offer-title-row"><div><p>{offer.seatDescription || "좌석 정보 없음"}</p><h2>{offer.menuDescription}</h2></div><strong>{offer.status}</strong></div><dl className="offer-details"><div><dt>1인당 가격</dt><dd>{offer.pricePerPerson.toLocaleString()}원</dd></div><div><dt>예약 가능 시간</dt><dd>{offer.availableTime}</dd></div></dl><p className="benefit-copy">{offer.serviceDescription || offer.ownerComment || "추가 혜택 없음"}</p><div className="offer-actions"><button onClick={() => onNavigate("requestWaiting")}>요청 보기</button></div></div></article>)}</div>
  </>;
}
