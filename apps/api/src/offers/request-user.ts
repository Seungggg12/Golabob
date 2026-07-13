import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";

export type RequestUserRole = "USER" | "OWNER" | "ADMIN";

export interface RequestUser {
  id: string;
  role: RequestUserRole;
}

export function parseRequestUser(headers: Record<string, string | string[] | undefined>): RequestUser {
  const authorization = firstHeaderValue(
    headers["access-token"] || headers["Access-Token"] || headers.authorization || headers.Authorization,
  );
  const accessToken = parseAccessToken(authorization);

  if (!accessToken) {
    throw new UnauthorizedException("access-token 헤더에 accessToken을 넣어주세요.");
  }

  const payload = verifyAccessToken(accessToken);
  const role = toRequestUserRole(payload.role);

  return {
    id: payload.sub,
    role,
  };
}

export function assertRole(user: RequestUser, allowedRoles: RequestUserRole[]) {
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenException("이 API를 사용할 권한이 없습니다.");
  }
}

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseAccessToken(authorization?: string) {
  if (!authorization) {
    return "";
  }

  const value = authorization.trim();
  const bearerPrefix = "Bearer ";

  let token = value;

  while (token.toLowerCase().startsWith(bearerPrefix.toLowerCase())) {
    token = token.slice(bearerPrefix.length).trim();
  }

  return token;
}

function verifyAccessToken(accessToken: string): jwt.JwtPayload & { sub: string; role?: unknown } {
  for (const secret of getAcceptedJwtSecrets()) {
    try {
      const payload = jwt.verify(accessToken, secret);

      if (!payload || typeof payload === "string" || !payload.sub) {
        throw new Error("Missing subject");
      }

      return payload as jwt.JwtPayload & { sub: string; role?: unknown };
    } catch (error) {
      continue;
    }
  }

  throw new UnauthorizedException("유효하지 않은 인증 정보입니다.");
}

function toRequestUserRole(role: unknown): RequestUserRole {
  if (role === "guest") {
    return "USER";
  }

  if (role === "owner") {
    return "OWNER";
  }

  if (role === "admin") {
    return "ADMIN";
  }

  throw new UnauthorizedException("토큰에 유효한 역할 정보가 없습니다.");
}

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET 환경 변수가 필요합니다.");
  }

  return "golabob-local-jwt-secret";
}

function getAcceptedJwtSecrets() {
  return Array.from(new Set([getJwtSecret(), "golabob-local-jwt-secret", "local-dev-secret"]));
}
