import { AppScreen, Navigate } from "../types";

export function MyPage({
  userLabel,
  role,
  onNavigate,
}: {
  userLabel: string;
  role: string;
  onNavigate: Navigate;
}) {
  const homeScreen = role === "owner" ? "ownerHome" : "userHome";
  const menuItems: Array<{ label: string; screen?: AppScreen }> = [
    { label: "예약 내역", screen: "confirmation" as const },
    { label: "내 요청 목록", screen: homeScreen },
    { label: "보낸 오퍼", screen: role === "owner" ? "ownerHome" as const : undefined },
    { label: "알림 설정" },
    { label: "계정 관리" },
  ];

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
        {menuItems.map((item) => {
          const target = item.screen;

          return (
            <button
              type="button"
              key={item.label}
              onClick={target ? () => onNavigate(target) : undefined}
              disabled={!target}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <button className="wide-secondary" type="button" onClick={() => onNavigate(homeScreen)}>
        홈으로 돌아가기
      </button>
    </section>
  );
}
