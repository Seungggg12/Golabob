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
