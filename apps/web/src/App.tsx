import { FormEvent, useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";
import { AuthScreen } from "./screens/AuthScreen";
import { CreateOffer } from "./screens/CreateOffer";
import { CreateRequest } from "./screens/CreateRequest";
import { MyPage } from "./screens/MyPage";
import { OfferComparison } from "./screens/OfferComparison";
import { OwnerHome } from "./screens/OwnerHome";
import { OwnerRequestDetail } from "./screens/OwnerRequestDetail";
import { ReservationConfirmation } from "./screens/ReservationConfirmation";
import { RequestWaiting } from "./screens/RequestWaiting";
import { RoleSelection } from "./screens/RoleSelection";
import { SplashOnboarding } from "./screens/SplashOnboarding";
import { UserHome } from "./screens/UserHome";
import { AppScreen, AuthMode, AuthResponse, PublicUser, UserRole } from "./types";

const defaultApiBaseUrl = "http://localhost:3000";

function App() {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [apiBaseUrl, setApiBaseUrl] = useState(defaultApiBaseUrl);
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem("golabobAccessToken") || "",
  );
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password1234");
  const [role, setRole] = useState<UserRole>("user");
  const [message, setMessage] = useState("회식 조건을 올리고 맞춤 오퍼를 받아보세요.");
  const [isLoading, setIsLoading] = useState(false);

  const title = authMode === "login" ? "다시 만나서 반가워요" : "골라밥 시작하기";
  const submitText = authMode === "login" ? "로그인" : "회원가입";
  const userLabel = useMemo(() => {
    if (!currentUser) {
      return "로그인 전";
    }

    return `${currentUser.email} / ${currentUser.role}`;
  }, [currentUser]);

  const requestJson = async <T,>(path: string, options: RequestInit = {}) => {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || "요청에 실패했습니다.");
    }

    return body as T;
  };

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("요청을 처리하는 중입니다.");

    try {
      const path = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload =
        authMode === "login" ? { email, password } : { email, password, role };
      const body = await requestJson<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("golabobAccessToken", body.accessToken);
      setAccessToken(body.accessToken);
      setCurrentUser(body.user);
      setRole(body.user.role === "owner" ? "owner" : "user");
      setMessage(`${body.user.email}님, 회식 요청을 등록할 준비가 됐습니다.`);
      setScreen("roleSelection");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "요청에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMe = async () => {
    if (!accessToken) {
      setMessage("저장된 로그인 토큰이 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const body = await requestJson<{ user: PublicUser }>("/api/auth/me");
      setCurrentUser(body.user);
      setMessage(`${body.user.email} 계정으로 로그인되어 있습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "내 정보 조회에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("golabobAccessToken");
    setAccessToken("");
    setCurrentUser(null);
    setScreen("splash");
    setMessage("로그아웃했습니다.");
  };

  if (screen === "splash") {
    return (
      <SplashOnboarding
        onStart={() => {
          setAuthMode("login");
          setScreen("auth");
        }}
      />
    );
  }

  if (screen === "roleSelection") {
    return (
      <RoleSelection
        role={role}
        setRole={setRole}
        onContinue={() => {
          setScreen(role === "owner" ? "ownerHome" : "userHome");
        }}
      />
    );
  }

  if (screen === "auth") {
    return (
      <AuthScreen
        apiBaseUrl={apiBaseUrl}
        authMode={authMode}
        email={email}
        fetchMe={fetchMe}
        isLoading={isLoading}
        message={message}
        password={password}
        role={role}
        setApiBaseUrl={setApiBaseUrl}
        setAuthMode={setAuthMode}
        setEmail={setEmail}
        setPassword={setPassword}
        setRole={setRole}
        submitAuth={submitAuth}
        submitText={submitText}
        title={title}
        userLabel={userLabel}
        onBack={() => setScreen("splash")}
        onLogout={logout}
      />
    );
  }

  const activeRole = currentUser?.role || role;

  return (
    <div className="app-frame">
      <AppHeader role={activeRole} onAuth={() => setScreen("auth")} onLogout={logout} />
      <main className="page-shell">
        {screen === "userHome" ? <UserHome onNavigate={setScreen} /> : null}
        {screen === "createRequest" ? <CreateRequest onNavigate={setScreen} /> : null}
        {screen === "requestWaiting" ? <RequestWaiting onNavigate={setScreen} /> : null}
        {screen === "offers" ? <OfferComparison onNavigate={setScreen} /> : null}
        {screen === "confirmation" ? <ReservationConfirmation onNavigate={setScreen} /> : null}
        {screen === "ownerHome" ? <OwnerHome onNavigate={setScreen} /> : null}
        {screen === "ownerRequestDetail" ? <OwnerRequestDetail onNavigate={setScreen} /> : null}
        {screen === "createOffer" ? <CreateOffer onNavigate={setScreen} /> : null}
        {screen === "myPage" ? <MyPage userLabel={userLabel} onNavigate={setScreen} /> : null}
      </main>
      <BottomNav active={screen} role={activeRole} onNavigate={setScreen} />
    </div>
  );
}

export default App;
