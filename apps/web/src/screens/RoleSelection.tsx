import { BrandMark } from "../components/BrandMark";
import { UserRole } from "../types";

export function RoleSelection({
  role,
  setRole,
  onContinue,
}: {
  role: UserRole;
  setRole: (value: UserRole) => void;
  onContinue: () => void;
}) {
  return (
    <main className="role-page">
      <header className="role-header">
        <BrandMark />
        <button className="icon-button" type="button" aria-label="알림">
          <span className="material-symbols-outlined button-icon" aria-hidden="true">
            notifications
          </span>
        </button>
      </header>

      <section className="role-content">
        <div className="role-title">
          <h1>어떤 방식으로 이용하시나요?</h1>
          <p>회원님의 서비스 이용 목적을 선택해 주세요.</p>
        </div>

        <div className="role-card-grid">
          <button
            className={role === "user" ? "role-card selected" : "role-card"}
            type="button"
            onClick={() => setRole("user")}
          >
            <span className="material-symbols-outlined selected-check" aria-hidden="true">
              check
            </span>
            <span className="material-symbols-outlined role-illustration booker" aria-hidden="true">
              groups
            </span>
            <strong>예약자</strong>
            <p>회식 조건을 등록하고 다양한 식당의 오퍼를 한눈에 비교해요</p>
            <em>그룹 회식 장소를 찾는 분</em>
          </button>

          <button
            className={role === "owner" ? "role-card selected" : "role-card"}
            type="button"
            onClick={() => setRole("owner")}
          >
            <span className="material-symbols-outlined selected-check" aria-hidden="true">
              check
            </span>
            <span className="material-symbols-outlined role-illustration owner" aria-hidden="true">
              storefront
            </span>
            <strong>사장님</strong>
            <p>올라온 회식 요청을 확인하고 우리 식당만의 맞춤 오퍼를 제안해요</p>
            <em>식당을 운영하시는 점주님</em>
          </button>
        </div>

        <div className="role-action">
          <button className="wide-primary" type="button" onClick={onContinue}>
            계속하기
          </button>
          <p>가입 후 마이페이지에서 역할을 추가할 수 있습니다.</p>
        </div>
      </section>
    </main>
  );
}
