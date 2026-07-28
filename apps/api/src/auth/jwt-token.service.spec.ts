import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { UnauthorizedException } from "@nestjs/common";
import { JwtTokenService } from "./jwt-token.service";

describe("JwtTokenService", () => {
  it("발급한 토큰에서 사용자 ID와 역할을 복원한다", () => {
    const service = new JwtTokenService();
    const token = service.createAccessToken({
      id: "user-id",
      role: "owner",
      roles: ["user", "owner"],
    });

    assert.deepEqual(service.verifyAccessToken(token), {
      id: "user-id",
      role: "owner",
      roles: ["user", "owner"],
    });
  });

  it("변조된 토큰을 거부한다", () => {
    const service = new JwtTokenService();
    const token = service.createAccessToken({
      id: "user-id",
      role: "user",
      roles: ["user"],
    });
    const tamperedToken = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

    assert.throws(
      () => service.verifyAccessToken(tamperedToken),
      UnauthorizedException,
    );
  });
});
