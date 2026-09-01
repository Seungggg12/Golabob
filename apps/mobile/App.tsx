import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, BackHandler, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import {
  clearStoredSession,
  mobileAuthApi,
  mobileDiningOfferApi,
  replaceAccessToken,
  restoreAccessToken,
  restoreActiveRole,
  setUnauthorizedHandler,
  storeAccessToken,
  storeActiveRole,
} from "./src/api";
import { BottomNav } from "./src/components/navigation";
import { LoginScreen, MyPageScreen, RoleSelectionScreen, SignupScreen, SplashScreen } from "./src/screens/AuthProfileScreens";
import { CreateOfferScreen, MyRestaurantsScreen, OwnerHomeScreen, OwnerOfferDetailScreen, OwnerOfferListScreen, OwnerRequestDetailScreen, OwnerReservationsScreen, RestaurantFormScreen } from "./src/screens/OwnerScreens";
import { CreateRequestScreen, MyReservationsScreen, OfferComparisonScreen, RequestWaitingScreen, ReservationConfirmationScreen, RestaurantDetailScreen, RestaurantListScreen, UserHomeScreen, WriteReviewScreen } from "./src/screens/UserScreens";
import { mockReservations, mockRestaurants, mockUser } from "./src/mockData";
import { colors } from "./src/theme";
import { AppScreen, DiningRequest, DiningRequestDraft, Offer, OfferDraft, OfferRestaurant, Reservation, ReservationDraft, Restaurant, RestaurantDraft, ReviewDraft, Role, UserProfile } from "./src/types";

