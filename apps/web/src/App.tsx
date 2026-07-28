import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";
import { BrandMark } from "./components/BrandMark";
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
import {
  AppScreen,
  AuthMode,
  AuthResponse,
  CreateDiningRequestInput,
  CreateOfferInput,
  DiningRequest,
  Offer,
  OfferRestaurant,
  PublicUser,
  UserRole,
} from "./types";

const defaultApiBaseUrl = "http://localhost:3000";
const accessTokenKey = "golabobAccessToken";
const activeRoleKey = "golabobActiveRole";
const activeRoleUserKey = "golabobActiveRoleUser";
const userScreens = new Set<AppScreen>([
  "userHome",
  "createRequest",
  "requestWaiting",
  "offers",
  "confirmation",
  "myPage",
]);
const ownerScreens = new Set<AppScreen>([
  "ownerHome",
  "ownerRequestDetail",
  "createOffer",
  "myPage",
]);

class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function readStoredAccessToken() {
  return localStorage.getItem(accessTokenKey) || sessionStorage.getItem(accessTokenKey) || "";
}

function storeAccessToken(accessToken: string, persistent: boolean) {
  const storage = persistent ? localStorage : sessionStorage;
  const otherStorage = persistent ? sessionStorage : localStorage;

  storage.setItem(accessTokenKey, accessToken);
  otherStorage.removeItem(accessTokenKey);
}

function removeStoredAccessToken() {
  localStorage.removeItem(accessTokenKey);
  sessionStorage.removeItem(accessTokenKey);
  localStorage.removeItem(activeRoleKey);
  localStorage.removeItem(activeRoleUserKey);
}

function getServiceRoles(user: PublicUser): UserRole[] {
  return user.roles.filter((role): role is UserRole => role === "user" || role === "owner");
}

function getPreferredRole(user: PublicUser): UserRole | null {
  const serviceRoles = getServiceRoles(user);
  const storedRole = localStorage.getItem(activeRoleKey);
  const storedRoleUser = localStorage.getItem(activeRoleUserKey);

  if (
    storedRoleUser === user.id &&
    (storedRole === "user" || storedRole === "owner") &&
    serviceRoles.includes(storedRole)
  ) {
    return storedRole;
  }

  if ((user.role === "user" || user.role === "owner") && serviceRoles.includes(user.role)) {
    return user.role;
  }

  return serviceRoles[0] || null;
}

function getHomeScreen(role: UserRole): AppScreen {
  return role === "owner" ? "ownerHome" : "userHome";
}

function canAccessScreen(screen: AppScreen, role: UserRole) {
  return (role === "owner" ? ownerScreens : userScreens).has(screen);
}

