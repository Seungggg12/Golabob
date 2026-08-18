import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { DbService } from "../shared/db.service";
import { DiningRequestsService } from "./dining-requests.service";

const user = { id: "user-id", role: "user" as const, roles: ["user" as const] };
const now = new Date("2026-08-11T03:00:00.000Z");

function diningRequestRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "10",
    user_id: user.id,
    title: "팀 회식",
    dining_date: "2099-12-31",
    dining_time: "19:00:00",
    head_count: 8,
    region: "강남역",
    budget_per_person: 30_000,
    preferred_menu: "고기",
    required_options: null,
    memo: null,
    status: "open",
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe("DiningRequestsService", () => {
  it("생성 입력을 정규화하고 필요한 컬럼만 반환한다", async () => {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const dbService = {
      query: async (sql: string, params?: unknown[]) => {
        calls.push({ sql, params });
        return { rows: [diningRequestRow()] };
      },
    } as unknown as DbService;
    const service = new DiningRequestsService(dbService);

    await service.create(user, {
      title: "  팀 회식  ",
      diningDate: "2099-12-31",
      diningTime: "19:00",
      headCount: 8,
      region: "  강남역  ",
      budgetPerPerson: 30_000,
      preferredMenu: "  고기  ",
    });

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].params?.slice(1, 8), [
      "팀 회식",
      "2099-12-31",
      "19:00",
      8,
      "강남역",
      30_000,
      "고기",
    ]);
    assert.doesNotMatch(calls[0].sql, /RETURNING\s+\*/i);
  });

  it("존재하지 않는 달력 날짜를 DB 호출 전에 거부한다", async () => {
    let queried = false;
    const dbService = {
      query: async () => {
        queried = true;
        return { rows: [] };
      },
    } as unknown as DbService;
    const service = new DiningRequestsService(dbService);

    await assert.rejects(
      service.create(user, {
        title: "팀 회식",
        diningDate: "2099-02-30",
        diningTime: "19:00",
        headCount: 8,
        region: "강남역",
        budgetPerPerson: 30_000,
      }),
      BadRequestException,
    );
    assert.equal(queried, false);
  });

  it("잘못된 bigint 요청 id를 DB 호출 전에 거부한다", async () => {
    let queried = false;
    const dbService = {
      query: async () => {
        queried = true;
        return { rows: [] };
      },
    } as unknown as DbService;
    const service = new DiningRequestsService(dbService);

    await assert.rejects(service.findMineById(user, "not-a-number"), BadRequestException);
    assert.equal(queried, false);
  });

  it("요청과 대기 오퍼를 조건부 CTE 한 번으로 취소한다", async () => {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const dbService = {
      query: async (sql: string, params?: unknown[]) => {
        calls.push({ sql, params });
        return { rows: [diningRequestRow({ status: "canceled" })] };
      },
    } as unknown as DbService;
    const service = new DiningRequestsService(dbService);

    const result = await service.cancelMine(user, "10");

    assert.equal(result.status, "canceled");
    assert.equal(calls.length, 1);
    assert.match(calls[0].sql, /status = 'open'/);
    assert.match(calls[0].sql, /UPDATE offers/);
    assert.match(calls[0].sql, /status = 'pending'/);
  });

  it("경합으로 요청 상태가 바뀌면 기존 상태를 덮어쓰지 않는다", async () => {
    const calls: string[] = [];
    const dbService = {
      query: async (sql: string) => {
        calls.push(sql);

        if (sql.includes("WITH canceled_request")) {
          return { rows: [] };
        }

        return { rows: [{ status: "reserved", is_past: false }] };
      },
    } as unknown as DbService;
    const service = new DiningRequestsService(dbService);

    await assert.rejects(service.cancelMine(user, "10"), ConflictException);
    assert.equal(calls.length, 2);
    assert.match(calls[0], /AND status = 'open'/);
  });

  it("목록 크기를 제한하고 id keyset cursor를 사용한다", async () => {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const dbService = {
      query: async (sql: string, params?: unknown[]) => {
        calls.push({ sql, params });
        return { rows: [] };
      },
    } as unknown as DbService;
    const service = new DiningRequestsService(dbService);

    await service.findMine(user, { cursor: "100", limit: "25" });

    assert.deepEqual(calls[0].params, [user.id, "100", 25]);
    assert.match(calls[0].sql, /id < \$2::bigint/);
    assert.match(calls[0].sql, /LIMIT \$3/);
    assert.match(calls[0].sql, /ORDER BY id DESC/);
  });
});
