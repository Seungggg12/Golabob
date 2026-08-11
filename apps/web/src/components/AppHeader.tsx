import { BrandMark } from "./BrandMark";
import { UserRole } from "../types";

export function AppHeader({
  role,
  roles,
  onSwitchRole,
}: {
  role: UserRole;
  roles: UserRole[];
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
            <button
              type="button"
              onClick={() => onSwitchRole(nextRole)}
              aria-label={nextRole === "owner" ? "사장님 모드로 전환" : "예약자 모드로 전환"}
              title={nextRole === "owner" ? "사장님 모드" : "예약자 모드"}
            >
              <span className="material-symbols-outlined" aria-hidden="true">swap_horiz</span>
              <span className="action-label">{nextRole === "owner" ? "사장님 모드" : "예약자 모드"}</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
