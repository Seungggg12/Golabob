import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { AppScreen, AuthMode, AuthResponse, CreateDiningRequestInput, CreateOfferInput, DiningRequest, Offer, OfferRestaurant, PublicUser, UserRole } from "./types";

const defaultApiBaseUrl = "http://localhost:3000";

function App() {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [apiBaseUrl, setApiBaseUrl] = useState(defaultApiBaseUrl);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("golabobAccessToken") || "");
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password1234");
  const [role, setRole] = useState<UserRole>("user");
  const [message, setMessage] = useState("회식 조건을 올리고 맞춤 오퍼를 받아보세요.");
  const [dataMessage, setDataMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [myRequests, setMyRequests] = useState<DiningRequest[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<DiningRequest[]>([]);
  const [ownerOffers, setOwnerOffers] = useState<Offer[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerRestaurants, setOfferRestaurants] = useState<OfferRestaurant[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DiningRequest | null>(null);

  const title = authMode === "login" ? "다시 만나서 반가워요" : "골라밥 시작하기";
  const submitText = authMode === "login" ? "로그인" : "회원가입";
  const userLabel = useMemo(() => currentUser ? `${currentUser.email} / ${currentUser.role}` : "로그인 전", [currentUser]);

  const requestJson = async <T,>(path: string, options: RequestInit = {}) => {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, { ...options, headers: { "content-type": "application/json", ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}), ...options.headers } });
    const body = await response.json();
    if (!response.ok) throw new Error(Array.isArray(body.message) ? body.message.join(" ") : body.message || "요청에 실패했습니다.");
    return body as T;
  };

  const loadMyRequests = async () => {
    setIsLoading(true); setDataMessage("");
    try { setMyRequests(await requestJson<DiningRequest[]>("/api/dining-requests/me")); }
    catch (error) { setDataMessage(error instanceof Error ? error.message : "내 요청을 불러오지 못했습니다."); }
    finally { setIsLoading(false); }
  };

  const loadOffers = async () => {
    if (!selectedRequest) return;
    setIsLoading(true); setDataMessage("");
    try {
      const [request, receivedOffers] = await Promise.all([
        requestJson<DiningRequest>(`/api/dining-requests/${selectedRequest.id}`),
        requestJson<Offer[]>(`/api/dining-requests/${selectedRequest.id}/offers`),
      ]);
      setSelectedRequest(request); setOffers(receivedOffers);
    } catch (error) { setDataMessage(error instanceof Error ? error.message : "오퍼를 불러오지 못했습니다."); }
    finally { setIsLoading(false); }
  };

  const loadOwnerData = async () => {
    setIsLoading(true); setDataMessage("");
    try {
      const [requests, sentOffers] = await Promise.all([
        requestJson<DiningRequest[]>("/api/owner/dining-requests"),
        requestJson<Offer[]>("/api/owner/offers"),
      ]);
      setOwnerRequests(requests); setOwnerOffers(sentOffers);
    } catch (error) { setDataMessage(error instanceof Error ? error.message : "요청 목록을 불러오지 못했습니다."); }
    finally { setIsLoading(false); }
  };

  const loadOfferRestaurants = async () => {
    setIsLoading(true); setDataMessage("");
    try { setOfferRestaurants(await requestJson<OfferRestaurant[]>("/api/owner/offers/restaurants")); }
    catch (error) { setDataMessage(error instanceof Error ? error.message : "내 식당을 불러오지 못했습니다."); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (!accessToken) return;
    if (screen === "userHome") void loadMyRequests();
    if ((screen === "requestWaiting" || screen === "offers") && selectedRequest) void loadOffers();
    if (screen === "ownerHome") void loadOwnerData();
    if (screen === "createOffer") void loadOfferRestaurants();
  }, [screen, accessToken, selectedRequest?.id]);

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault(); setIsLoading(true); setMessage("요청을 처리하는 중입니다.");
    try {
      const path = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload = authMode === "login" ? { email, password } : { email, password, role };
      const body = await requestJson<AuthResponse>(path, { method: "POST", body: JSON.stringify(payload) });
      localStorage.setItem("golabobAccessToken", body.accessToken); setAccessToken(body.accessToken); setCurrentUser(body.user); setRole(body.user.role === "owner" ? "owner" : "user"); setScreen("roleSelection");
    } catch (error) { setMessage(error instanceof Error ? error.message : "인증에 실패했습니다."); }
    finally { setIsLoading(false); }
  };

  const fetchMe = async () => {
    if (!accessToken) return setMessage("저장된 로그인 토큰이 없습니다.");
    setIsLoading(true);
    try { const body = await requestJson<{ user: PublicUser }>("/api/auth/me"); setCurrentUser(body.user); setRole(body.user.role === "owner" ? "owner" : "user"); setMessage(`${body.user.email} 계정으로 로그인되어 있습니다.`); }
    catch (error) { setMessage(error instanceof Error ? error.message : "내 정보 조회에 실패했습니다."); }
    finally { setIsLoading(false); }
  };

  const createDiningRequest = async (input: CreateDiningRequestInput) => {
    setIsLoading(true); setDataMessage("");
    try { const request = await requestJson<DiningRequest>("/api/dining-requests", { method: "POST", body: JSON.stringify(input) }); setSelectedRequest(request); setOffers([]); setScreen("requestWaiting"); }
    catch (error) { setDataMessage(error instanceof Error ? error.message : "요청 등록에 실패했습니다."); }
    finally { setIsLoading(false); }
  };

  const createOffer = async (input: CreateOfferInput) => {
    if (!selectedRequest) return;
    setIsLoading(true); setDataMessage("");
    try { await requestJson<Offer>(`/api/dining-requests/${selectedRequest.id}/offers`, { method: "POST", body: JSON.stringify(input) }); setScreen("ownerHome"); }
    catch (error) { setDataMessage(error instanceof Error ? error.message : "오퍼 전송에 실패했습니다."); }
    finally { setIsLoading(false); }
  };

  const logout = () => { localStorage.removeItem("golabobAccessToken"); setAccessToken(""); setCurrentUser(null); setMyRequests([]); setOwnerRequests([]); setOwnerOffers([]); setOffers([]); setOfferRestaurants([]); setSelectedRequest(null); setScreen("splash"); };

  if (screen === "splash") return <SplashOnboarding onStart={() => { setAuthMode("login"); setScreen("auth"); }} />;
  if (screen === "roleSelection") return <RoleSelection role={role} setRole={setRole} onContinue={() => setScreen((currentUser?.role || role) === "owner" ? "ownerHome" : "userHome")} />;
  if (screen === "auth") return <AuthScreen apiBaseUrl={apiBaseUrl} authMode={authMode} email={email} fetchMe={fetchMe} isLoading={isLoading} message={message} password={password} role={role} setApiBaseUrl={setApiBaseUrl} setAuthMode={setAuthMode} setEmail={setEmail} setPassword={setPassword} setRole={setRole} submitAuth={submitAuth} submitText={submitText} title={title} userLabel={userLabel} onBack={() => setScreen("splash")} onLogout={logout} />;

  const activeRole = currentUser?.role || role;
  return <div className="app-frame"><AppHeader role={activeRole} onAuth={() => setScreen("auth")} onLogout={logout} /><main className="page-shell">
    {screen === "userHome" ? <UserHome requests={myRequests} isLoading={isLoading} message={dataMessage} onNavigate={setScreen} onSelect={(request) => { setSelectedRequest(request); setScreen("requestWaiting"); }} /> : null}
    {screen === "createRequest" ? <CreateRequest isLoading={isLoading} message={dataMessage} onSubmit={createDiningRequest} /> : null}
    {screen === "requestWaiting" ? <RequestWaiting request={selectedRequest} offers={offers} isLoading={isLoading} message={dataMessage} onNavigate={setScreen} onRefresh={() => void loadOffers()} /> : null}
    {screen === "offers" ? <OfferComparison request={selectedRequest} offers={offers} message={dataMessage} onNavigate={setScreen} /> : null}
    {screen === "confirmation" ? <ReservationConfirmation onNavigate={setScreen} /> : null}
    {screen === "ownerHome" ? <OwnerHome requests={ownerRequests} offerCount={ownerOffers.length} isLoading={isLoading} message={dataMessage} onSelect={(request) => { setSelectedRequest(request); setScreen("ownerRequestDetail"); }} /> : null}
    {screen === "ownerRequestDetail" ? <OwnerRequestDetail request={selectedRequest} onNavigate={setScreen} /> : null}
    {screen === "createOffer" ? <CreateOffer request={selectedRequest} restaurants={offerRestaurants} isLoading={isLoading} message={dataMessage} onNavigate={setScreen} onSubmit={createOffer} /> : null}
    {screen === "myPage" ? <MyPage userLabel={userLabel} role={activeRole} onNavigate={setScreen} /> : null}
  </main><BottomNav active={screen} role={activeRole} onNavigate={setScreen} /></div>;
}

export default App;
