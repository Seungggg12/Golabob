import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler, SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { BottomNav } from "./src/components/navigation";
import { LoginScreen, MyPageScreen, RoleSelectionScreen, SignupScreen, SplashScreen } from "./src/screens/AuthProfileScreens";
import { CreateOfferScreen, MyRestaurantsScreen, OwnerHomeScreen, OwnerOfferDetailScreen, OwnerOfferListScreen, OwnerRequestDetailScreen, OwnerReservationsScreen, RestaurantFormScreen } from "./src/screens/OwnerScreens";
import { CreateRequestScreen, MyReservationsScreen, OfferComparisonScreen, RequestWaitingScreen, ReservationConfirmationScreen, RestaurantDetailScreen, RestaurantListScreen, UserHomeScreen, WriteReviewScreen } from "./src/screens/UserScreens";
import { mockOffers, mockRequests, mockReservations, mockRestaurants, mockUser } from "./src/mockData";
import { colors } from "./src/theme";
import { AppScreen, DiningRequest, DiningRequestDraft, Offer, OfferDraft, Reservation, ReservationDraft, Restaurant, RestaurantDraft, ReviewDraft, Role, UserProfile } from "./src/types";

const authenticatedScreens = new Set<AppScreen>([
  "roleSelection", "userHome", "createRequest", "requestWaiting", "offers", "confirmation", "restaurantList", "restaurantDetail", "myReservation", "writeReview", "ownerHome", "ownerRequestDetail", "createOffer", "ownerOffers", "ownerOfferDetail", "myRestaurants", "restaurantRegister", "ownerReservations", "myPage",
]);

/**
 * Mobile UI state is intentionally backed by in-memory data for now.
 * Every mutation below is the API integration boundary: replace its local
 * state update with the matching HTTP call, then keep the same screen props.
 */
