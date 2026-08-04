import { SectionHeader } from "../components/SectionHeader";
import { StatusBadge } from "../components/StatusBadge";
import { DiningRequest, Navigate } from "../types";

interface Props { requests: DiningRequest[]; isLoading: boolean; message: string; onNavigate: Navigate; onSelect: (request: DiningRequest) => void; }

export function UserHome({ requests, isLoading, message, onNavigate, onSelect }: Props) {
  return <>
    <section className="welcome-section"><h1>오늘의 회식 장소를 찾아보세요!</h1><p>조건을 등록하면 식당의 맞춤 오퍼를 받을 수 있어요.</p></section>
    <section className="cta-card"><span>NEW REQUEST</span><h2>회식 요청 등록하기</h2><p>장소, 인원, 예산을 알려주세요.</p><button type="button" onClick={() => onNavigate("createRequest")}>시작하기</button></section>
    <section className="cta-card">
      <span>GENERAL RESERVATION</span>
        <h2>일반 예약하기</h2>
        <p>등록된 식당을 확인하고 바로 예약해보세요.</p>

        <button
          type="button"
          onClick={() => onNavigate("restaurantList")}
        >
          식당 둘러보기
        </button>
    </section>
    <SectionHeader title="나의 요청 현황" action={`${requests.length}건`} />
    {isLoading ? <p className="data-state">불러오는 중...</p> : null}
    {message ? <p className="data-state error">{message}</p> : null}
    {!isLoading && !message && requests.length === 0 ? <div className="empty-state compact"><h2>아직 등록한 요청이 없어요.</h2></div> : null}
    <div className="request-grid">{requests.map((request) => <article className="request-card" key={request.id}>
      <div className="card-topline"><span>{request.diningDate}</span><StatusBadge>{request.status === "open" ? "오퍼 모집 중" : request.status}</StatusBadge></div>
      <h3>{request.title}</h3><dl className="meta-list"><div><dt>일정</dt><dd>{request.diningDate} {request.diningTime}</dd></div><div><dt>조건</dt><dd>{request.headCount}명 · {request.budgetPerPerson.toLocaleString()}원</dd></div></dl>
      <div className="card-footer"><strong>{request.region}</strong><button type="button" onClick={() => onSelect(request)}>요청 보기</button></div>
    </article>)}</div>
  </>;
}
