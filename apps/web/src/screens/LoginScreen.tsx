import { FormEvent, useState } from "react";
import { AuthLayout } from "../components/AuthLayout";
import { AuthFieldErrors } from "../types";

interface LoginScreenProps {
  email: string;
  fieldErrors: AuthFieldErrors;
  isLoading: boolean;
  message: string;
  password: string;
  rememberLogin: boolean;
  onBack: () => void;
  onEmailChange: (value: string) => void;
  onFieldErrorClear: (field: keyof AuthFieldErrors) => void;
  onPasswordChange: (value: string) => void;
  onRememberLoginChange: (value: boolean) => void;
  onSignup: () => void;
  onSubmit: (event: FormEvent) => void;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

export function LoginScreen({
  email,
  fieldErrors,
  isLoading,
  message,
  password,
  rememberLogin,
  onBack,
  onEmailChange,
  onFieldErrorClear,
  onPasswordChange,
  onRememberLoginChange,
  onSignup,
  onSubmit,
}: LoginScreenProps) {
  const [errors, setErrors] = useState<LoginErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const emailError = errors.email || fieldErrors.email;
  const passwordError = errors.password || fieldErrors.password;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: LoginErrors = {};

    if (!email.trim()) {
      nextErrors.email = "이메일을 입력해주세요.";
    }
    if (!password) {
      nextErrors.password = "비밀번호를 입력해주세요.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit(event);
    }
  };

  return (
    <AuthLayout
      alternatePrompt="아직 골라밥 계정이 없으신가요?"
      alternateAction="회원가입"
      onAlternate={onSignup}
      onBack={onBack}
    >
      <header className="auth-heading">
        <p className="eyebrow">Welcome Back</p>
        <h2>로그인</h2>
        <p>받은 오퍼와 예약 현황을 이어서 확인하세요.</p>
      </header>

      <form className="auth-form" onSubmit={submit} noValidate aria-busy={isLoading}>
        <label>
          이메일
          <input
            autoComplete="email"
            inputMode="email"
            placeholder="example@golabob.com"
            type="email"
            value={email}
            disabled={isLoading}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "login-email-error" : undefined}
            onChange={(event) => {
              onEmailChange(event.target.value);
              onFieldErrorClear("email");
              setErrors((current) => ({ ...current, email: undefined }));
            }}
          />
          {emailError ? <small id="login-email-error" className="field-error">{emailError}</small> : null}
        </label>

        <label>
          비밀번호
          <span className="password-input">
            <input
              autoComplete="current-password"
              placeholder="비밀번호를 입력하세요"
              type={showPassword ? "text" : "password"}
              value={password}
              disabled={isLoading}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? "login-password-error" : undefined}
              onChange={(event) => {
                onPasswordChange(event.target.value);
                onFieldErrorClear("password");
                setErrors((current) => ({ ...current, password: undefined }));
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
          {passwordError ? <small id="login-password-error" className="field-error">{passwordError}</small> : null}
        </label>

        <label className="check-label login-remember">
          <input
            type="checkbox"
            checked={rememberLogin}
            disabled={isLoading}
            onChange={(event) => onRememberLoginChange(event.target.checked)}
          />
          로그인 상태 유지
        </label>

        {message ? <p className="auth-feedback" role="status" aria-live="polite">{message}</p> : null}

        <button className="primary-action" type="submit" disabled={isLoading}>
          {isLoading ? "로그인 중" : "로그인"}
        </button>
      </form>
    </AuthLayout>
  );
}
