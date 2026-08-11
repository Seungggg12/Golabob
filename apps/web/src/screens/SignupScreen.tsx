import { FormEvent, useState } from "react";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFieldErrors } from "../types";

interface SignupScreenProps {
  email: string;
  fieldErrors: AuthFieldErrors;
  isLoading: boolean;
  marketingConsent: boolean;
  message: string;
  name: string;
  password: string;
  passwordConfirmation: string;
  phone: string;
  privacyPolicy: boolean;
  serviceTerms: boolean;
  onBack: () => void;
  onEmailChange: (value: string) => void;
  onFieldErrorClear: (field: keyof AuthFieldErrors) => void;
  onLogin: () => void;
  onMarketingConsentChange: (value: boolean) => void;
  onNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onPasswordConfirmationChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPrivacyPolicyChange: (value: boolean) => void;
  onServiceTermsChange: (value: boolean) => void;
  onSubmit: (event: FormEvent) => void;
}

type SignupField = "name" | "email" | "phone" | "password" | "passwordConfirmation" | "agreements";
type SignupErrors = Partial<Record<SignupField, string>>;

export function SignupScreen({
  email,
  fieldErrors,
  isLoading,
  marketingConsent,
  message,
  name,
  password,
  passwordConfirmation,
  phone,
  privacyPolicy,
  serviceTerms,
  onBack,
  onEmailChange,
  onFieldErrorClear,
  onLogin,
  onMarketingConsentChange,
  onNameChange,
  onPasswordChange,
  onPasswordConfirmationChange,
  onPhoneChange,
  onPrivacyPolicyChange,
  onServiceTermsChange,
  onSubmit,
}: SignupScreenProps) {
  const [errors, setErrors] = useState<SignupErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const allAgreed = serviceTerms && privacyPolicy && marketingConsent;

  const clearError = (field: SignupField) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    onFieldErrorClear(field);
  };

  const errorFor = (field: SignupField) => errors[field] || fieldErrors[field];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: SignupErrors = {};

    if (name.trim().length < 2) {
      nextErrors.name = "이름은 2자 이상 입력해주세요.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "올바른 이메일 주소를 입력해주세요.";
    }
    if (!/^010[- ]?\d{4}[- ]?\d{4}$/.test(phone.trim())) {
      nextErrors.phone = "010으로 시작하는 휴대전화 번호를 입력해주세요.";
    }
    if (password.length < 8) {
      nextErrors.password = "비밀번호는 8자 이상 입력해주세요.";
    }
    if (!passwordConfirmation) {
      nextErrors.passwordConfirmation = "비밀번호를 다시 입력해주세요.";
    } else if (password !== passwordConfirmation) {
      nextErrors.passwordConfirmation = "비밀번호가 일치하지 않습니다.";
    }
    if (!serviceTerms || !privacyPolicy) {
      nextErrors.agreements = "필수 약관에 동의해주세요.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit(event);
    }
  };

  return (
    <AuthLayout
      alternatePrompt="이미 골라밥 계정이 있으신가요?"
      alternateAction="로그인"
      onAlternate={onLogin}
      onBack={onBack}
    >
      <header className="auth-heading">
        <p className="eyebrow">Create Account</p>
        <h2>회원가입</h2>
        <p>한 번의 가입으로 예약자와 사장님 서비스를 함께 이용할 수 있습니다.</p>
      </header>

      <form className="auth-form signup-form" onSubmit={submit} noValidate aria-busy={isLoading}>
        <div className="signup-field-grid">
          <label>
            이름
            <input
              autoComplete="name"
              placeholder="이름을 입력하세요"
              value={name}
              disabled={isLoading}
              aria-invalid={Boolean(errorFor("name"))}
              onChange={(event) => {
                onNameChange(event.target.value);
                clearError("name");
              }}
            />
            {errorFor("name") ? <small className="field-error">{errorFor("name")}</small> : null}
          </label>

          <label>
            휴대전화 번호
            <input
              autoComplete="tel"
              inputMode="tel"
              placeholder="010-1234-5678"
              value={phone}
              disabled={isLoading}
              aria-invalid={Boolean(errorFor("phone"))}
              onChange={(event) => {
                onPhoneChange(event.target.value);
                clearError("phone");
              }}
            />
            {errorFor("phone") ? <small className="field-error">{errorFor("phone")}</small> : null}
          </label>
        </div>

        <label>
          이메일
          <input
            autoComplete="email"
            inputMode="email"
            placeholder="example@golabob.com"
            type="email"
            value={email}
            disabled={isLoading}
            aria-invalid={Boolean(errorFor("email"))}
            onChange={(event) => {
              onEmailChange(event.target.value);
              clearError("email");
            }}
          />
          {errorFor("email") ? <small className="field-error">{errorFor("email")}</small> : null}
        </label>

        <div className="signup-field-grid">
          <label>
            비밀번호
            <span className="password-input">
              <input
                autoComplete="new-password"
                placeholder="8자 이상 입력"
                type={showPassword ? "text" : "password"}
                value={password}
                disabled={isLoading}
                aria-invalid={Boolean(errorFor("password"))}
                onChange={(event) => {
                  onPasswordChange(event.target.value);
                  clearError("password");
                }}
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                title={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </span>
            {errorFor("password") ? <small className="field-error">{errorFor("password")}</small> : null}
          </label>

          <label>
            비밀번호 확인
            <input
              autoComplete="new-password"
              placeholder="비밀번호를 다시 입력"
              type={showPassword ? "text" : "password"}
              value={passwordConfirmation}
              disabled={isLoading}
              aria-invalid={Boolean(errorFor("passwordConfirmation"))}
              onChange={(event) => {
                onPasswordConfirmationChange(event.target.value);
                clearError("passwordConfirmation");
              }}
            />
            {errorFor("passwordConfirmation") ? (
              <small className="field-error">{errorFor("passwordConfirmation")}</small>
            ) : null}
          </label>
        </div>

        <fieldset className="agreement-list">
          <legend>약관 동의</legend>
          <label className="check-label agreement-all">
            <input
              type="checkbox"
              checked={allAgreed}
              disabled={isLoading}
              onChange={(event) => {
                const checked = event.target.checked;
                onServiceTermsChange(checked);
                onPrivacyPolicyChange(checked);
                onMarketingConsentChange(checked);
                clearError("agreements");
              }}
            />
            전체 동의
          </label>
          <span className="agreement-divider" />
          <label className="check-label">
            <input
              type="checkbox"
              checked={serviceTerms}
              disabled={isLoading}
              onChange={(event) => {
                onServiceTermsChange(event.target.checked);
                clearError("agreements");
              }}
            />
            <span><b>필수</b> 서비스 이용약관 동의</span>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={privacyPolicy}
              disabled={isLoading}
              onChange={(event) => {
                onPrivacyPolicyChange(event.target.checked);
                clearError("agreements");
              }}
            />
            <span><b>필수</b> 개인정보 수집 및 이용 동의</span>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={marketingConsent}
              disabled={isLoading}
              onChange={(event) => onMarketingConsentChange(event.target.checked)}
            />
            <span><em>선택</em> 마케팅 정보 수신 동의</span>
          </label>
          {errorFor("agreements") ? <small className="field-error">{errorFor("agreements")}</small> : null}
        </fieldset>

        {message ? <p className="auth-feedback" role="status" aria-live="polite">{message}</p> : null}

        <button className="primary-action" type="submit" disabled={isLoading}>
          {isLoading ? "가입 중" : "회원가입"}
        </button>
      </form>
    </AuthLayout>
  );
}
