import { Navigate } from "../types";

export function MyPage({
  userLabel,
  onNavigate,
}: {
  userLabel: string;
  onNavigate: Navigate;
}) {
  return (
    <section className="my-page">
      <div className="profile-card">
        <span className="material-symbols-outlined avatar" aria-hidden="true">
          account_circle
        </span>
        <div>
          <h1>내 계정</h1>
          <p>{userLabel}</p>
        </div>
      </div>
      <div className="history-list">
        {["예약 내역", "내 요청 목록", "보낸 오퍼", "알림 설정", "계정 관리"].map((item) => (
          <button type="button" key={item}>
            {item}
          </button>
        ))}
      </div>
      <button className="wide-secondary" type="button" onClick={() => onNavigate("userHome")}>
        홈으로 돌아가기
      </button>
    </section>
  );
}
