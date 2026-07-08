import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { ownerRequests } from "../mockData";
import { Navigate } from "../types";

export function OwnerHome({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <>
      <section className="owner-metrics">
        <MetricCard label="새 요청" value="12건" />
        <MetricCard label="보낸 오퍼" value="8건" />
        <MetricCard label="예약 확정" value="3건" accent />
      </section>
      <SectionHeader title="실시간 인근 요청" action="필터" />
      <div className="owner-request-list">
        {ownerRequests.map((request) => (
          <article className="owner-request-card" key={request.title}>
            <div>
              <span>{request.time}</span>
              <h2>{request.title}</h2>
              <p>{request.summary}</p>
              <strong>{request.budget}</strong>
            </div>
            <button type="button" onClick={() => onNavigate("ownerRequestDetail")}>
              요청 보기
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
