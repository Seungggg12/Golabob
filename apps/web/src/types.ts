export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  maskedEmail: string;
  maskedPhone: string;
  status: "active" | "suspended" | "withdrawn";
  emailVerified: boolean;
  phoneVerified: boolean;
  role: AccountRole;
  roles: AccountRole[];
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

export interface AuthFieldErrors {
  agreements?: string;
  email?: string;
  name?: string;
  password?: string;
  passwordConfirmation?: string;
  phone?: string;
}

export interface UpdateProfileInput {
  name: string;
  email: string;
  phone: string;
}

export interface DiningRequest {
  id: number;
  userId: string;
  title: string;
  diningDate: string;
  diningTime: string;
  headCount: number;
  region: string;
  budgetPerPerson: number;
  preferredMenu: string | null;
  requiredOptions: string | null;
  memo: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiningRequestInput {
  title: string;
  diningDate: string;
  diningTime: string;
  headCount: number;
  region: string;
  budgetPerPerson: number;
  preferredMenu?: string;
  requiredOptions?: string;
  memo?: string;
}

export interface Offer {
  id: number;
  diningRequestId: number;
  restaurantId: string;
  pricePerPerson: number;
  menuDescription: string;
  serviceDescription: string | null;
  seatDescription: string | null;
  availableTime: string;
  ownerComment: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  restaurantName?: string;
  restaurantAddress?: string;
  requestTitle?: string;
  requestDiningDate?: string;
  requestDiningTime?: string;
  requestHeadCount?: number;
  requestRegion?: string;
  requestBudgetPerPerson?: number;
  requestStatus?: string;
}

export interface CreateOfferInput {
  restaurantId: string;
  pricePerPerson: number;
  menuDescription: string;
  serviceDescription?: string;
  seatDescription?: string;
  availableTime: string;
  ownerComment?: string;
}

export interface OfferRestaurant {
  id: string;
  name: string;
  address: string;
}

export interface Reservation {
  id: string;
  userId: string;
  restaurantId: string;
  diningRequestId: number;
  offerId: number;
  reservationDate: string;
  reservationTime: string;
  headCount: number;
  requestMemo: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferSelectionResponse {
  reservation: Reservation;
  offer: Offer;
}

export type AuthMode = "login" | "signup";
export type UserRole = "user" | "owner";
export type AccountRole = UserRole | "admin";
export type AppScreen =
  | "splash"
  | "roleSelection"
  | "auth"
  | "userHome"
  | "createRequest"
  | "requestWaiting"
  | "offers"
  | "confirmation"
  | "ownerHome"
  | "ownerRequestDetail"
  | "createOffer"
  | "ownerOffers"
  | "ownerOfferDetail"
  | "restaurantRegister"
  | "restaurantList"
  | "restaurantDetail"
  | "myRestaurants"
  | "myReservation"
  | "writeReview"
  | "ownerReservations"
  | "myPage";


export type Navigate = (screen: AppScreen) => void;
