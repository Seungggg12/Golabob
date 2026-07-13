import { ForbiddenException } from "@nestjs/common";

export type UserRole = "user" | "owner" | "admin";

export interface AuthUser {
  id: string;
  role: UserRole;
}

export function isUserRole(role: unknown): role is UserRole {
  return role === "user" || role === "owner" || role === "admin";
}

export function assertRole(user: AuthUser, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenException("이 API를 사용할 권한이 없습니다.");
  }
}
