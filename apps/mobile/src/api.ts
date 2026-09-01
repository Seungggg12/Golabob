import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { Role, UserProfile } from "./types";

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
