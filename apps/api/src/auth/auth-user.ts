import { ForbiddenException } from "@nestjs/common";

export type UserRole = "user" | "owner" | "admin";

export interface AuthUser {
  id: string;
  role: UserRole;
  roles: UserRole[];
}

export function isUserRole(role: unknown): role is UserRole {
  return role === "user" || role === "owner" || role === "admin";
}

export function isUserRoles(roles: unknown): roles is UserRole[] {
  return Array.isArray(roles) && roles.length > 0 && roles.every(isUserRole);
}

export function hasRole(user: AuthUser, role: UserRole) {
  return user.roles.includes(role);
}

export function assertRole(user: AuthUser, allowedRoles: UserRole[]) {
  if (!allowedRoles.some((role) => hasRole(user, role))) {
    throw new ForbiddenException("이 API를 사용할 권한이 없습니다.");
  }
}