function App() {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [apiBaseUrl, setApiBaseUrl] = useState(defaultApiBaseUrl);
  const [accessToken, setAccessToken] = useState(readStoredAccessToken);
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password1234");
  const [rememberLogin, setRememberLogin] = useState(
    () => Boolean(localStorage.getItem(accessTokenKey)),
  );
  const [role, setRole] = useState<UserRole>("user");
  const [message, setMessage] = useState(
    "회식 조건을 올리고 맞춤 오퍼를 받아보세요.",
  );
  const [dataMessage, setDataMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(
    () => Boolean(readStoredAccessToken()),
  );
  const [myRequests, setMyRequests] = useState<DiningRequest[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<DiningRequest[]>([]);
  const [ownerOffers, setOwnerOffers] = useState<Offer[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerRestaurants, setOfferRestaurants] = useState<OfferRestaurant[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DiningRequest | null>(null);

  const title = authMode === "login" ? "다시 만나서 반가워요" : "골라밥 시작하기";
  const submitText = authMode === "login" ? "로그인" : "회원가입";
  const userLabel = useMemo(() => {
    if (!currentUser) {
      return "로그인 안 됨";
    }

    const roleLabels = getServiceRoles(currentUser).map((userRole) =>
      userRole === "owner" ? "사장님" : "예약자",
    );
    return `${currentUser.email} / ${roleLabels.join(", ")}`;
  }, [currentUser]);

  const resetDataState = () => {
    setMyRequests([]);
    setOwnerRequests([]);
    setOwnerOffers([]);
    setOffers([]);
    setOfferRestaurants([]);
    setSelectedRequest(null);
    setDataMessage("");
  };

  const selectRole = (nextRole: UserRole) => {
    if (!currentUser || !getServiceRoles(currentUser).includes(nextRole)) {
      return;
    }

    localStorage.setItem(activeRoleKey, nextRole);
    localStorage.setItem(activeRoleUserKey, currentUser.id);
    setRole(nextRole);
  };

  const switchRole = (nextRole: UserRole) => {
    selectRole(nextRole);
    resetDataState();
    setScreen(getHomeScreen(nextRole));
    setMessage(
      nextRole === "owner" ? "사장님 모드로 전환했습니다." : "예약자 모드로 전환했습니다.",
    );
  };

  const clearSession = (nextMessage: string, nextScreen: AppScreen) => {
    removeStoredAccessToken();
    setAccessToken("");
    setCurrentUser(null);
    resetDataState();
    setScreen(nextScreen);
    setMessage(nextMessage);
  };

  const requestJson = async <T,>(
    path: string,
    options: RequestInit = {},
    requestAccessToken = accessToken,
    clearOnUnauthorized = true,
  ) => {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(requestAccessToken ? { authorization: `Bearer ${requestAccessToken}` } : {}),
        ...options.headers,
      },
    });
    const body = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };

    if (!response.ok) {
      const errorMessage = Array.isArray(body.message)
        ? body.message.join(" ")
        : body.message || "요청에 실패했습니다.";
      const error = new ApiRequestError(errorMessage, response.status);

      if (response.status === 401 && clearOnUnauthorized) {
        clearSession("로그인이 만료되었습니다. 다시 로그인해주세요.", "auth");
      }

      throw error;
    }

    return body as T;
  };

  useEffect(() => {
    const storedAccessToken = readStoredAccessToken();

    if (!storedAccessToken) {
      setIsRestoringSession(false);
      return;
    }

    let cancelled = false;

    const restoreSession = async () => {
      try {
        const body = await requestJson<{ user: PublicUser }>(
          "/api/auth/me",
          {},
          storedAccessToken,
          false,
        );

        if (cancelled) {
          return;
        }

        const serviceRole = getPreferredRole(body.user);
        setAccessToken(storedAccessToken);
        setCurrentUser(body.user);

        if (!serviceRole) {
          setScreen("auth");
          setMessage("관리자 전용 화면은 아직 준비 중입니다.");
          return;
        }

        setRole(serviceRole);
        localStorage.setItem(activeRoleKey, serviceRole);
        localStorage.setItem(activeRoleUserKey, body.user.id);
        setScreen(getHomeScreen(serviceRole));
        setMessage(`${body.user.email} 계정으로 로그인되어 있습니다.`);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error instanceof ApiRequestError && error.status === 401) {
          clearSession("로그인이 만료되었습니다. 다시 로그인해주세요.", "auth");
        } else {
          setScreen("auth");
          setMessage(
            "저장된 로그인 정보를 확인하지 못했습니다. API 서버 상태를 확인해주세요.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadMyRequests = async () => {
    setIsLoading(true);
    setDataMessage("");
    try {
      setMyRequests(await requestJson<DiningRequest[]>("/api/dining-requests/me"));
    } catch (error) {
      setDataMessage(error instanceof Error ? error.message : "내 요청을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadOffers = async () => {
    if (!selectedRequest) {
      return;
    }

    setIsLoading(true);
    setDataMessage("");
    try {
      const [request, receivedOffers] = await Promise.all([
        requestJson<DiningRequest>(`/api/dining-requests/${selectedRequest.id}`),
        requestJson<Offer[]>(`/api/dining-requests/${selectedRequest.id}/offers`),
      ]);
      setSelectedRequest(request);
      setOffers(receivedOffers);
    } catch (error) {
      setDataMessage(error instanceof Error ? error.message : "오퍼를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadOwnerData = async () => {
    setIsLoading(true);
    setDataMessage("");
    try {
      const [requests, sentOffers] = await Promise.all([
        requestJson<DiningRequest[]>("/api/owner/dining-requests"),
        requestJson<Offer[]>("/api/owner/offers"),
      ]);
      setOwnerRequests(requests);
      setOwnerOffers(sentOffers);
    } catch (error) {
      setDataMessage(error instanceof Error ? error.message : "요청 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadOfferRestaurants = async () => {
    setIsLoading(true);
    setDataMessage("");
    try {
      setOfferRestaurants(
        await requestJson<OfferRestaurant[]>("/api/owner/offers/restaurants"),
      );
    } catch (error) {
      setDataMessage(error instanceof Error ? error.message : "내 식당을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    if (screen === "userHome") {
      void loadMyRequests();
    }
    if ((screen === "requestWaiting" || screen === "offers") && selectedRequest) {
      void loadOffers();
    }
    if (screen === "ownerHome") {
      void loadOwnerData();
    }
    if (screen === "createOffer") {
      void loadOfferRestaurants();
    }
  }, [screen, accessToken, selectedRequest?.id]);

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage("요청을 처리하는 중입니다.");

    try {
      const path = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload = authMode === "login" ? { email, password } : { email, password, role };
      const body = await requestJson<AuthResponse>(
        path,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        "",
        false,
      );

      storeAccessToken(body.accessToken, rememberLogin);
      setAccessToken(body.accessToken);
      setCurrentUser(body.user);

      const serviceRole = getPreferredRole(body.user);

      if (!serviceRole) {
        setScreen("auth");
        setMessage("관리자 전용 화면은 아직 준비 중입니다.");
        return;
      }

      setRole(serviceRole);
      localStorage.setItem(activeRoleKey, serviceRole);
      localStorage.setItem(activeRoleUserKey, body.user.id);
      setMessage(`${body.user.email} 계정으로 로그인했습니다.`);
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
      const serviceRoles = getServiceRoles(body.user);
      setCurrentUser(body.user);

      if (!serviceRoles.includes(role)) {
        const serviceRole = getPreferredRole(body.user);
        if (serviceRole) {
          setRole(serviceRole);
          localStorage.setItem(activeRoleKey, serviceRole);
          localStorage.setItem(activeRoleUserKey, body.user.id);
        }
      }

      setMessage(`${body.user.email} 계정으로 로그인되어 있습니다.`);
    } catch (error) {
      if (!(error instanceof ApiRequestError && error.status === 401)) {
        setMessage(error instanceof Error ? error.message : "내 정보 조회에 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createDiningRequest = async (input: CreateDiningRequestInput) => {
    setIsLoading(true);
    setDataMessage("");
    try {
      const request = await requestJson<DiningRequest>("/api/dining-requests", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setSelectedRequest(request);
      setOffers([]);
      setScreen("requestWaiting");
    } catch (error) {
      setDataMessage(error instanceof Error ? error.message : "요청 등록에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const createOffer = async (input: CreateOfferInput) => {
    if (!selectedRequest) {
      return;
    }

    setIsLoading(true);
    setDataMessage("");
    try {
      await requestJson<Offer>(`/api/dining-requests/${selectedRequest.id}/offers`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      setScreen("ownerHome");
    } catch (error) {
      setDataMessage(error instanceof Error ? error.message : "오퍼 전송에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearSession("로그아웃했습니다.", "splash");
  };

  const navigate = (nextScreen: AppScreen) => {
    const serviceRole =
      currentUser && getServiceRoles(currentUser).includes(role) ? role : null;

    if (!currentUser || !serviceRole) {
      setScreen("auth");
      setMessage("로그인이 필요한 화면입니다.");
      return;
    }

    if (!canAccessScreen(nextScreen, serviceRole)) {
      setScreen(getHomeScreen(serviceRole));
      setMessage("현재 계정 역할로 접근할 수 없는 화면입니다.");
      return;
    }

    setScreen(nextScreen);
  };

  const authScreen = (
    <AuthScreen
      apiBaseUrl={apiBaseUrl}
      authMode={authMode}
      email={email}
      fetchMe={fetchMe}
      isLoading={isLoading}
      message={message}
      password={password}
      rememberLogin={rememberLogin}
      role={role}
      setApiBaseUrl={setApiBaseUrl}
      setAuthMode={setAuthMode}
      setEmail={setEmail}
      setPassword={setPassword}
      setRememberLogin={setRememberLogin}
      setRole={setRole}
      submitAuth={submitAuth}
      submitText={submitText}
      title={title}
      userLabel={userLabel}
      onBack={() => setScreen("splash")}
      onLogout={logout}
    />
  );

  if (isRestoringSession) {
    return (
      <main className="session-loading" aria-label="로그인 상태 확인 중">
        <BrandMark />
      </main>
    );
  }

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

  if (screen === "auth") {
    return authScreen;
  }

  if (screen === "roleSelection") {
    const serviceRoles = currentUser ? getServiceRoles(currentUser) : [];

    if (!currentUser || !serviceRoles.includes(role)) {
      return authScreen;
    }

    return (
      <RoleSelection
        roles={serviceRoles}
        selectedRole={role}
        onSelect={selectRole}
        onContinue={() => setScreen(getHomeScreen(role))}
      />
    );
  }

  const activeRole =
    currentUser && getServiceRoles(currentUser).includes(role) ? role : null;

  if (!currentUser || !activeRole) {
    return authScreen;
  }

  const activeScreen = canAccessScreen(screen, activeRole)
    ? screen
    : getHomeScreen(activeRole);

  return (
    <div className="app-frame">
      <AppHeader
        role={activeRole}
        roles={getServiceRoles(currentUser)}
        onAuth={() => setScreen("auth")}
        onLogout={logout}
        onSwitchRole={switchRole}
      />
      <main className="page-shell">
        {activeScreen === "userHome" ? (
          <UserHome
            requests={myRequests}
            isLoading={isLoading}
            message={dataMessage}
            onNavigate={navigate}
            onSelect={(request) => {
              setSelectedRequest(request);
              setScreen("requestWaiting");
            }}
          />
        ) : null}
        {activeScreen === "createRequest" ? (
          <CreateRequest
            isLoading={isLoading}
            message={dataMessage}
            onSubmit={createDiningRequest}
          />
        ) : null}
        {activeScreen === "requestWaiting" ? (
          <RequestWaiting
            request={selectedRequest}
            offers={offers}
            isLoading={isLoading}
            message={dataMessage}
            onNavigate={navigate}
            onRefresh={() => void loadOffers()}
          />
        ) : null}
        {activeScreen === "offers" ? (
          <OfferComparison
            request={selectedRequest}
            offers={offers}
            message={dataMessage}
            onNavigate={navigate}
          />
        ) : null}
        {activeScreen === "confirmation" ? (
          <ReservationConfirmation onNavigate={navigate} />
        ) : null}
        {activeScreen === "ownerHome" ? (
          <OwnerHome
            requests={ownerRequests}
            offerCount={ownerOffers.length}
            isLoading={isLoading}
            message={dataMessage}
            onSelect={(request) => {
              setSelectedRequest(request);
              setScreen("ownerRequestDetail");
            }}
          />
        ) : null}
        {activeScreen === "ownerRequestDetail" ? (
          <OwnerRequestDetail request={selectedRequest} onNavigate={navigate} />
        ) : null}
        {activeScreen === "createOffer" ? (
          <CreateOffer
            request={selectedRequest}
            restaurants={offerRestaurants}
            isLoading={isLoading}
            message={dataMessage}
            onNavigate={navigate}
            onSubmit={createOffer}
          />
        ) : null}
        {activeScreen === "myPage" ? (
          <MyPage userLabel={userLabel} role={activeRole} onNavigate={navigate} />
        ) : null}
      </main>
      <BottomNav active={activeScreen} role={activeRole} onNavigate={navigate} />
    </div>
  );
}

export default App;
