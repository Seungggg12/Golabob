import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { DiningRequest } from "../types";

interface Props { requests: DiningRequest[]; offerCount: number; isLoading: boolean; message: string; onSelect: (request: DiningRequest) => void; }

export function OwnerHome({ requests, offerCount, isLoading, message, onSelect }: Props) {
  return <>
    <section className="owner-metrics"><MetricCard label="새 요청" value={`${requests.length}건`} /><MetricCard label="보낸 오퍼" value={`${offerCount}건`} /><MetricCard label="예약 확정" value="준비 중" accent /></section>
    <SectionHeader title="실시간 회식 요청" action="최신순" />
    {isLoading ? <p className="data-state">불러오는 중...</p> : null}{message ? <p className="data-state error">{message}</p> : null}
    {!isLoading && !message && requests.length === 0 ? <div className="empty-state compact"><h2>현재 열린 요청이 없어요.</h2></div> : null}
    <div className="owner-request-list">{requests.map((request) => <article className="owner-request-card" key={request.id}><div><span>{request.diningDate} {request.diningTime}</span><h2>{request.title}</h2><p>{request.headCount}명 · {request.preferredMenu || "메뉴 무관"} · {request.requiredOptions || "추가 조건 없음"}</p><strong>1인 {request.budgetPerPerson.toLocaleString()}원 이하</strong></div><button type="button" onClick={() => onSelect(request)}>요청 보기</button></article>)}</div>
  </>;
}
