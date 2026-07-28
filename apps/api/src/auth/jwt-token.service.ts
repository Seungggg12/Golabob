import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { AuthUser, isUserRole, isUserRoles } from "./auth-user";

@Injectable()
export class JwtTokenService {
  createAccessToken(user: AuthUser) {
    return jwt.sign(
      { role: user.role, roles: user.roles },
      this.getJwtSecret(),
      {
        expiresIn: "1h",
        subject: user.id,
      },
    );
  }

  verifyAccessToken(accessToken: string): AuthUser {
    try {
      const payload = jwt.verify(accessToken, this.getJwtSecret());

      if (
        !payload ||
        typeof payload === "string" ||
        typeof payload.sub !== "string" ||
        !isUserRole(payload.role)
      ) {
        throw new Error("Invalid token payload");
      }

      const roles = isUserRoles(payload.roles) ? payload.roles : [payload.role];

      if (!roles.includes(payload.role)) {
        throw new Error("Invalid token roles");
      }

      return {
        id: payload.sub,
        role: payload.role,
        roles,
      };
    } catch {
      throw new UnauthorizedException("유효하지 않은 인증 정보입니다.");
    }
  }

  private getJwtSecret() {
    if (process.env.JWT_SECRET) {
      return process.env.JWT_SECRET;
    }

    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET 환경 변수가 필요합니다.");
    }

    return "golabob-local-jwt-secret";
  }
}
