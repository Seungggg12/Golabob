import { AppScreen, Navigate } from "../types";

export function BottomNav({
  active,
  role,
  onNavigate,
}: {
  active: AppScreen;
  role: string;
  onNavigate: Navigate;
}) {
  const homeScreen = role === "owner" ? "ownerHome" : "userHome";
  const items: Array<{ icon: string; label: string; screen: AppScreen }> = [
    { icon: "home", label: "홈", screen: homeScreen },
    { icon: role === "owner" ? "request_page" : "edit_calendar", label: "요청", screen: role === "owner" ? "ownerHome" : "createRequest" },
    { icon: "event_available", label: "예약", screen: "confirmation" },
    { icon: "calendar_month", label: "내 예약", screen: "myReservation" },
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
