import { FormEvent } from "react";

export interface PublicUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
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
  | "myPage";

export type Navigate = (screen: AppScreen) => void;

export interface AuthScreenProps {
  apiBaseUrl: string;
  authMode: AuthMode;
  email: string;
  fetchMe: () => void;
  isLoading: boolean;
  message: string;
  password: string;
  role: UserRole;
  setApiBaseUrl: (value: string) => void;
  setAuthMode: (value: AuthMode) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setRole: (value: UserRole) => void;
  submitAuth: (event: FormEvent) => void;
  submitText: string;
  title: string;
  userLabel: string;
  onBack: () => void;
  onLogout: () => void;
}
