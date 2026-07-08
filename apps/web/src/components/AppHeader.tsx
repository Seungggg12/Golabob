import { BrandMark } from "./BrandMark";

export function AppHeader({
  role,
  onAuth,
  onLogout,
}: {
  role: string;
  onAuth: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <BrandMark />
        <div className="header-actions">
          <span className="role-badge">{role === "owner" ? "사장님" : "예약자"}</span>
          <button type="button" onClick={onAuth}>
            계정
          </button>
          <button type="button" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
