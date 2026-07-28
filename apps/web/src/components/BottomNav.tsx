import { AppScreen, Navigate, UserRole } from "../types";

export function BottomNav({
  active,
  role,
  onNavigate,
}: {
  active: AppScreen;
  role: UserRole;
  onNavigate: Navigate;
}) {
  const items: Array<{ icon: string; label: string; screen: AppScreen }> =
    role === "owner"
      ? [
          { icon: "home", label: "홈", screen: "ownerHome" },
          { icon: "request_page", label: "요청", screen: "ownerHome" },
          { icon: "local_offer", label: "오퍼", screen: "createOffer" },
          { icon: "person", label: "마이", screen: "myPage" },
        ]
      : [
          { icon: "home", label: "홈", screen: "userHome" },
          { icon: "edit_calendar", label: "요청", screen: "createRequest" },
          { icon: "event_available", label: "예약", screen: "confirmation" },
          { icon: "person", label: "마이", screen: "myPage" },
        ];

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {items.map((item) => (
        <button
          className={active === item.screen ? "active" : ""}
          type="button"
          key={item.label}
          onClick={() => onNavigate(item.screen)}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {item.icon}
          </span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
