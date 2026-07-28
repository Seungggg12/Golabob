import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";
import { AuthScreen } from "./screens/AuthScreen";
import { CreateOffer } from "./screens/CreateOffer";
import { CreateRequest } from "./screens/CreateRequest";
import { MyPage } from "./screens/MyPage";
import { OfferComparison } from "./screens/OfferComparison";
import { OwnerHome } from "./screens/OwnerHome";
import { OwnerRequestDetail } from "./screens/OwnerRequestDetail";
import { RequestWaiting } from "./screens/RequestWaiting";
import { ReservationConfirmation } from "./screens/ReservationConfirmation";
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
import RestaurantRegister from "./screens/RestaurantRegister";
import RestaurantList, {
  Restaurant,
} from "./screens/RestaurantList";
import RestaurantDetail from "./screens/RestaurantDetail";
import MyRestaurants from "./screens/MyRestaurants";
import MyReservation from "./screens/MyReservation";
import { WriteReview } from "./screens/WriteReview";
import OwnerReservations from "./screens/OwnerReservations";






const defaultApiBaseUrl = "http://localhost:3000";

function App() {
  const [screen, setScreen] =
    useState<AppScreen>("splash");

  const [authMode, setAuthMode] =
    useState<AuthMode>("login");

  const [apiBaseUrl, setApiBaseUrl] =
    useState(defaultApiBaseUrl);

  const [accessToken, setAccessToken] = useState(
    () =>
      localStorage.getItem("golabobAccessToken") || "",
  );

  const [currentUser, setCurrentUser] =
    useState<PublicUser | null>(null);

  const [email, setEmail] =
    useState("user@example.com");

  const [password, setPassword] =
    useState("password1234");

  const [role, setRole] =
    useState<UserRole>("user");

  const [message, setMessage] = useState(
    "회식 조건을 올리고 맞춤 오퍼를 받아보세요.",
  );

  const [dataMessage, setDataMessage] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [myRequests, setMyRequests] = useState<
    DiningRequest[]
  >([]);

  const [ownerRequests, setOwnerRequests] =
    useState<DiningRequest[]>([]);

  const [ownerOffers, setOwnerOffers] = useState<
    Offer[]
  >([]);

  const [offers, setOffers] =
    useState<Offer[]>([]);

  const [offerRestaurants, setOfferRestaurants] =
    useState<OfferRestaurant[]>([]);

  const [selectedRequest, setSelectedRequest] =
    useState<DiningRequest | null>(null);

  const [
    selectedRestaurantId,
    setSelectedRestaurantId,
  ] = useState("");

  const [selectedRestaurant, setSelectedRestaurant] =
  useState<Restaurant | null>(null);

  const [reviewReservation, setReviewReservation] =
  useState({
    reservationId: "",
    restaurantId: "",
    restaurantName: "",
  });

  const handleWriteReview = (
    reservationId: string,
    restaurantId: string,
    restaurantName: string,
  ) => {
    setReviewReservation({
      reservationId,
      restaurantId,
      restaurantName,
    });
  
    setScreen("writeReview");
  };


  const title =
    authMode === "login"
      ? "다시 만나서 반가워요"
      : "골라밥 시작하기";

  const submitText =
    authMode === "login"
      ? "로그인"
      : "회원가입";

  const userLabel = useMemo(() => {
    if (!currentUser) {
      return "로그인 전";
    }

    return `${currentUser.email} / ${currentUser.role}`;
  }, [currentUser]);

  const requestJson = async <T,>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> => {
    const headers = new Headers(
      options.headers,
    );
    
    if (!headers.has("Content-Type")) {
      headers.set(
        "Content-Type",
        "application/json",
      );
    }
    
    if (
      accessToken &&
      !headers.has("Authorization")
    ) {
      headers.set(
        "Authorization",
        `Bearer ${accessToken}`,
      );
    }
    
    const response = await fetch(
      `${apiBaseUrl.replace(/\/$/, "")}${path}`,
      {
        ...options,
        headers,
      },
    );

    const text = await response.text();

    let body: unknown = {};

    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        throw new Error(
          "API 응답 형식이 올바르지 않습니다.",
        );
      }
    }

    if (!response.ok) {
      const errorBody = body as {
        message?: string | string[];
      };

      const errorMessage = Array.isArray(
        errorBody.message,
      )
        ? errorBody.message.join(" ")
        : errorBody.message;

      throw new Error(
        errorMessage || "요청에 실패했습니다.",
      );
    }

    return body as T;
  };

  const loadMyRequests = async () => {
    setIsLoading(true);
    setDataMessage("");

    try {
      const requests = await requestJson<
        DiningRequest[]
      >("/api/dining-requests/me");

      setMyRequests(requests);
    } catch (error) {
      setDataMessage(
        error instanceof Error
          ? error.message
          : "내 요청을 불러오지 못했습니다.",
      );
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
      const [request, receivedOffers] =
        await Promise.all([
          requestJson<DiningRequest>(
            `/api/dining-requests/${selectedRequest.id}`,
          ),
          requestJson<Offer[]>(
            `/api/dining-requests/${selectedRequest.id}/offers`,
          ),
        ]);

      setSelectedRequest(request);
      setOffers(receivedOffers);
    } catch (error) {
      setDataMessage(
        error instanceof Error
          ? error.message
          : "오퍼를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadOwnerData = async () => {
    setIsLoading(true);
    setDataMessage("");

    try {
      const [requests, sentOffers] =
        await Promise.all([
          requestJson<DiningRequest[]>(
            "/api/owner/dining-requests",
          ),
          requestJson<Offer[]>(
            "/api/owner/offers",
          ),
        ]);

      setOwnerRequests(requests);
      setOwnerOffers(sentOffers);
    } catch (error) {
      setDataMessage(
        error instanceof Error
          ? error.message
          : "요청 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadOfferRestaurants = async () => {
    setIsLoading(true);
    setDataMessage("");

    try {
      const restaurants = await requestJson<
        OfferRestaurant[]
      >("/api/owner/offers/restaurants");

      setOfferRestaurants(restaurants);
    } catch (error) {
      setDataMessage(
        error instanceof Error
          ? error.message
          : "내 식당을 불러오지 못했습니다.",
      );
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

    if (
      (screen === "requestWaiting" ||
        screen === "offers") &&
      selectedRequest
    ) {
      void loadOffers();
    }

    if (screen === "ownerHome") {
      void loadOwnerData();
    }

    if (screen === "createOffer") {
      void loadOfferRestaurants();
    }
  }, [
    screen,
    accessToken,
    selectedRequest?.id,
  ]);

  const submitAuth = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    setIsLoading(true);
    setMessage("요청을 처리하는 중입니다.");

    try {
      const path =
        authMode === "login"
          ? "/api/auth/login"
          : "/api/auth/signup";

      const payload =
        authMode === "login"
          ? {
              email,
              password,
            }
          : {
              email,
              password,
              role,
            };

      const body =
        await requestJson<AuthResponse>(path, {
          method: "POST",
          body: JSON.stringify(payload),
        });

      localStorage.setItem(
        "golabobAccessToken",
        body.accessToken,
      );

      setAccessToken(body.accessToken);
      setCurrentUser(body.user);

      setRole(
        body.user.role.toLowerCase() === "owner"
          ? "owner"
          : "user",
      );

      setMessage(
        `${body.user.email}님, 로그인되었습니다.`,
      );

      setScreen("roleSelection");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "인증에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMe = async () => {
    if (!accessToken) {
      setMessage(
        "저장된 로그인 토큰이 없습니다.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const body = await requestJson<{
        user: PublicUser;
      }>("/api/auth/me");

      setCurrentUser(body.user);

      setRole(
        body.user.role.toLowerCase() === "owner"
          ? "owner"
          : "user",
      );

      setMessage(
        `${body.user.email} 계정으로 로그인되어 있습니다.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "내 정보 조회에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createDiningRequest = async (
    input: CreateDiningRequestInput,
  ) => {
    setIsLoading(true);
    setDataMessage("");

    try {
      const request =
        await requestJson<DiningRequest>(
          "/api/dining-requests",
          {
            method: "POST",
            body: JSON.stringify(input),
          },
        );

      setSelectedRequest(request);
      setOffers([]);
      setScreen("requestWaiting");
    } catch (error) {
      setDataMessage(
        error instanceof Error
          ? error.message
          : "요청 등록에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const createOffer = async (
    input: CreateOfferInput,
  ) => {
    if (!selectedRequest) {
      setDataMessage(
        "선택된 회식 요청이 없습니다.",
      );
      return;
    }

    setIsLoading(true);
    setDataMessage("");

    try {
      await requestJson<Offer>(
        `/api/dining-requests/${selectedRequest.id}/offers`,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      );

      setScreen("ownerHome");
    } catch (error) {
      setDataMessage(
        error instanceof Error
          ? error.message
          : "오퍼 전송에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(
      "golabobAccessToken",
    );

    setAccessToken("");
    setCurrentUser(null);
    setMyRequests([]);
    setOwnerRequests([]);
    setOwnerOffers([]);
    setOffers([]);
    setOfferRestaurants([]);
    setSelectedRequest(null);
    setSelectedRestaurantId("");
    setScreen("splash");
    setMessage("로그아웃했습니다.");
    setDataMessage("");
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
          const activeRole =
            currentUser?.role.toLowerCase() ||
            role;

          setScreen(
            activeRole === "owner"
              ? "ownerHome"
              : "userHome",
          );
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

  const activeRole =
    currentUser?.role || role;

  return (
    <div className="app-frame">
      <AppHeader
        role={activeRole}
        onAuth={() => setScreen("auth")}
        onLogout={logout}
      />

      <main className="page-shell">
        {screen === "userHome" ? (
          <UserHome
            requests={myRequests}
            isLoading={isLoading}
            message={dataMessage}
            onNavigate={setScreen}
            onSelect={(request) => {
              setSelectedRequest(request);
              setScreen("requestWaiting");
            }}
          />
        ) : null}

        {screen === "createRequest" ? (
          <CreateRequest
            isLoading={isLoading}
            message={dataMessage}
            onSubmit={createDiningRequest}
          />
        ) : null}

        {screen === "requestWaiting" ? (
          <RequestWaiting
            request={selectedRequest}
            offers={offers}
            isLoading={isLoading}
            message={dataMessage}
            onNavigate={setScreen}
            onRefresh={() => {
              void loadOffers();
            }}
          />
        ) : null}

        {screen === "offers" ? (
          <OfferComparison
            onNavigate={setScreen}
            onSelectRestaurant={
              setSelectedRestaurantId
            }
          />
        ) : null}

        {screen === "confirmation" ? (
          <ReservationConfirmation
            onNavigate={setScreen}
            requestJson={requestJson}
            restaurantId={
              selectedRestaurantId
            }
          />
        ) : null}

        {screen === "ownerHome" ? (
          <OwnerHome
            requests={ownerRequests}
            offerCount={
              ownerOffers.length
            }
            isLoading={isLoading}
            message={dataMessage}
            onNavigate={setScreen}
            requestJson={requestJson}
            onSelect={(request) => {
              setSelectedRequest(request);

              setScreen(
                "ownerRequestDetail",
              );
            }}
          />
        ) : null}

        {screen === "ownerReservations" ? (
          <OwnerReservations
            onNavigate={setScreen}
            requestJson={requestJson}
          />
        ) : null}

        {screen ===
        "ownerRequestDetail" ? (
          <OwnerRequestDetail
            request={selectedRequest}
            onNavigate={setScreen}
          />
        ) : null}

        {screen === "createOffer" ? (
          <CreateOffer
            request={selectedRequest}
            restaurants={
              offerRestaurants
            }
            isLoading={isLoading}
            message={dataMessage}
            onNavigate={setScreen}
            onSubmit={createOffer}
          />
        ) : null}

        {screen === "restaurantRegister" && (
          <RestaurantRegister
            onNavigate={setScreen}
            selectedRestaurant={
              selectedRestaurant
            }
            onClearSelectedRestaurant={() =>
              setSelectedRestaurant(null)
            }
            requestJson={requestJson}
          />
        )}


        {screen === "restaurantList" ? (
          <RestaurantList
            onNavigate={setScreen}
            onSelectRestaurant={
              setSelectedRestaurant
            }
            requestJson={requestJson}
          />
        ) : null}


        {screen === "restaurantDetail" ? (
          <RestaurantDetail
          onNavigate={setScreen}
          restaurant={selectedRestaurant}
          requestJson={requestJson}
        />
        ) : null}

        {screen === "myRestaurants" ? (
          <MyRestaurants
            onNavigate={setScreen}
            onSelectRestaurant={
              setSelectedRestaurant
            }
            requestJson={requestJson}
          />
        ) : null}

        {screen === "myReservation" ? (
          <MyReservation
            onNavigate={setScreen}
            onWriteReview={
              handleWriteReview
            }
            requestJson={requestJson}
          />
        ) : null}

        {screen === "writeReview" ? (
          <WriteReview
            reservationId={
              reviewReservation.reservationId
            }
            restaurantId={
              reviewReservation.restaurantId
            }
            restaurantName={
              reviewReservation.restaurantName
            }
            onNavigate={setScreen}
            requestJson={requestJson}
          />
        ) : null}

        {screen === "myPage" ? (
          <MyPage
            userLabel={userLabel}
            role={activeRole}
            onNavigate={setScreen}
          />
        ) : null}
      </main>

      <BottomNav
        active={screen}
        role={activeRole}
        onNavigate={setScreen}
        
      />
    </div>
  );
}

export default App;