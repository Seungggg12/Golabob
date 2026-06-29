import { ForbiddenException, UnauthorizedException } from "@nestjs/common";

export type RequestUserRole = "USER" | "OWNER" | "ADMIN";

export interface RequestUser {
  id: string;
  role: RequestUserRole;
}

export function parseRequestUser(headers: Record<string, string | string[] | undefined>): RequestUser {
  const userId = firstHeaderValue(headers["x-user-id"]);
  const role = firstHeaderValue(headers["x-user-role"]) as RequestUserRole | undefined;

  if (!userId) {
    throw new UnauthorizedException("x-user-id 헤더에 임시 사용자 id를 넣어주세요.");
  }

  if (!role || !["USER", "OWNER", "ADMIN"].includes(role)) {
    throw new UnauthorizedException("x-user-role 헤더에는 USER, OWNER, ADMIN 중 하나를 넣어주세요.");
  }

  return {
    id: userId,
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
