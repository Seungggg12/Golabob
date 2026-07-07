import { BrandMark } from "../components/BrandMark";
import { AuthScreenProps } from "../types";

export function AuthScreen({
  apiBaseUrl,
  authMode,
  email,
  fetchMe,
  isLoading,
  message,
  password,
  role,
  setApiBaseUrl,
  setAuthMode,
  setEmail,
  setPassword,
  setRole,
  submitAuth,
  submitText,
  title,
  userLabel,
  onBack,
  onLogout,
}: AuthScreenProps) {
  return (
    <main className="auth-layout">
      <section className="auth-hero" aria-label="Golabob">
        <div className="hero-nav">
          <BrandMark />
          <button className="icon-button" type="button" onClick={onBack} aria-label="온보딩으로 돌아가기">
            이전
          </button>
        </div>
        <div className="dining-photo" aria-hidden="true">
          <div>
            <strong>환영합니다</strong>
            <span>당신의 비즈니스 다이닝 솔루션, 골라밥</span>
          </div>
        </div>
        <div className="auth-value-copy">
          <p className="eyebrow">Reverse Offer Dining</p>
          <h1>회식 조건을 올리면 식당이 먼저 제안해요</h1>
          <p>
            인원, 예산, 위치를 입력하면 주변 식당 사장님들이 맞춤 오퍼를 보내고,
            예약자는 조건을 비교해 단체 예약을 확정합니다.
          </p>
        </div>
      </section>

      <section className="auth-card" aria-label="로그인 및 회원가입">
        <div className="mode-tabs" role="tablist" aria-label="인증 방식">
          <button
            className={authMode === "login" ? "active" : ""}
            type="button"
            onClick={() => setAuthMode("login")}
          >
            로그인
          </button>
          <button
            className={authMode === "signup" ? "active" : ""}
            type="button"
            onClick={() => setAuthMode("signup")}
          >
            회원가입
          </button>
        </div>

        {authMode === "signup" ? (
          <div className="role-toggle" aria-label="가입 유형">
            <button
              className={role === "user" ? "active" : ""}
              type="button"
              onClick={() => setRole("user")}
            >
              예약자
            </button>
            <button
              className={role === "owner" ? "active" : ""}
              type="button"
              onClick={() => setRole("owner")}
            >
              사장님
            </button>
          </div>
        ) : null}

        <div className="auth-heading">
          <p className="eyebrow">Account</p>
          <h2>{title}</h2>
          <p>{message}</p>
        </div>

        <form className="auth-form" onSubmit={submitAuth}>
          <label>
            이메일 주소
            <input
              autoComplete="email"
              inputMode="email"
              placeholder="example@golabob.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            비밀번호
            <input
              autoComplete={authMode === "login" ? "current-password" : "new-password"}
              placeholder="password1234"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <div className="form-extra">
            <label className="check-label">
              <input type="checkbox" />
              로그인 유지
            </label>
            <button type="button">비밀번호 찾기</button>
          </div>

          <button className="primary-action" type="submit" disabled={isLoading}>
            {isLoading ? "처리 중" : submitText}
          </button>
        </form>

        <div className="account-bar">
          <div>
            <span>현재 계정</span>
            <strong>{userLabel}</strong>
          </div>
          <div className="account-actions">
            <button type="button" onClick={fetchMe} disabled={isLoading}>
              확인
            </button>
            <button type="button" onClick={onLogout}>
              로그아웃
            </button>
          </div>
        </div>

        <label className="api-field">
          API Base URL
          <input value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} />
        </label>
      </section>
    </main>
  );
}
