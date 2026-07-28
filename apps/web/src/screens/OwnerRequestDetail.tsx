import { DiningRequest, Navigate } from "../types";

export function OwnerRequestDetail({ request, onNavigate }: { request: DiningRequest | null; onNavigate: Navigate }) {
  if (!request) return <section className="empty-state"><h1>선택한 요청이 없습니다.</h1><button onClick={() => onNavigate("ownerHome")}>목록으로</button></section>;
  return <section className="detail-page"><div className="page-title"><p className="eyebrow">Reverse Offer Request</p><h1>{request.title}</h1><p>{request.region} · {request.diningDate} {request.diningTime}</p></div>
    <div className="bento-grid"><article className="detail-card wide"><h2>핵심 조건</h2><div className="highlight-grid"><div className="highlight-card"><p>참석 인원</p><strong>{request.headCount}명</strong></div><div className="highlight-card"><p>선호 메뉴</p><strong>{request.preferredMenu || "상관없음"}</strong></div><div className="highlight-card"><p>1인 예산</p><strong>{request.budgetPerPerson.toLocaleString()}원</strong></div></div></article><article className="detail-card"><h2>필수 조건</h2><p>{request.requiredOptions || "없음"}</p></article><article className="detail-card"><h2>요청 메모</h2><p>{request.memo || "추가 메모 없음"}</p></article></div>
    <div className="sticky-action-bar"><button className="wide-secondary" onClick={() => onNavigate("ownerHome")}>돌아가기</button><button className="wide-primary" onClick={() => onNavigate("createOffer")}>맞춤 오퍼 작성</button></div>
  </section>;
}
