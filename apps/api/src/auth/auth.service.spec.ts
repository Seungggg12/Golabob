import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { DbService } from "../shared/db.service";
import { AuthService } from "./auth.service";
import { SignupDto } from "./auth.dto";
import { JwtTokenService } from "./jwt-token.service";

describe("AuthService", () => {
  it("필수 약관에 동의하지 않은 회원가입을 거부한다", async () => {
    const service = new AuthService({} as DbService, new JwtTokenService());

    await assert.rejects(
      service.signup({
        name: "홍길동",
        email: "user@example.com",
        phone: "010-1234-5678",
        password: "password1234",
        agreements: {
          serviceTerms: true,
          privacyPolicy: false,
        },
      }),
      BadRequestException,
    );
  });

  it("회원가입 시 전화번호를 정규화하고 user 역할과 약관 동의를 함께 저장한다", async () => {
    const clientCalls: Array<{ sql: string; params?: unknown[] }> = [];
    const client = {
      query: async (sql: string, params?: unknown[]) => {
        clientCalls.push({ sql, params });

        if (sql.includes("FROM terms")) {
          return {
            rows: [
              { id: "1", code: "marketing_consent", is_required: false },
              { id: "2", code: "privacy_policy", is_required: true },
              { id: "3", code: "service_terms", is_required: true },
            ],
          };
        }

        if (sql.includes("INSERT INTO users")) {
          return {
            rows: [
              {
                id: "user-id",
                name: "홍길동",
                email: "user@example.com",
                phone: "+821012345678",
                password_hash: "hashed-password",
                role: "user",
                status: "active",
                email_verified_at: null,
                phone_verified_at: null,
                created_at: new Date("2026-08-04T00:00:00Z"),
                updated_at: new Date("2026-08-04T00:00:00Z"),
              },
            ],
          };
        }

        return { rows: [] };
      },
    };
    const dbService = {
      query: async () => ({ rows: [] }),
      transaction: async (work: (transactionClient: typeof client) => Promise<unknown>) =>
        work(client),
    } as unknown as DbService;
    const service = new AuthService(dbService, new JwtTokenService());
    const signupBody = {
      name: "  홍길동  ",
      email: "USER@EXAMPLE.COM",
      phone: "010-1234-5678",
      password: "password1234",
      role: "owner",
      agreements: {
        serviceTerms: true,
        privacyPolicy: true,
        marketingConsent: false,
      },
    } as SignupDto & { role: "owner" };

    const result = await service.signup(signupBody);
    const userInsert = clientCalls.find((call) => call.sql.includes("INSERT INTO users"));
    const roleInsert = clientCalls.find((call) => call.sql.includes("INSERT INTO user_roles"));
    const agreementInsert = clientCalls.find((call) =>
      call.sql.includes("INSERT INTO user_term_agreements"),
    );

    assert.equal(result.user.role, "user");
    assert.deepEqual(result.user.roles, ["user"]);
    assert.equal(result.user.phone, "+821012345678");
    assert.deepEqual(userInsert?.params?.slice(1, 4), [
      "홍길동",
      "user@example.com",
      "+821012345678",
    ]);
    assert.match(roleInsert?.sql || "", /VALUES \(\$1, 'user'\)/);
    assert.deepEqual(agreementInsert?.params?.[2], [true, true, false]);
  });

  it("정지 계정은 비밀번호가 맞아도 로그인할 수 없다", async () => {
    const passwordHash = await bcrypt.hash("password1234", 4);
    const dbService = {
      query: async () => ({
        rows: [
          {
            id: "user-id",
            name: "홍길동",
            email: "user@example.com",
            phone: "+821012345678",
            password_hash: passwordHash,
            role: "user",
            roles: ["user"],
            status: "suspended",
            email_verified_at: null,
            phone_verified_at: null,
            created_at: new Date("2026-08-04T00:00:00Z"),
            updated_at: new Date("2026-08-04T00:00:00Z"),
          },
        ],
      }),
    } as unknown as DbService;
    const service = new AuthService(dbService, new JwtTokenService());

    await assert.rejects(
      service.login({ email: "user@example.com", password: "password1234" }),
      UnauthorizedException,
    );
  });
});
