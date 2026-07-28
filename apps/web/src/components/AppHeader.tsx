import { BrandMark } from "./BrandMark";
import { UserRole } from "../types";

export function AppHeader({
  role,
  roles,
  onAuth,
  onLogout,
  onSwitchRole,
}: {
  role: UserRole;
  roles: UserRole[];
  onAuth: () => void;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
}) {
  const nextRole = role === "owner" ? "user" : "owner";
  const canSwitchRole = roles.includes(nextRole);

  return (
    <header className="app-header">
      <div className="header-inner">
        <BrandMark />
        <div className="header-actions">
          <span className="role-badge">{role === "owner" ? "사장님" : "예약자"}</span>
          {canSwitchRole ? (
            <button type="button" onClick={() => onSwitchRole(nextRole)}>
              {nextRole === "owner" ? "사장님 모드" : "예약자 모드"}
            </button>
          ) : null}
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
