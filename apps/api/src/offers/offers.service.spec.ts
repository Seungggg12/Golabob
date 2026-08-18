import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { DbService } from "../shared/db.service";
import { OffersService } from "./offers.service";

const owner = { id: "owner-id", role: "owner" as const, roles: ["owner" as const] };
const user = { id: "user-id", role: "user" as const, roles: ["user" as const] };
const restaurantId = "7b3e9f6f-d630-42d8-a5c0-8d21fae3dd2e";
const now = new Date("2026-08-11T03:00:00.000Z");

function offerRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "20",
    dining_request_id: "10",
    restaurant_id: restaurantId,
    price_per_person: 28_000,
    menu_description: "삼겹살 세트",
    service_description: null,
    seat_description: null,
    available_time: "19:00:00",
    owner_comment: null,
    status: "pending",
    expires_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function createDto() {
  return {
    restaurantId,
    pricePerPerson: 28_000,
    menuDescription: "  삼겹살 세트  ",
    availableTime: "19:00",
  };
}

describe("OffersService", () => {
  it("요청 잠금과 오퍼 upsert를 단일 쿼리로 처리한다", async () => {
    const calls: Array<{ sql: string; params?: unknown[] }> = [];
    const dbService = {
      query: async (sql: string, params?: unknown[]) => {
        calls.push({ sql, params });
        return {
          rows: [
            {
              request_id: "10",
              request_status: "open",
              request_is_future: true,
              dining_at: new Date("2099-12-31T10:00:00.000Z"),
              eligible_restaurant_id: restaurantId,
              ...offerRow(),
            },
          ],
        };
      },
    } as unknown as DbService;
    const service = new OffersService(dbService);

    const result = await service.create(owner, "10", createDto());

    assert.equal(result.menuDescription, "삼겹살 세트");
    assert.equal(calls.length, 1);
    assert.match(calls[0].sql, /FOR SHARE OF dr/);
    assert.match(calls[0].sql, /ON CONFLICT ON CONSTRAINT uq_offers_request_restaurant/);
    assert.doesNotMatch(calls[0].sql, /RETURNING\s+\*/i);
  });

  it("닫힌 요청에는 CTE 내부 upsert 결과가 생성되지 않는다", async () => {
    let queryCount = 0;
    const dbService = {
      query: async () => {
        queryCount += 1;
        return {
          rows: [
            {
              request_id: "10",
              request_status: "reserved",
              request_is_future: true,
              dining_at: new Date("2099-12-31T10:00:00.000Z"),
              eligible_restaurant_id: restaurantId,
              ...offerRow({
                id: null,
                dining_request_id: null,
                restaurant_id: null,
                price_per_person: null,
                menu_description: null,
                available_time: null,
                status: null,
                created_at: null,
                updated_at: null,
              }),
            },
          ],
        };
      },
    } as unknown as DbService;
    const service = new OffersService(dbService);

    await assert.rejects(service.create(owner, "10", createDto()), ConflictException);
    assert.equal(queryCount, 1);
  });

  it("이미 유효한 오퍼가 있으면 단일 upsert 결과로 충돌을 반환한다", async () => {
    let queryCount = 0;
    const dbService = {
      query: async () => {
        queryCount += 1;
        return {
          rows: [
            {
              request_id: "10",
              request_status: "open",
              request_is_future: true,
              dining_at: new Date("2099-12-31T10:00:00.000Z"),
              eligible_restaurant_id: restaurantId,
              ...offerRow({
                id: null,
                dining_request_id: null,
                restaurant_id: null,
                price_per_person: null,
                menu_description: null,
                available_time: null,
                status: null,
                created_at: null,
                updated_at: null,
              }),
            },
          ],
        };
      },
    } as unknown as DbService;
    const service = new OffersService(dbService);

    await assert.rejects(service.create(owner, "10", createDto()), ConflictException);
    assert.equal(queryCount, 1);
  });

  it("잘못된 요청 id와 식당 UUID를 DB 호출 전에 거부한다", async () => {
    let queried = false;
    const dbService = {
      query: async () => {
        queried = true;
        return { rows: [] };
      },
    } as unknown as DbService;
    const service = new OffersService(dbService);

    await assert.rejects(service.create(owner, "abc", createDto()), BadRequestException);
    await assert.rejects(
      service.create(owner, "10", { ...createDto(), restaurantId: "not-a-uuid" }),
      BadRequestException,
    );
    assert.equal(queried, false);
  });

  it("본인 요청 확인과 빈 오퍼 목록을 단일 쿼리로 처리한다", async () => {
    const calls: string[] = [];
    const dbService = {
      query: async (sql: string) => {
        calls.push(sql);
        return {
          rows: [
            {
              owned_request_id: "10",
              id: null,
              dining_request_id: null,
              restaurant_id: null,
              price_per_person: null,
              menu_description: null,
              service_description: null,
              seat_description: null,
              available_time: null,
              owner_comment: null,
              status: null,
              expires_at: null,
              created_at: null,
              updated_at: null,
              restaurant_name: null,
              restaurant_address: null,
            },
          ],
        };
      },
    } as unknown as DbService;
    const service = new OffersService(dbService);

    const result = await service.findOffersForMyDiningRequest(user, "10");

    assert.deepEqual(result, []);
    assert.equal(calls.length, 1);
    assert.match(calls[0], /LEFT JOIN offers/);
  });

  it("선택 시 요청 소유권을 SQL에서 제한하고 쓰기를 한 번에 처리한다", async () => {
    const calls: string[] = [];
    const client = {
      query: async (sql: string) => {
        calls.push(sql);

        if (sql.includes("FOR UPDATE OF dr, o")) {
          return {
            rows: [
              {
                ...offerRow(),
                request_status: "open",
                dining_date: "2099-12-31",
                head_count: 8,
                request_memo: null,
                restaurant_status: "approved",
                max_capacity: 20,
                restaurant_name: "골라식당",
                restaurant_address: "서울",
                is_expired: false,
              },
            ],
          };
        }

        return {
          rows: [
            {
              id: "reservation-id",
              user_id: user.id,
              restaurant_id: restaurantId,
              dining_request_id: "10",
              offer_id: "20",
              reservation_date: "2099-12-31",
              reservation_time: "19:00:00",
              head_count: 8,
              request_memo: null,
              status: "confirmed",
              created_at: now,
              updated_at: now,
              selected_offer_updated_at: now,
            },
          ],
        };
      },
    };
    const dbService = {
      transaction: async (work: (transactionClient: typeof client) => Promise<unknown>) =>
        work(client),
    } as unknown as DbService;
    const service = new OffersService(dbService);

    const result = await service.selectOffer(user, "10", "20");

    assert.equal(result.offer.status, "selected");
    assert.equal(calls.length, 2);
    assert.match(calls[0], /dr\.user_id = \$3/);
    assert.match(calls[0], /FOR UPDATE OF dr, o/);
    assert.match(calls[1], /WITH updated_offers AS/);
    assert.match(calls[1], /inserted_reservation AS/);
  });

  it("만료된 오퍼는 쓰기 쿼리 전에 선택을 거부한다", async () => {
    let queryCount = 0;
    const client = {
      query: async () => {
        queryCount += 1;
        return {
          rows: [
            {
              ...offerRow(),
              request_status: "open",
              dining_date: "2099-12-31",
              head_count: 8,
              request_memo: null,
              restaurant_status: "approved",
              max_capacity: 20,
              restaurant_name: "골라식당",
              restaurant_address: "서울",
              is_expired: true,
            },
          ],
        };
      },
    };
    const dbService = {
      transaction: async (work: (transactionClient: typeof client) => Promise<unknown>) =>
        work(client),
    } as unknown as DbService;
    const service = new OffersService(dbService);

    await assert.rejects(service.selectOffer(user, "10", "20"), ConflictException);
    assert.equal(queryCount, 1);
  });

  it("목록 limit 상한을 DB 호출 전에 적용한다", async () => {
    let queried = false;
    const dbService = {
      query: async () => {
        queried = true;
        return { rows: [] };
      },
    } as unknown as DbService;
    const service = new OffersService(dbService);

    await assert.rejects(
      service.findOwnerOffers(owner, undefined, { limit: "101" }),
      BadRequestException,
    );
    assert.equal(queried, false);
  });
});
