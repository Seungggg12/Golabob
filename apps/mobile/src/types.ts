export type Role = "user" | "owner";

export type AppScreen =
  | "splash"
  | "login"
  | "signup"
  | "roleSelection"
  | "userHome"
  | "createRequest"
  | "requestWaiting"
  | "offers"
  | "confirmation"
  | "restaurantList"
  | "restaurantDetail"
  | "myReservation"
  | "writeReview"
  | "ownerHome"
  | "ownerRequestDetail"
  | "createOffer"
  | "ownerOffers"
  | "ownerOfferDetail"
  | "myRestaurants"
  | "restaurantRegister"
  | "ownerReservations"
  | "myPage";

export type Navigate = (screen: AppScreen) => void;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: Role[];
  emailVerified: boolean;
  phoneVerified: boolean;
  joinedAt: string;
}

export type DiningRequestStatus = "open" | "reserved" | "canceled" | "expired";

export interface DiningRequest {
  id: number;
  title: string;
  diningDate: string;
  diningTime: string;
  headCount: number;
  region: string;
  budgetPerPerson: number;
  preferredMenu: string;
  requiredOptions: string[];
  memo: string;
  status: DiningRequestStatus;
  createdAt: string;
}

export interface DiningRequestDraft {
  title: string;
  diningDate: string;
  diningTime: string;
  headCount: number;
  region: string;
  budgetPerPerson: number;
  preferredMenu: string;
  requiredOptions: string[];
  memo: string;
}

export type OfferStatus = "pending" | "selected" | "rejected" | "canceled" | "expired";

export interface Offer {
  id: number;
  diningRequestId: number;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  pricePerPerson: number;
  menuDescription: string;
  serviceDescription: string;
  seatDescription: string;
  availableTime: string;
  ownerComment: string;
  status: OfferStatus;
  createdAt: string;
}

export interface OfferDraft {
  restaurantId: string;
  pricePerPerson: number;
  menuDescription: string;
  serviceDescription: string;
  seatDescription: string;
  availableTime: string;
  ownerComment: string;
}

export type RestaurantStatus = "pending" | "approved" | "suspended";

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  businessHours: string;
  maxCapacity: number;
  description: string;
  facilities: string[];
  keywords: string[];
  imageUris: string[];
  visualColor: string;
  status: RestaurantStatus;
  ownerId: string;
}

export interface RestaurantDraft {
  name: string;
  category: string;
  address: string;
  phone: string;
  businessHours: string;
  maxCapacity: number;
  description: string;
  facilities: string[];
  imageUris: string[];
}

export type ReservationStatus = "pending" | "confirmed" | "completed" | "canceled" | "rejected";

export interface Reservation {
  id: string;
  restaurantId: string;
  restaurantName: string;
  reservationDate: string;
  reservationTime: string;
  headCount: number;
  requestMemo: string;
  status: ReservationStatus;
  source: "direct" | "offer";
  userName: string;
  userPhone: string;
  createdAt: string;
  reviewed?: boolean;
}

export interface ReservationDraft {
  restaurantId: string;
  reservationDate: string;
  reservationTime: string;
  headCount: number;
  requestMemo: string;
}

export interface ReviewDraft {
  reservationId: string;
  restaurantId: string;
  rating: number;
  content: string;
}

export type Feedback = { type: "success" | "error" | "info"; message: string } | null;
