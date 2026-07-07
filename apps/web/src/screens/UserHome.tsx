import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";
import { StatusBadge } from "../components/StatusBadge";
import { requests } from "../mockData";
import { Navigate } from "../types";

export function UserHome({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <>
      <section className="welcome-section">
        <h1>김민수님, 안녕하세요!</h1>
        <p>오늘의 완벽한 회식 장소를 찾아보세요.</p>
      </section>

      <section className="cta-card">
        <span>NEW REQUEST</span>
        <h2>회식 요청 등록하기</h2>
        <p>장소, 인원, 예산만 알려주시면 인근 식당들이 최고의 오퍼를 제안합니다.</p>
        <button type="button" onClick={() => onNavigate("createRequest")}>
          시작하기
        </button>
      </section>

      <SectionHeader title="나의 요청 현황" action="전체보기" />
      <div className="request-grid">
        {requests.map((request) => (
          <article className="request-card" key={request.title}>
            <div className="card-topline">
              <span>2026.07 요청</span>
              <StatusBadge>{request.status}</StatusBadge>
            </div>
            <h3>{request.title}</h3>
            <dl className="meta-list">
              <div>
                <dt>일정</dt>
                <dd>{request.date}</dd>
              </div>
              <div>
                <dt>조건</dt>
                <dd>
                  {request.people} · {request.budget}
                </dd>
              </div>
            </dl>
            <div className="card-footer">
              <strong>{request.offers}건의 오퍼 도착</strong>
              <button type="button" onClick={() => onNavigate("requestWaiting")}>
                요청 보기
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="metric-grid">
        <MetricCard label="올해 절약한 비용" value="245,000원" />
        <MetricCard label="성공한 예약" value="12건" />
        <MetricCard label="받은 혜택" value="와인 4병" />
        <MetricCard label="나의 레벨" value="골드 푸디" accent />
      </div>
    </>
  );
}
