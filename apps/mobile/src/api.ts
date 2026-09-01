import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  DiningRequest,
  DiningRequestDraft,
  DiningRequestStatus,
  Offer,
  OfferDraft,
  OfferRestaurant,
  OfferStatus,
  Reservation,
  Role,
  UserProfile,
} from "./types";

const accessTokenKey = "golabob.accessToken";
const activeRoleKey = "golabob.activeRole";
const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const apiBaseUrl = (
  configuredApiBaseUrl ||
  (Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000")
).replace(/\/$/, "");

let accessToken = "";
let persistentSession = false;
let unauthorizedHandler: (() => void | Promise<void>) | null = null;

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function setUnauthorizedHandler(handler: (() => void | Promise<void>) | null) {
  unauthorizedHandler = handler;
}

export async function restoreAccessToken() {
  try {
    accessToken = (await SecureStore.getItemAsync(accessTokenKey)) || "";
    persistentSession = Boolean(accessToken);
  } catch {
    accessToken = "";
    persistentSession = false;
  }
  return accessToken;
}

export async function storeAccessToken(token: string, persistent: boolean) {
  accessToken = token;
  persistentSession = persistent;
  if (persistent) {
    await SecureStore.setItemAsync(accessTokenKey, token);
  } else {
    await SecureStore.deleteItemAsync(accessTokenKey);
  }
}

export async function replaceAccessToken(token: string) {
  await storeAccessToken(token, persistentSession);
}

export async function clearStoredSession() {
  accessToken = "";
  persistentSession = false;
  await Promise.all([
    SecureStore.deleteItemAsync(accessTokenKey),
    SecureStore.deleteItemAsync(activeRoleKey),
  ]);
}

export async function restoreActiveRole(): Promise<Role | null> {
  try {
    const role = await SecureStore.getItemAsync(activeRoleKey);
    return role === "user" || role === "owner" ? role : null;
  } catch {
    return null;
  }
}

export async function storeActiveRole(role: Role) {
  if (persistentSession) {
    await SecureStore.setItemAsync(activeRoleKey, role);
  }
}

async function requestJson<T>(path: string, options: RequestInit = {}, authenticated = true) {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(authenticated && accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `API 서버에 연결할 수 없습니다. EXPO_PUBLIC_API_BASE_URL(${apiBaseUrl})을 확인해주세요.`,
    );
  }

  const body = (await response.json().catch(() => ({}))) as { message?: string | string[] };
  if (!response.ok) {
    const message = Array.isArray(body.message)
      ? body.message.join(" ")
      : body.message || "요청에 실패했습니다.";
    if (response.status === 401 && authenticated && accessToken && unauthorizedHandler) {
      await unauthorizedHandler();
    }
    throw new ApiRequestError(message, response.status);
  }
  return body as T;
}

interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  maskedEmail: string;
  maskedPhone: string;
  status: "active" | "suspended" | "withdrawn";
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: Array<Role | "admin">;
}

interface AuthResponse {
  user: ApiUser;
  accessToken: string;
}

function toUserProfile(user: ApiUser): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    maskedEmail: user.maskedEmail,
    maskedPhone: user.maskedPhone,
    status: user.status,
    roles: user.roles.filter((role): role is Role => role === "user" || role === "owner"),
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
  };
}

export const mobileAuthApi = {
  async login(email: string, password: string) {
    const result = await requestJson<AuthResponse>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false,
    );
    return { accessToken: result.accessToken, user: toUserProfile(result.user) };
  },
  async signup(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    marketingConsent: boolean;
  }) {
    const result = await requestJson<AuthResponse>(
      "/api/auth/signup",
      {
        method: "POST",
        body: JSON.stringify({
          ...input,
          agreements: {
            serviceTerms: true,
            privacyPolicy: true,
            marketingConsent: input.marketingConsent,
          },
        }),
      },
      false,
    );
    return { accessToken: result.accessToken, user: toUserProfile(result.user) };
  },
  async me() {
    const result = await requestJson<{ user: ApiUser }>("/api/auth/me");
    return toUserProfile(result.user);
  },
  async updateMe(input: Pick<UserProfile, "name" | "email" | "phone">) {
    const result = await requestJson<{ user: ApiUser }>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return toUserProfile(result.user);
  },
  async activateOwner() {
    const result = await requestJson<AuthResponse>("/api/auth/owner-role", { method: "POST" });
    return { accessToken: result.accessToken, user: toUserProfile(result.user) };
  },
};

interface ApiDiningRequest {
  id: string;
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

interface ApiOffer {
  id: string;
  diningRequestId: string;
  restaurantId: string;
  restaurantName?: string;
  restaurantAddress?: string;
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
  requestTitle?: string;
  requestDiningDate?: string;
  requestDiningTime?: string;
  requestHeadCount?: number;
  requestRegion?: string;
  requestBudgetPerPerson?: number;
  requestStatus?: string;
}

interface ApiReservation {
  id: string;
  restaurantId: string;
  diningRequestId: string;
  offerId: string;
  reservationDate: string;
  reservationTime: string;
  headCount: number;
  requestMemo: string | null;
  status: string;
  createdAt: string;
}

const normalizeDate = (value: string) => /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0] || value;
const normalizeTime = (value: string) => value.length >= 5 ? value.slice(0, 5) : value;
const requestStatus = (value: string): DiningRequestStatus =>
  ["open", "reserved", "canceled", "expired"].includes(value) ? value as DiningRequestStatus : "expired";
