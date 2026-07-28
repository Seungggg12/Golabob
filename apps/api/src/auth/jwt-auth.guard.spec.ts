import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtTokenService } from "./jwt-token.service";
import { RequestWithUser } from "./request-with-user";

function createContext(request: RequestWithUser) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe("JwtAuthGuard", () => {
  it("Bearer 토큰을 검증하고 현재 사용자를 요청에 저장한다", () => {
    const tokenService = new JwtTokenService();
    const guard = new JwtAuthGuard(tokenService);
    const token = tokenService.createAccessToken({
      id: "owner-id",
      role: "owner",
      roles: ["user", "owner"],
    });
    const request: RequestWithUser = {
      headers: { authorization: `Bearer ${token}` },
    };

    assert.equal(guard.canActivate(createContext(request)), true);
    assert.deepEqual(request.user, {
      id: "owner-id",
      role: "owner",
      roles: ["user", "owner"],
    });
  });

  it("Authorization 헤더가 없으면 요청을 거부한다", () => {
    const guard = new JwtAuthGuard(new JwtTokenService());
    const request: RequestWithUser = { headers: {} };

    assert.throws(
      () => guard.canActivate(createContext(request)),
      UnauthorizedException,
    );
  });
});
