import { FormEvent, useEffect, useState } from "react";
import {
  AppScreen,
  Navigate,
  PublicUser,
  UpdateProfileInput,
  UserRole,
} from "../types";

interface MyPageProps {
  user: PublicUser;
  role: UserRole;
  onNavigate: Navigate;
  onLogout: () => void;
  onActivateOwnerRole: () => Promise<void>;
  onUpdateProfile: (input: UpdateProfileInput) => Promise<PublicUser>;
}

interface MenuItem {
  icon: string;
  label: string;
  description: string;
  screen: AppScreen;
}

function formatPhoneForInput(phone: string) {
  const match = phone.match(/^\+8210(\d{4})(\d{4})$/);
  return match ? `010-${match[1]}-${match[2]}` : phone;
}

export function MyPage({
  user,
  role,
  onNavigate,
  onLogout,
  onActivateOwnerRole,
  onUpdateProfile,
}: MyPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isActivatingOwner, setIsActivatingOwner] = useState(false);
  const [ownerFeedback, setOwnerFeedback] = useState("");
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(formatPhoneForInput(user.phone));
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setPhone(formatPhoneForInput(user.phone));
  }, [user]);

  const menuItems: MenuItem[] = role === "owner"
    ? [
        {
          icon: "storefront",
          label: "내 식당",
          description: "식당 정보와 승인 상태 관리",
          screen: "myRestaurants",
        },
        {
          icon: "calendar_month",
          label: "예약 관리",
          description: "식당에 접수된 예약 확인",
          screen: "ownerReservations",
        },
        {
          icon: "local_offer",
          label: "보낸 오퍼",
          description: "회식 요청에 보낸 제안 확인",
          screen: "ownerOffers",
        },
      ]
    : [
        {
          icon: "calendar_month",
          label: "예약 내역",
          description: "일반 예약과 확정된 회식 확인",
          screen: "myReservation",
        },
        {
          icon: "receipt_long",
          label: "내 회식 요청",
          description: "등록한 조건과 받은 오퍼 확인",
          screen: "userHome",
        },
        {
          icon: "rate_review",
          label: "내 리뷰",
          description: "방문 완료 예약의 리뷰 관리",
          screen: "myReservation",
        },
      ];

  const resetForm = () => {
    setName(user.name);
    setEmail(user.email);
    setPhone(formatPhoneForInput(user.phone));
    setFeedback("");
    setIsEditing(false);
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedback("");

    try {
      await onUpdateProfile({ name, email, phone });
      setFeedback("프로필을 저장했습니다.");
      setIsEditing(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "프로필 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const activateOwner = async () => {
    setIsActivatingOwner(true);
    setOwnerFeedback("");

    try {
      await onActivateOwnerRole();
    } catch (error) {
      setOwnerFeedback(error instanceof Error ? error.message : "사장님 전환에 실패했습니다.");
      setIsActivatingOwner(false);
    }
  };

  return (
    <section className="my-page">
      <header className="my-page-heading">
        <div>
          <p className="eyebrow">My Golabob</p>
          <h1>마이페이지</h1>
        </div>
        <span className="my-page-role">{role === "owner" ? "사장님 모드" : "예약자 모드"}</span>
      </header>

      <section className="profile-card" aria-label="내 계정 정보">
        <span className="material-symbols-outlined avatar" aria-hidden="true">
          account_circle
        </span>
        <div className="profile-summary">
          <strong>{user.name}</strong>
          <span>{user.maskedEmail}</span>
          <span>{user.maskedPhone}</span>
        </div>
        <button className="profile-edit-button" type="button" onClick={() => setIsEditing(true)}>
          <span className="material-symbols-outlined" aria-hidden="true">edit</span>
          프로필 수정
        </button>
      </section>

      <div className="verification-grid" aria-label="연락처 인증 상태">
        <div>
          <span className="material-symbols-outlined" aria-hidden="true">mail</span>
          <div>
            <strong>이메일</strong>
            <span>{user.emailVerified ? "인증 완료" : "인증 필요"}</span>
          </div>
        </div>
        <div>
          <span className="material-symbols-outlined" aria-hidden="true">smartphone</span>
          <div>
            <strong>휴대전화</strong>
            <span>{user.phoneVerified ? "인증 완료" : "인증 필요"}</span>
          </div>
        </div>
      </div>

      {isEditing ? (
        <form className="profile-form" onSubmit={submitProfile}>
          <div className="section-header">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>프로필 수정</h2>
            </div>
            <button className="icon-button" type="button" onClick={resetForm} aria-label="프로필 수정 닫기">
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
          <div className="profile-field-grid">
            <label>
              이름
              <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              이메일
              <input
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              휴대전화
              <input
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
          </div>
          {feedback ? <p className="profile-feedback" role="status">{feedback}</p> : null}
          <div className="profile-form-actions">
            <button className="wide-secondary" type="button" onClick={resetForm} disabled={isSaving}>
              취소
            </button>
            <button className="wide-primary" type="submit" disabled={isSaving}>
              {isSaving ? "저장 중" : "저장"}
            </button>
          </div>
        </form>
      ) : feedback ? (
        <p className="profile-feedback success" role="status">{feedback}</p>
      ) : null}

      {!user.roles.includes("owner") ? (
        <section className="owner-conversion" aria-labelledby="owner-conversion-title">
          <span className="material-symbols-outlined" aria-hidden="true">storefront</span>
          <div>
            <p className="eyebrow">For Restaurant</p>
            <h2 id="owner-conversion-title">사장님으로 시작하기</h2>
          </div>
          <button
            className="wide-primary"
            type="button"
            disabled={isActivatingOwner}
            onClick={() => void activateOwner()}
          >
            <span className="material-symbols-outlined" aria-hidden="true">switch_account</span>
            {isActivatingOwner ? "전환 중" : "사장님 전환 신청"}
          </button>
          {ownerFeedback ? (
            <p className="profile-feedback owner-conversion-feedback" role="alert">
              {ownerFeedback}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="my-page-menu" aria-label="내 활동">
        <div className="section-header">
          <div>
            <p className="eyebrow">Activity</p>
            <h2>내 활동</h2>
          </div>
        </div>
        <div className="history-list">
          {menuItems.map((item) => (
            <button type="button" key={item.label} onClick={() => onNavigate(item.screen)}>
              <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
              <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
            </button>
          ))}
        </div>
      </section>

      <button className="my-page-logout" type="button" onClick={onLogout}>
        <span className="material-symbols-outlined" aria-hidden="true">logout</span>
        로그아웃
      </button>
    </section>
  );
}