const offerStatus = (value: string): OfferStatus =>
  ["pending", "selected", "rejected", "canceled", "expired"].includes(value) ? value as OfferStatus : "expired";

function toDiningRequest(item: ApiDiningRequest): DiningRequest {
  return {
    id: String(item.id),
    title: item.title,
    diningDate: normalizeDate(item.diningDate),
    diningTime: normalizeTime(item.diningTime),
    headCount: item.headCount,
    region: item.region,
    budgetPerPerson: item.budgetPerPerson,
    preferredMenu: item.preferredMenu || "",
    requiredOptions: item.requiredOptions?.split(",").map((value) => value.trim()).filter(Boolean) || [],
    memo: item.memo || "",
    status: requestStatus(item.status),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function toOffer(item: ApiOffer): Offer {
  return {
    id: String(item.id),
    diningRequestId: String(item.diningRequestId),
    restaurantId: item.restaurantId,
    restaurantName: item.restaurantName || `식당 #${item.restaurantId.slice(0, 8)}`,
    restaurantAddress: item.restaurantAddress || "식당 주소 정보 없음",
    pricePerPerson: item.pricePerPerson,
    menuDescription: item.menuDescription,
    serviceDescription: item.serviceDescription || "",
    seatDescription: item.seatDescription || "",
    availableTime: normalizeTime(item.availableTime),
    ownerComment: item.ownerComment || "",
    status: offerStatus(item.status),
    expiresAt: item.expiresAt || undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    requestTitle: item.requestTitle,
    requestDiningDate: item.requestDiningDate ? normalizeDate(item.requestDiningDate) : undefined,
    requestDiningTime: item.requestDiningTime ? normalizeTime(item.requestDiningTime) : undefined,
    requestHeadCount: item.requestHeadCount,
    requestRegion: item.requestRegion,
    requestBudgetPerPerson: item.requestBudgetPerPerson,
    requestStatus: item.requestStatus ? requestStatus(item.requestStatus) : undefined,
  };
}

const requestPayload = (draft: DiningRequestDraft) => ({
  ...draft,
  preferredMenu: draft.preferredMenu || undefined,
  requiredOptions: draft.requiredOptions.join(", ") || undefined,
  memo: draft.memo || undefined,
});

const offerPayload = (draft: OfferDraft) => ({
  ...draft,
  serviceDescription: draft.serviceDescription || undefined,
  seatDescription: draft.seatDescription || undefined,
  ownerComment: draft.ownerComment || undefined,
});

export const mobileDiningOfferApi = {
  async listMine() {
    return (await requestJson<ApiDiningRequest[]>("/api/dining-requests/me?limit=100")).map(toDiningRequest);
  },
  async getMine(requestId: string) {
    return toDiningRequest(await requestJson<ApiDiningRequest>(`/api/dining-requests/${requestId}`));
  },
  async createRequest(draft: DiningRequestDraft) {
    return toDiningRequest(await requestJson<ApiDiningRequest>("/api/dining-requests", {
      method: "POST",
      body: JSON.stringify(requestPayload(draft)),
    }));
  },
  async cancelRequest(requestId: string) {
    return toDiningRequest(await requestJson<ApiDiningRequest>(`/api/dining-requests/${requestId}/cancel`, { method: "PATCH" }));
  },
  async listRequestOffers(requestId: string) {
    return (await requestJson<ApiOffer[]>(`/api/dining-requests/${requestId}/offers?limit=100`)).map(toOffer);
  },
  async selectOffer(requestId: string, offerId: string, user: UserProfile) {
    const result = await requestJson<{ offer: ApiOffer; reservation: ApiReservation }>(
      `/api/dining-requests/${requestId}/offers/${offerId}/select`,
      { method: "POST" },
    );
    const offer = toOffer(result.offer);
    const reservation: Reservation = {
      id: result.reservation.id,
      restaurantId: result.reservation.restaurantId,
      restaurantName: offer.restaurantName,
      reservationDate: normalizeDate(result.reservation.reservationDate),
      reservationTime: normalizeTime(result.reservation.reservationTime),
      headCount: result.reservation.headCount,
      requestMemo: result.reservation.requestMemo || "",
      status: result.reservation.status === "confirmed" ? "confirmed" : "pending",
      source: "offer",
      userName: user.name,
      userPhone: user.phone,
      createdAt: result.reservation.createdAt,
      diningRequestId: result.reservation.diningRequestId,
      offerId: result.reservation.offerId,
    };
    return { offer, reservation };
  },
  async listOwnerRequests() {
    return (await requestJson<ApiDiningRequest[]>("/api/owner/dining-requests?limit=100")).map(toDiningRequest);
  },
  async getOwnerRequest(requestId: string) {
    return toDiningRequest(await requestJson<ApiDiningRequest>(`/api/owner/dining-requests/${requestId}`));
  },
  async listOwnerOffers() {
    return (await requestJson<ApiOffer[]>("/api/owner/offers?limit=100")).map(toOffer);
  },
  async getOwnerOffer(offerId: string) {
    return toOffer(await requestJson<ApiOffer>(`/api/owner/offers/${offerId}`));
  },
  async listOfferRestaurants() {
    return requestJson<OfferRestaurant[]>("/api/owner/offers/restaurants");
  },
  async createOffer(requestId: string, draft: OfferDraft) {
    return toOffer(await requestJson<ApiOffer>(`/api/dining-requests/${requestId}/offers`, {
      method: "POST",
      body: JSON.stringify(offerPayload(draft)),
    }));
  },
};
