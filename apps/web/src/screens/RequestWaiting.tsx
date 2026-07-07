import { StatusBadge } from "../components/StatusBadge";
import { Navigate } from "../types";

export function RequestWaiting({ onNavigate }: { onNavigate: Navigate }) {
  return (
    <section className="detail-page">
      <div className="request-summary-card">
        <div className="detail-card-header">
          <div>
            <StatusBadge>오퍼 모집 중</StatusBadge>
            <h1>강남역 팀 회식</h1>
            <p>식당 사장님들이 조건을 확인하고 맞춤 오퍼를 보내는 중입니다.</p>
          </div>
          <button className="icon-button" type="button" aria-label="요청 수정">
            <span className="material-symbols-outlined button-icon" aria-hidden="true">
              edit
            </span>
          </button>
        </div>

        <div className="condition-chip-grid">
          {[
            ["groups", "15명"],
            ["payments", "인당 5만원 이하"],
            ["restaurant", "고기/일식 선호"],
            ["meeting_room", "룸 필수"],
          ].map(([icon, label]) => (
            <span className="condition-chip" key={label}>
              <span className="material-symbols-outlined" aria-hidden="true">
                {icon}
              </span>
              {label}
            </span>
          ))}
        </div>

        <div className="offer-progress-card">
          <span className="material-symbols-outlined" aria-hidden="true">
            campaign
          </span>
          <div>
            <strong>현재 받은 오퍼 5건</strong>
            <p>오퍼 마감까지 23:54:12 남음</p>
          </div>
        </div>
      </div>

      <div className="waiting-offer-list">
        <div className="section-header">
          <h2>도착한 오퍼</h2>
          <button type="button">최신순</button>
        </div>
        {["한우 명가 강남점", "스시 다이닝 하루", "프라이빗 비스트로"].map((name, index) => (
          <article className="compact-offer-card" key={name}>
            <div className="compact-offer-thumb"></div>
            <div>
              <span>{index === 0 ? "10분 전" : `${index + 1}0분 전`}</span>
              <h3>{name}</h3>
              <p>{index === 0 ? "스페셜 회식 세트 A · 룸 보장" : "단체 예약 맞춤 구성"}</p>
              <strong>{index === 0 ? "45,000원" : "48,000원"}</strong>
            </div>
          </article>
        ))}
      </div>

      <button className="wide-primary" type="button" onClick={() => onNavigate("offers")}>
        오퍼 비교하기
      </button>
    </section>
  );
}