const authenticatedScreens = new Set<AppScreen>([
  "roleSelection", "userHome", "createRequest", "requestWaiting", "offers", "confirmation", "restaurantList", "restaurantDetail", "myReservation", "writeReview", "ownerHome", "ownerRequestDetail", "createOffer", "ownerOffers", "ownerOfferDetail", "myRestaurants", "restaurantRegister", "ownerReservations", "myPage",
]);

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [history, setHistory] = useState<AppScreen[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);
  const [sessionMessage, setSessionMessage] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [user, setUser] = useState<UserProfile>(mockUser);
  const [myRequests, setMyRequests] = useState<DiningRequest[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<DiningRequest[]>([]);
  const [requestOffers, setRequestOffers] = useState<Offer[]>([]);
  const [ownerOffers, setOwnerOffers] = useState<Offer[]>([]);
  const [offerRestaurants, setOfferRestaurants] = useState<OfferRestaurant[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteMessage, setRemoteMessage] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);

  const selectedRequest = [...myRequests, ...ownerRequests].find((item) => item.id === selectedRequestId) || null;
  const selectedOffer = [...requestOffers, ...ownerOffers].find((item) => item.id === selectedOfferId) || null;
  const selectedRestaurant = restaurants.find((item) => item.id === selectedRestaurantId) || null;
  const selectedReservation = reservations.find((item) => item.id === selectedReservationId) || null;
  const editingRestaurant = restaurants.find((item) => item.id === editingRestaurantId) || null;
  const ownerRestaurants = useMemo(() => restaurants.filter((item) => item.ownerId === user.id), [restaurants, user.id]);

  const navigate = useCallback((next: AppScreen) => {
    if (authenticatedScreens.has(next) && next !== "roleSelection" && !signedIn) {
      setHistory((current) => [...current, screen]);
      setScreen("login");
      return;
    }
    setHistory((current) => current[current.length - 1] === screen ? current : [...current, screen]);
    setScreen(next);
  }, [screen, signedIn]);

  const replace = useCallback((next: AppScreen) => {
    setHistory([]);
    setScreen(next);
  }, []);

  const endSession = useCallback(async (message = "") => {
    await clearStoredSession();
    setSignedIn(false);
    setRole("user");
    setSessionMessage(message);
    replace(message ? "login" : "splash");
  }, [replace]);

  useEffect(() => {
    setUnauthorizedHandler(() => endSession("로그인이 만료되었습니다. 다시 로그인해주세요."));
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      try {
        const token = await restoreAccessToken();
        if (!token) return;
        const [restoredUser, storedRole] = await Promise.all([
          mobileAuthApi.me(),
          restoreActiveRole(),
        ]);
        if (cancelled) return;
        const nextRole = storedRole && restoredUser.roles.includes(storedRole)
          ? storedRole
          : restoredUser.roles.includes("user") ? "user" : restoredUser.roles[0] || "user";
        setUser(restoredUser);
        setRole(nextRole);
        setSignedIn(true);
        replace(nextRole === "owner" ? "ownerHome" : "userHome");
      } catch {
        if (!cancelled) {
          await endSession("저장된 로그인 정보를 확인하지 못했습니다. 다시 로그인해주세요.");
        }
      } finally {
        if (!cancelled) setRestoringSession(false);
      }
    };
    void restoreSession();
    return () => { cancelled = true; };
  }, [endSession, replace]);

  const goBack = useCallback((fallback: AppScreen = role === "owner" ? "ownerHome" : "userHome") => {
    setHistory((current) => {
      const nextHistory = [...current];
      const previous = nextHistory.pop();
      setScreen(previous || fallback);
      return nextHistory;
    });
  }, [role]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (["splash", "userHome", "ownerHome"].includes(screen)) return false;
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [goBack, screen]);

  useEffect(() => {
    if (!signedIn) return;
    let active = true;

    const loadRemoteData = async () => {
      setRemoteLoading(true);
      setRemoteMessage("");
      try {
        if (screen === "userHome") {
          const nextRequests = await mobileDiningOfferApi.listMine();
          const offersByRequest = await Promise.all(
            nextRequests.map((request) => mobileDiningOfferApi.listRequestOffers(request.id)),
          );
          if (active) {
            setMyRequests(nextRequests);
            setRequestOffers(offersByRequest.flat());
          }
        } else if ((screen === "requestWaiting" || screen === "offers") && selectedRequestId) {
          const [request, nextOffers] = await Promise.all([
            mobileDiningOfferApi.getMine(selectedRequestId),
            mobileDiningOfferApi.listRequestOffers(selectedRequestId),
          ]);
          if (active) {
            setMyRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
            setRequestOffers(nextOffers);
          }
        } else if (screen === "ownerHome") {
          const [nextRequests, nextOffers] = await Promise.all([
            mobileDiningOfferApi.listOwnerRequests(),
            mobileDiningOfferApi.listOwnerOffers(),
          ]);
          if (active) {
            setOwnerRequests(nextRequests);
            setOwnerOffers(nextOffers);
          }
        } else if (screen === "ownerRequestDetail" && selectedRequestId) {
          const [request, nextOffers] = await Promise.all([
            mobileDiningOfferApi.getOwnerRequest(selectedRequestId),
            mobileDiningOfferApi.listOwnerOffers(),
          ]);
          if (active) {
            setOwnerRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
            setOwnerOffers(nextOffers);
          }
        } else if (screen === "createOffer") {
          const nextRestaurants = await mobileDiningOfferApi.listOfferRestaurants();
          if (active) setOfferRestaurants(nextRestaurants);
        } else if (screen === "ownerOffers") {
          const nextOffers = await mobileDiningOfferApi.listOwnerOffers();
          if (active) setOwnerOffers(nextOffers);
        } else if (screen === "ownerOfferDetail" && selectedOfferId) {
          const offer = await mobileDiningOfferApi.getOwnerOffer(selectedOfferId);
          if (active) setOwnerOffers((current) => [offer, ...current.filter((item) => item.id !== offer.id)]);
        }
      } catch (error) {
        if (active) setRemoteMessage(error instanceof Error ? error.message : "서버 데이터를 불러오지 못했습니다.");
      } finally {
        if (active) setRemoteLoading(false);
      }
    };

    void loadRemoteData();
    return () => { active = false; };
  }, [screen, selectedOfferId, selectedRequestId, signedIn]);

  const login = async ({ email, password, rememberLogin }: { email: string; password: string; rememberLogin: boolean }) => {
    const result = await mobileAuthApi.login(email, password);
    await storeAccessToken(result.accessToken, rememberLogin);
    const nextRole = result.user.roles.includes("user") ? "user" : result.user.roles[0] || "user";
    await storeActiveRole(nextRole);
    setUser(result.user);
    setSignedIn(true);
    setRole(nextRole);
    setSessionMessage("");
    replace("roleSelection");
  };

  const signup = async (input: { name: string; email: string; phone: string; password: string; marketingConsent: boolean }) => {
    const result = await mobileAuthApi.signup(input);
    await storeAccessToken(result.accessToken, true);
    await storeActiveRole("user");
    setUser(result.user);
    setSignedIn(true);
    setRole("user");
    setSessionMessage("");
    replace("roleSelection");
  };

  const continueWithRole = () => {
    void storeActiveRole(role);
    replace(role === "owner" ? "ownerHome" : "userHome");
  };

  const switchRole = (nextRole: Role) => {
    if (!user.roles.includes(nextRole)) return;
    void storeActiveRole(nextRole);
    setRole(nextRole);
    replace(nextRole === "owner" ? "ownerHome" : "userHome");
  };

  const activateOwner = async () => {
    const result = await mobileAuthApi.activateOwner();
    await replaceAccessToken(result.accessToken);
    await storeActiveRole("owner");
    setUser(result.user);
    setRole("owner");
    replace("ownerHome");
  };

  const logout = async () => {
    await endSession();
  };

  const updateProfile = async (profile: Pick<UserProfile, "name" | "email" | "phone">) => {
    const updatedUser = await mobileAuthApi.updateMe(profile);
    setUser(updatedUser);
  };

  const createRequest = async (draft: DiningRequestDraft) => {
    const request = await mobileDiningOfferApi.createRequest(draft);
    setMyRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
    setRequestOffers([]);
    setSelectedRequestId(request.id);
    setSelectedOfferId(null);
    navigate("requestWaiting");
  };

  const cancelRequest = async (request: DiningRequest) => {
    const canceled = await mobileDiningOfferApi.cancelRequest(request.id);
    setMyRequests((current) => [canceled, ...current.filter((item) => item.id !== canceled.id)]);
    setRequestOffers((current) => current.map((offer) =>
      offer.diningRequestId === request.id && offer.status === "pending"
        ? { ...offer, status: "canceled" }
        : offer,
    ));
    try {
      setRequestOffers(await mobileDiningOfferApi.listRequestOffers(request.id));
    } catch (error) {
      setRemoteMessage(error instanceof Error ? error.message : "최신 오퍼 상태를 불러오지 못했습니다.");
    }
  };

  const chooseOffer = async (offer: Offer) => {
    const request = myRequests.find((item) => item.id === offer.diningRequestId);
    if (!request) throw new Error("회식 요청을 찾을 수 없습니다.");
    const { offer: selected, reservation } = await mobileDiningOfferApi.selectOffer(request.id, offer.id, user);
    setMyRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: "reserved" } : item));
    setRequestOffers((current) => current.map((item) => item.diningRequestId !== request.id
      ? item
      : item.id === selected.id ? selected : item.status === "pending" ? { ...item, status: "rejected" } : item));
    setReservations((current) => [reservation, ...current]);
    setSelectedRequestId(request.id);
    setSelectedOfferId(selected.id);
    setSelectedReservationId(reservation.id);
    navigate("confirmation");
    try {
      const [updatedRequest, nextOffers] = await Promise.all([
        mobileDiningOfferApi.getMine(request.id),
        mobileDiningOfferApi.listRequestOffers(request.id),
      ]);
      setMyRequests((current) => [updatedRequest, ...current.filter((item) => item.id !== updatedRequest.id)]);
      setRequestOffers(nextOffers);
    } catch (error) {
      setRemoteMessage(error instanceof Error ? error.message : "최신 선택 상태를 불러오지 못했습니다.");
    }
  };

  const createDirectReservation = async (draft: ReservationDraft) => {
    const restaurant = restaurants.find((item) => item.id === draft.restaurantId);
    if (!restaurant) throw new Error("식당 정보를 찾을 수 없습니다.");
    const reservation: Reservation = { id: `reservation-${Date.now()}`, restaurantId: restaurant.id, restaurantName: restaurant.name, reservationDate: draft.reservationDate, reservationTime: draft.reservationTime, headCount: draft.headCount, requestMemo: draft.requestMemo, status: "pending", source: "direct", userName: user.name, userPhone: user.phone, createdAt: new Date().toISOString() };
    setReservations((current) => [reservation, ...current]);
    setSelectedReservationId(reservation.id);
    replace("myReservation");
  };

  const cancelReservation = async (reservation: Reservation) => {
    setReservations((current) => current.map((item) => item.id === reservation.id ? { ...item, status: "canceled" } : item));
  };

  const submitReview = async (review: ReviewDraft) => {
    setReservations((current) => current.map((item) => item.id === review.reservationId ? { ...item, reviewed: true } : item));
    replace("myReservation");
  };

  const createOffer = async (draft: OfferDraft) => {
    if (!selectedRequest) throw new Error("회식 요청을 찾을 수 없습니다.");
    const created = await mobileDiningOfferApi.createOffer(selectedRequest.id, draft);
    const restaurant = offerRestaurants.find((item) => item.id === created.restaurantId);
    const displayed = restaurant ? { ...created, restaurantName: restaurant.name, restaurantAddress: restaurant.address } : created;
    setOwnerOffers((current) => [displayed, ...current.filter((item) => item.id !== displayed.id)]);
    setSelectedOfferId(displayed.id);
    replace("ownerOffers");
    try {
      setOwnerOffers(await mobileDiningOfferApi.listOwnerOffers());
    } catch (error) {
      setRemoteMessage(error instanceof Error ? error.message : "최신 오퍼 목록을 불러오지 못했습니다.");
    }
  };

  const refreshSelectedRequest = async () => {
    if (!selectedRequestId) return;
    const [request, nextOffers] = await Promise.all([
      mobileDiningOfferApi.getMine(selectedRequestId),
      mobileDiningOfferApi.listRequestOffers(selectedRequestId),
    ]);
    setMyRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
    setRequestOffers(nextOffers);
  };

  const deleteRestaurant = async (restaurant: Restaurant) => {
    setRestaurants((current) => current.filter((item) => item.id !== restaurant.id));
    if (selectedRestaurantId === restaurant.id) setSelectedRestaurantId(null);
  };

  const saveRestaurant = async (draft: RestaurantDraft, restaurant?: Restaurant) => {
    if (restaurant) {
      setRestaurants((current) => current.map((item) => item.id === restaurant.id ? { ...item, ...draft, keywords: [...new Set([...draft.category.split(/[ ·,]/).filter(Boolean), ...draft.facilities])], visualColor: item.visualColor } : item));
    } else {
      const created: Restaurant = { ...draft, id: `restaurant-${Date.now()}`, ownerId: user.id, status: "pending", keywords: [...new Set([...draft.category.split(/[ ·,]/).filter(Boolean), ...draft.facilities])], visualColor: "#9BB4A8" };
      setRestaurants((current) => [created, ...current]);
    }
    setEditingRestaurantId(null);
    replace("myRestaurants");
  };

  const updateReservationStatus = async (reservation: Reservation, status: Reservation["status"]) => {
    setReservations((current) => current.map((item) => item.id === reservation.id ? { ...item, status } : item));
  };

  const openRequest = (request: DiningRequest, owner = false) => {
    setSelectedRequestId(request.id);
    setSelectedOfferId(null);
    navigate(owner ? "ownerRequestDetail" : "requestWaiting");
  };

  const openRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurantId(restaurant.id);
    navigate("restaurantDetail");
  };

  const openRestaurantFromReservation = (reservation: Reservation) => {
    setSelectedRestaurantId(reservation.restaurantId);
    navigate("restaurantDetail");
  };

  const openReview = (reservation: Reservation) => {
    setSelectedReservationId(reservation.id);
    navigate("writeReview");
  };

  const openOwnerOffer = (offer: Offer) => {
    setSelectedOfferId(offer.id);
    setSelectedRequestId(offer.diningRequestId);
    navigate("ownerOfferDetail");
  };

  const openRestaurantEditor = (restaurant?: Restaurant) => {
    setEditingRestaurantId(restaurant?.id || null);
    navigate("restaurantRegister");
  };

  let content: ReactNode;
  switch (screen) {
    case "splash":
      content = <SplashScreen onLogin={() => navigate("login")} onSignup={() => navigate("signup")} onStart={() => navigate("login")} />;
      break;
    case "login":
      content = <LoginScreen notice={sessionMessage} onBack={() => goBack("splash")} onSignup={() => navigate("signup")} onSubmit={login} />;
      break;
    case "signup":
      content = <SignupScreen onBack={() => goBack("splash")} onLogin={() => navigate("login")} onSubmit={signup} />;
      break;
    case "roleSelection":
      content = <RoleSelectionScreen onContinue={continueWithRole} onSelect={setRole} roles={user.roles} selectedRole={role} />;
      break;
    case "userHome":
      content = <UserHomeScreen offers={requestOffers} onNavigate={navigate} onSelectRequest={(request) => openRequest(request)} requests={myRequests} />;
      break;
    case "createRequest":
      content = <CreateRequestScreen onBack={() => goBack("userHome")} onSubmit={createRequest} />;
      break;
    case "requestWaiting":
      content = <RequestWaitingScreen offers={requestOffers} onBack={() => goBack("userHome")} onCancel={cancelRequest} onCompare={() => navigate("offers")} onRefresh={refreshSelectedRequest} request={selectedRequest} />;
      break;
    case "offers":
      content = <OfferComparisonScreen offers={requestOffers} onBack={() => goBack("requestWaiting")} onSelect={chooseOffer} request={selectedRequest} />;
      break;
    case "confirmation":
      content = <ReservationConfirmationScreen offer={selectedOffer} onHome={() => replace("userHome")} onReservations={() => replace("myReservation")} request={selectedRequest} reservation={selectedReservation} />;
      break;
    case "restaurantList":
      content = <RestaurantListScreen onSelectRestaurant={openRestaurant} restaurants={restaurants} />;
      break;
    case "restaurantDetail":
      content = <RestaurantDetailScreen onBack={() => goBack("restaurantList")} onReserve={createDirectReservation} restaurant={selectedRestaurant} />;
      break;
    case "myReservation":
      content = <MyReservationsScreen onCancel={cancelReservation} onOpenRestaurant={openRestaurantFromReservation} onReview={openReview} reservations={reservations} />;
      break;
    case "writeReview":
      content = <WriteReviewScreen onBack={() => goBack("myReservation")} onSubmit={submitReview} reservation={selectedReservation} />;
      break;
    case "ownerHome":
      content = <OwnerHomeScreen offers={ownerOffers} onNavigate={navigate} onSelectRequest={(request) => openRequest(request, true)} requests={ownerRequests} reservations={reservations.filter((item) => ownerRestaurants.some((restaurant) => restaurant.id === item.restaurantId))} />;
      break;
    case "ownerRequestDetail":
      content = <OwnerRequestDetailScreen offers={ownerOffers} onBack={() => goBack("ownerHome")} onCreateOffer={() => navigate("createOffer")} request={selectedRequest} />;
      break;
    case "createOffer":
      content = <CreateOfferScreen onBack={() => goBack("ownerRequestDetail")} onSubmit={createOffer} request={selectedRequest} restaurants={offerRestaurants} />;
      break;
    case "ownerOffers":
      content = <OwnerOfferListScreen offers={ownerOffers} onSelectOffer={openOwnerOffer} requests={ownerRequests} />;
      break;
    case "ownerOfferDetail":
      content = <OwnerOfferDetailScreen offer={selectedOffer} onBack={() => goBack("ownerOffers")} request={selectedRequest} />;
      break;
    case "myRestaurants":
      content = <MyRestaurantsScreen onDelete={deleteRestaurant} onEdit={openRestaurantEditor} onNavigate={(next) => next === "restaurantRegister" ? openRestaurantEditor() : navigate(next)} restaurants={ownerRestaurants} />;
      break;
    case "restaurantRegister":
      content = <RestaurantFormScreen onBack={() => goBack("myRestaurants")} onSubmit={saveRestaurant} restaurant={editingRestaurant} />;
      break;
    case "ownerReservations":
      content = <OwnerReservationsScreen onConfirm={(reservation) => updateReservationStatus(reservation, "confirmed")} onReject={(reservation) => updateReservationStatus(reservation, "rejected")} reservations={reservations} restaurants={ownerRestaurants} />;
      break;
    case "myPage":
      content = <MyPageScreen onActivateOwner={activateOwner} onLogout={() => void logout()} onNavigate={navigate} onSwitchRole={switchRole} onUpdateProfile={updateProfile} role={role} user={user} />;
      break;
    default:
      content = null;
  }

  const showNav = signedIn && authenticatedScreens.has(screen) && screen !== "roleSelection";
  if (restoringSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.restoring}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.restoringText}>로그인 상태를 확인하고 있어요.</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      <View style={styles.content}>
        {remoteLoading ? <View style={styles.remoteNotice}><ActivityIndicator color={colors.primary} size="small" /><Text style={styles.remoteText}>서버 데이터 불러오는 중</Text></View> : null}
        {remoteMessage ? <View style={styles.remoteError}><Text style={styles.remoteErrorText}>{remoteMessage}</Text></View> : null}
        {content}
      </View>
      {showNav ? <BottomNav active={screen} onNavigate={navigate} role={role} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  restoring: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  restoringText: { color: colors.muted, fontSize: 14 },
  remoteNotice: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 8, backgroundColor: colors.surface },
  remoteText: { color: colors.muted, fontSize: 12 },
  remoteError: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#FDECEC" },
  remoteErrorText: { color: colors.danger, fontSize: 12, textAlign: "center" },
});
