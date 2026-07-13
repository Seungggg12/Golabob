import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RequestWithUser } from "./request-with-user";
import { RolesGuard } from "./roles.guard";

function createGuard(requiredRoles: string[]) {
  const reflector = {
    getAllAndOverride: () => requiredRoles,
  } as unknown as Reflector;

  return new RolesGuard(reflector);
}

function createContext(request: RequestWithUser) {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  it("허용된 역할의 요청을 통과시킨다", () => {
    const guard = createGuard(["owner"]);
    const request: RequestWithUser = {
      headers: {},
      user: { id: "owner-id", role: "owner" },
    };

    assert.equal(guard.canActivate(createContext(request)), true);
  });

  it("허용되지 않은 역할의 요청을 403으로 거부한다", () => {
    const guard = createGuard(["owner"]);
    const request: RequestWithUser = {
      headers: {},
      user: { id: "user-id", role: "user" },
    };

    assert.throws(
      () => guard.canActivate(createContext(request)),
      ForbiddenException,
    );
  });
});