export default function App() {
  const [screen, setScreen] = useState<AppScreen>("splash");
  const [history, setHistory] = useState<AppScreen[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [role, setRole] = useState<Role>("user");
  const [user, setUser] = useState<UserProfile>(mockUser);
  const [requests, setRequests] = useState<DiningRequest[]>(mockRequests);
  const [offers, setOffers] = useState<Offer[]>(mockOffers);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(mockRequests[0]?.id ?? null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);

  const selectedRequest = requests.find((item) => item.id === selectedRequestId) || null;
  const selectedOffer = offers.find((item) => item.id === selectedOfferId) || null;
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

  const login = async ({ email }: { email: string; password: string; rememberLogin: boolean }) => {
    setUser((current) => ({ ...current, email }));
    setSignedIn(true);
    setRole(user.roles.includes("user") ? "user" : user.roles[0] || "user");
    replace("roleSelection");
  };

  const signup = async ({ name, email, phone }: { name: string; email: string; phone: string; password: string; marketingConsent: boolean }) => {
    setUser({ id: `user-${Date.now()}`, name, email, phone, roles: ["user"], emailVerified: false, phoneVerified: false, joinedAt: new Date().toISOString().slice(0, 10) });
    setSignedIn(true);
    setRole("user");
    replace("roleSelection");
  };

  const continueWithRole = () => replace(role === "owner" ? "ownerHome" : "userHome");

  const switchRole = (nextRole: Role) => {
    if (!user.roles.includes(nextRole)) return;
    setRole(nextRole);
    replace(nextRole === "owner" ? "ownerHome" : "userHome");
  };

  const activateOwner = async () => {
    setUser((current) => current.roles.includes("owner") ? current : { ...current, roles: [...current.roles, "owner"] });
    setRole("owner");
    replace("ownerHome");
  };

  const logout = () => {
    setSignedIn(false);
    setRole("user");
    replace("splash");
  };

  const createRequest = async (draft: DiningRequestDraft) => {
    const request: DiningRequest = { ...draft, id: Math.max(0, ...requests.map((item) => item.id)) + 1, status: "open", createdAt: new Date().toISOString() };
    setRequests((current) => [request, ...current]);
    setSelectedRequestId(request.id);
    setSelectedOfferId(null);
    navigate("requestWaiting");
  };

  const cancelRequest = async (request: DiningRequest) => {
    setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: "canceled" } : item));
    setOffers((current) => current.map((offer) => offer.diningRequestId === request.id && offer.status === "pending" ? { ...offer, status: "canceled" } : offer));
  };

  const chooseOffer = async (offer: Offer) => {
    const request = requests.find((item) => item.id === offer.diningRequestId);
    if (!request) throw new Error("회식 요청을 찾을 수 없습니다.");
    setOffers((current) => current.map((item) => item.diningRequestId !== offer.diningRequestId ? item : { ...item, status: item.id === offer.id ? "selected" : item.status === "pending" ? "rejected" : item.status }));
    setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: "reserved" } : item));
    const reservation: Reservation = {
      id: `reservation-${Date.now()}`,
      restaurantId: offer.restaurantId,
      restaurantName: offer.restaurantName,
      reservationDate: request.diningDate,
      reservationTime: offer.availableTime || request.diningTime,
      headCount: request.headCount,
      requestMemo: request.memo,
      status: "confirmed",
      source: "offer",
      userName: user.name,
      userPhone: user.phone,
      createdAt: new Date().toISOString(),
    };
    setReservations((current) => [reservation, ...current]);
    setSelectedRequestId(request.id);
    setSelectedOfferId(offer.id);
    setSelectedReservationId(reservation.id);
    navigate("confirmation");
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
    const restaurant = restaurants.find((item) => item.id === draft.restaurantId);
    if (!restaurant) throw new Error("식당 정보를 찾을 수 없습니다.");
    const offer: Offer = { ...draft, id: Math.max(0, ...offers.map((item) => item.id)) + 1, diningRequestId: selectedRequest.id, restaurantName: restaurant.name, restaurantAddress: restaurant.address, status: "pending", createdAt: new Date().toISOString() };
    setOffers((current) => [offer, ...current]);
    setSelectedOfferId(offer.id);
    replace("ownerOffers");
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
      content = <LoginScreen onBack={() => goBack("splash")} onSignup={() => navigate("signup")} onSubmit={login} />;
      break;
    case "signup":
      content = <SignupScreen onBack={() => goBack("splash")} onLogin={() => navigate("login")} onSubmit={signup} />;
      break;
    case "roleSelection":
      content = <RoleSelectionScreen onContinue={continueWithRole} onSelect={setRole} roles={user.roles} selectedRole={role} />;
      break;
    case "userHome":
      content = <UserHomeScreen offers={offers} onNavigate={navigate} onSelectRequest={(request) => openRequest(request)} requests={requests} />;
      break;
    case "createRequest":
      content = <CreateRequestScreen onBack={() => goBack("userHome")} onSubmit={createRequest} />;
      break;
    case "requestWaiting":
      content = <RequestWaitingScreen offers={offers} onBack={() => goBack("userHome")} onCancel={cancelRequest} onCompare={() => navigate("offers")} onRefresh={() => undefined} request={selectedRequest} />;
      break;
    case "offers":
      content = <OfferComparisonScreen offers={offers} onBack={() => goBack("requestWaiting")} onSelect={chooseOffer} request={selectedRequest} />;
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
      content = <OwnerHomeScreen offers={offers.filter((item) => ownerRestaurants.some((restaurant) => restaurant.id === item.restaurantId))} onNavigate={navigate} onSelectRequest={(request) => openRequest(request, true)} requests={requests} reservations={reservations.filter((item) => ownerRestaurants.some((restaurant) => restaurant.id === item.restaurantId))} />;
      break;
    case "ownerRequestDetail":
      content = <OwnerRequestDetailScreen offers={offers.filter((item) => ownerRestaurants.some((restaurant) => restaurant.id === item.restaurantId))} onBack={() => goBack("ownerHome")} onCreateOffer={() => navigate("createOffer")} request={selectedRequest} />;
      break;
    case "createOffer":
      content = <CreateOfferScreen onBack={() => goBack("ownerRequestDetail")} onSubmit={createOffer} request={selectedRequest} restaurants={ownerRestaurants} />;
      break;
    case "ownerOffers":
      content = <OwnerOfferListScreen offers={offers.filter((item) => ownerRestaurants.some((restaurant) => restaurant.id === item.restaurantId))} onSelectOffer={openOwnerOffer} requests={requests} />;
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
      content = <MyPageScreen onActivateOwner={activateOwner} onLogout={logout} onNavigate={navigate} onSwitchRole={switchRole} onUpdateProfile={async (profile) => setUser((current) => ({ ...current, ...profile }))} role={role} user={user} />;
      break;
    default:
      content = null;
  }

  const showNav = signedIn && authenticatedScreens.has(screen) && screen !== "roleSelection";
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      <View style={styles.content}>{content}</View>
      {showNav ? <BottomNav active={screen} onNavigate={navigate} role={role} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
});
