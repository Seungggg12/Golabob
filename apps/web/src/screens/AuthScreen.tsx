import { BrandMark } from "../components/BrandMark";
import { AuthScreenProps } from "../types";

export function AuthScreen({
  apiBaseUrl,
  authMode,
  email,
  fetchMe,
  marketingConsent,
  isLoading,
  message,
  name,
  password,
  phone,
  privacyPolicy,
  rememberLogin,
  serviceTerms,
  setApiBaseUrl,
  setAuthMode,
  setEmail,
  setMarketingConsent,
  setName,
  setPassword,
  setPhone,
  setPrivacyPolicy,
  setRememberLogin,
  setServiceTerms,
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

        <div className="auth-heading">
          <p className="eyebrow">Account</p>
          <h2>{title}</h2>
          <p>{message}</p>
        </div>

        <form className="auth-form" onSubmit={submitAuth}>
          {authMode === "signup" ? (
            <label>
              이름
              <input
                autoComplete="name"
                placeholder="홍길동"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          ) : null}

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

          {authMode === "signup" ? (
            <label>
              휴대전화 번호
              <input
                autoComplete="tel"
                inputMode="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
          ) : null}

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

          {authMode === "signup" ? (
            <div className="agreement-list">
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={serviceTerms}
                  onChange={(event) => setServiceTerms(event.target.checked)}
                />
                서비스 이용약관 동의 (필수)
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={privacyPolicy}
                  onChange={(event) => setPrivacyPolicy(event.target.checked)}
                />
                개인정보 수집 및 이용 동의 (필수)
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(event) => setMarketingConsent(event.target.checked)}
                />
                마케팅 정보 수신 동의 (선택)
              </label>
            </div>
          ) : (
            <div className="form-extra">
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={rememberLogin}
                  onChange={(event) => setRememberLogin(event.target.checked)}
                />
                로그인 유지
              </label>
            </div>
          )}

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
