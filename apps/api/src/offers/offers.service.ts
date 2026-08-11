import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { assertRole, AuthUser } from "../auth/auth-user";
import { DbService } from "../shared/db.service";
import { CreateOfferDto } from "./dto/create-offer.dto";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const POSTGRES_INT_MAX = 2_147_483_647;
const POSTGRES_BIGINT_MAX = 9_223_372_036_854_775_807n;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface OfferRow {
  id: string;
  dining_request_id: string;
  restaurant_id: string;
  price_per_person: number;
  menu_description: string;
  service_description: string | null;
  seat_description: string | null;
  available_time: string;
  owner_comment: string | null;
  status: string;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
  restaurant_name?: string;
  restaurant_address?: string;
  request_title?: string;
  request_dining_date?: string;
  request_dining_time?: string;
  request_head_count?: number;
  request_region?: string;
  request_budget_per_person?: number;
  request_status?: string;
}

interface OwnedOfferRow {
  owned_request_id: string;
  id: string | null;
  dining_request_id: string | null;
  restaurant_id: string | null;
  price_per_person: number | null;
  menu_description: string | null;
  service_description: string | null;
  seat_description: string | null;
  available_time: string | null;
  owner_comment: string | null;
  status: string | null;
  expires_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
  restaurant_name: string | null;
  restaurant_address: string | null;
}

interface OfferRestaurantRow {
  id: string;
  name: string;
  address: string;
}

interface OfferCreateResultRow {
  request_id: string;
  request_status: string;
  request_is_future: boolean;
  dining_at: Date;
  eligible_restaurant_id: string | null;
  id: string | null;
  dining_request_id: string | null;
  restaurant_id: string | null;
  price_per_person: number | null;
  menu_description: string | null;
  service_description: string | null;
  seat_description: string | null;
  available_time: string | null;
  owner_comment: string | null;
  status: string | null;
  expires_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
}

interface SelectableOfferRow extends OfferRow {
  request_status: string;
  dining_date: string;
  head_count: number;
  request_memo: string | null;
  restaurant_status: string;
  max_capacity: number;
  restaurant_name: string;
  restaurant_address: string;
  is_expired: boolean;
}

interface SelectedReservationRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  dining_request_id: string;
  offer_id: string;
  reservation_date: string;
  reservation_time: string;
  head_count: number;
  request_memo: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface SelectionMutationRow extends SelectedReservationRow {
  selected_offer_updated_at: Date;
}

interface NormalizedCreateOffer {
  restaurantId: string;
  pricePerPerson: number;
  menuDescription: string;
  serviceDescription: string | null;
  seatDescription: string | null;
  availableTime: string;
  ownerComment: string | null;
  expiresAt: string | null;
}

export interface OfferListOptions {
  cursor?: string;
  limit?: string;
}

@Injectable()
export class OffersService {
  constructor(private readonly dbService: DbService) {}

  async create(user: AuthUser, diningRequestId: string, dto: CreateOfferDto) {
    assertRole(user, ["owner"]);
    const requestId = this.parseId(diningRequestId, "회식 요청 id");
    const input = this.normalizeCreateDto(dto);

    const result = await this.dbService.query<OfferCreateResultRow>(
      `WITH eligibility AS MATERIALIZED (
         SELECT
           dr.id AS request_id,
           dr.status AS request_status,
           dr.dining_date + dr.dining_time >
             CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul' AS request_is_future,
           (dr.dining_date + dr.dining_time) AT TIME ZONE 'Asia/Seoul' AS dining_at,
           r.id AS eligible_restaurant_id
         FROM dining_requests dr
         LEFT JOIN restaurants r
           ON r.id = $2
          AND r.owner_id = $3
          AND r.status = 'approved'
         WHERE dr.id = $1
         FOR SHARE OF dr
       ), upserted_offer AS (
         INSERT INTO offers (
           dining_request_id, restaurant_id, price_per_person, menu_description,
           service_description, seat_description, available_time, owner_comment, expires_at
         )
         SELECT
           request_id, eligible_restaurant_id, $4, $5, $6, $7, $8, $9, $10
         FROM eligibility
         WHERE request_status = 'open'
           AND request_is_future
           AND eligible_restaurant_id IS NOT NULL
           AND ($10::timestamptz IS NULL OR $10::timestamptz < dining_at)
         ON CONFLICT ON CONSTRAINT uq_offers_request_restaurant
         DO UPDATE SET
           price_per_person = EXCLUDED.price_per_person,
           menu_description = EXCLUDED.menu_description,
           service_description = EXCLUDED.service_description,
           seat_description = EXCLUDED.seat_description,
           available_time = EXCLUDED.available_time,
           owner_comment = EXCLUDED.owner_comment,
           expires_at = EXCLUDED.expires_at,
           status = 'pending',
           updated_at = NOW()
         WHERE offers.status IN ('canceled', 'expired', 'rejected')
         RETURNING
           id, dining_request_id, restaurant_id, price_per_person,
           menu_description, service_description, seat_description, available_time,
           owner_comment, status, expires_at, created_at, updated_at
       )
       SELECT
         eligibility.request_id,
         eligibility.request_status,
         eligibility.request_is_future,
         eligibility.dining_at,
         eligibility.eligible_restaurant_id,
         upserted_offer.id,
         upserted_offer.dining_request_id,
         upserted_offer.restaurant_id,
         upserted_offer.price_per_person,
         upserted_offer.menu_description,
         upserted_offer.service_description,
         upserted_offer.seat_description,
         upserted_offer.available_time,
         upserted_offer.owner_comment,
         upserted_offer.status,
         upserted_offer.expires_at,
         upserted_offer.created_at,
         upserted_offer.updated_at
       FROM eligibility
       LEFT JOIN upserted_offer ON TRUE`,
      [
        requestId,
        input.restaurantId,
        user.id,
        input.pricePerPerson,
        input.menuDescription,
        input.serviceDescription,
        input.seatDescription,
        input.availableTime,
        input.ownerComment,
        input.expiresAt,
      ],
    );
    const outcome = result.rows[0];

    if (!outcome) {
      throw new NotFoundException("오퍼를 보낼 회식 요청을 찾을 수 없습니다.");
    }

    if (outcome.request_status !== "open" || !outcome.request_is_future) {
      throw new ConflictException("모집 중인 회식 요청에만 오퍼를 보낼 수 있습니다.");
    }

    if (!outcome.eligible_restaurant_id) {
      throw new ForbiddenException("본인 소유의 승인된 식당으로만 오퍼를 보낼 수 있습니다.");
    }

    if (
      input.expiresAt &&
      new Date(input.expiresAt).getTime() >= new Date(outcome.dining_at).getTime()
    ) {
      throw new BadRequestException("오퍼 만료 시간은 회식 시작 시간보다 이전이어야 합니다.");
    }

    if (!outcome.id) {
      throw new ConflictException("이미 이 회식 요청에 유효한 오퍼를 보낸 식당입니다.");
    }

    return this.toResponse(outcome as OfferRow);
  }

  async findOwnerOffers(
    user: AuthUser,
    restaurantId?: string,
    options: OfferListOptions = {},
  ) {
    assertRole(user, ["owner"]);
    const normalizedRestaurantId =
      restaurantId === undefined ? null : this.validateUuid(restaurantId, "식당 id");
    const cursor = this.parseCursor(options.cursor);
    const limit = this.parseLimit(options.limit);
    const params: unknown[] = [user.id];
    const conditions = ["r.owner_id = $1"];

    if (normalizedRestaurantId) {
      params.push(normalizedRestaurantId);
      conditions.push(`r.id = $${params.length}`);
    }

    if (cursor) {
      params.push(cursor);
      conditions.push(`o.id < $${params.length}`);
    }

    params.push(limit);
    const result = await this.dbService.query<OfferRow>(
      `SELECT
         o.id, o.dining_request_id, o.restaurant_id, o.price_per_person,
         o.menu_description, o.service_description, o.seat_description,
         o.available_time, o.owner_comment,
         CASE
           WHEN o.status = 'pending' AND o.expires_at <= CURRENT_TIMESTAMP
           THEN 'expired'
           ELSE o.status
         END AS status,
         o.expires_at, o.created_at, o.updated_at,
         r.name AS restaurant_name,
         r.address AS restaurant_address,
         dr.title AS request_title,
         dr.dining_date AS request_dining_date,
         dr.dining_time AS request_dining_time,
         dr.head_count AS request_head_count,
         dr.region AS request_region,
         dr.budget_per_person AS request_budget_per_person,
         dr.status AS request_status
       FROM restaurants r
       JOIN offers o ON o.restaurant_id = r.id
       JOIN dining_requests dr ON dr.id = o.dining_request_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY o.id DESC
       LIMIT $${params.length}`,
      params,
    );

    return result.rows.map((row) => this.toResponse(row));
  }

  async findOwnerRestaurants(user: AuthUser) {
    assertRole(user, ["owner"]);

    const result = await this.dbService.query<OfferRestaurantRow>(
      `SELECT id, name, address
       FROM restaurants
       WHERE owner_id = $1 AND status = 'approved'
       ORDER BY name ASC, id ASC
       LIMIT $2`,
      [user.id, MAX_PAGE_SIZE],
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
    }));
  }

  async findOwnerOfferById(user: AuthUser, id: string) {
    assertRole(user, ["owner"]);
    const offerId = this.parseId(id, "오퍼 id");

    const result = await this.dbService.query<OfferRow>(
      `SELECT
         o.id, o.dining_request_id, o.restaurant_id, o.price_per_person,
         o.menu_description, o.service_description, o.seat_description,
         o.available_time, o.owner_comment,
         CASE
           WHEN o.status = 'pending' AND o.expires_at <= CURRENT_TIMESTAMP
           THEN 'expired'
           ELSE o.status
         END AS status,
         o.expires_at, o.created_at, o.updated_at,
         r.name AS restaurant_name,
         r.address AS restaurant_address,
         dr.title AS request_title,
         dr.dining_date AS request_dining_date,
         dr.dining_time AS request_dining_time,
         dr.head_count AS request_head_count,
         dr.region AS request_region,
         dr.budget_per_person AS request_budget_per_person,
         dr.status AS request_status
       FROM offers o
       JOIN restaurants r ON r.id = o.restaurant_id
       JOIN dining_requests dr ON dr.id = o.dining_request_id
       WHERE o.id = $1 AND r.owner_id = $2`,
      [offerId, user.id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("오퍼를 찾을 수 없습니다.");
    }

    return this.toResponse(result.rows[0]);
  }

  async findOffersForMyDiningRequest(
    user: AuthUser,
    diningRequestId: string,
    options: OfferListOptions = {},
  ) {
    assertRole(user, ["user"]);
    const requestId = this.parseId(diningRequestId, "회식 요청 id");
    const cursor = this.parseCursor(options.cursor);
    const limit = this.parseLimit(options.limit);
    const params: unknown[] = [requestId, user.id];
    let cursorJoinCondition = "";

    if (cursor) {
      params.push(cursor);
      const cursorParameter = params.length;
      cursorJoinCondition = `
        AND (o.price_per_person, -o.id) > (
          SELECT price_per_person, -id
          FROM offers
          WHERE id = $${cursorParameter} AND dining_request_id = $1
        )`;
    }

    params.push(limit);
    const result = await this.dbService.query<OwnedOfferRow>(
      `SELECT
         dr.id AS owned_request_id,
         o.id, o.dining_request_id, o.restaurant_id, o.price_per_person,
         o.menu_description, o.service_description, o.seat_description,
         o.available_time, o.owner_comment,
         CASE
           WHEN o.status = 'pending' AND o.expires_at <= CURRENT_TIMESTAMP
           THEN 'expired'
           ELSE o.status
         END AS status,
         o.expires_at, o.created_at, o.updated_at,
         r.name AS restaurant_name,
         r.address AS restaurant_address
       FROM dining_requests dr
       LEFT JOIN offers o
         ON o.dining_request_id = dr.id${cursorJoinCondition}
       LEFT JOIN restaurants r ON r.id = o.restaurant_id
       WHERE dr.id = $1 AND dr.user_id = $2
       ORDER BY o.price_per_person ASC NULLS LAST, o.id DESC
       LIMIT $${params.length}`,
      params,
    );

    if (!result.rows[0]) {
      throw new NotFoundException("내 회식 요청을 찾을 수 없습니다.");
    }

    return result.rows
      .filter((row): row is OwnedOfferRow & { id: string } => row.id !== null)
      .map((row) => this.toResponse(row as OfferRow));
  }

  async selectOffer(user: AuthUser, diningRequestId: string, offerId: string) {
    assertRole(user, ["user"]);
    const requestId = this.parseId(diningRequestId, "회식 요청 id");
    const selectedOfferId = this.parseId(offerId, "오퍼 id");

    try {
      return await this.dbService.transaction(async (client) => {
        const offerResult = await client.query<SelectableOfferRow>(
          `SELECT
             o.id, o.dining_request_id, o.restaurant_id, o.price_per_person,
             o.menu_description, o.service_description, o.seat_description,
             o.available_time, o.owner_comment, o.status, o.expires_at,
             o.created_at, o.updated_at,
             dr.status AS request_status,
             dr.dining_date,
             dr.head_count,
             dr.memo AS request_memo,
             r.status AS restaurant_status,
             r.max_capacity,
             r.name AS restaurant_name,
             r.address AS restaurant_address,
             o.expires_at IS NOT NULL
               AND o.expires_at <= CURRENT_TIMESTAMP AS is_expired
           FROM offers o
           JOIN dining_requests dr ON dr.id = o.dining_request_id
           JOIN restaurants r ON r.id = o.restaurant_id
           WHERE o.id = $1
             AND o.dining_request_id = $2
             AND dr.user_id = $3
           FOR UPDATE OF dr, o`,
          [selectedOfferId, requestId, user.id],
        );
        const offer = offerResult.rows[0];

        if (!offer) {
          throw new NotFoundException("선택할 수 있는 오퍼를 찾을 수 없습니다.");
        }

        if (offer.request_status !== "open") {
          throw new ConflictException("이미 마감된 회식 요청입니다.");
        }

        if (offer.status !== "pending") {
          throw new ConflictException("대기 중인 오퍼만 선택할 수 있습니다.");
        }

        if (offer.is_expired) {
          throw new ConflictException("유효 시간이 지난 오퍼입니다.");
        }

        if (offer.restaurant_status !== "approved") {
          throw new BadRequestException("현재 예약할 수 없는 식당입니다.");
        }

        if (offer.head_count > offer.max_capacity) {
          throw new BadRequestException("요청 인원이 식당 최대 수용 인원을 초과합니다.");
        }

        const mutationResult = await client.query<SelectionMutationRow>(
          `WITH updated_offers AS (
             UPDATE offers
             SET status = CASE WHEN id = $1 THEN 'selected' ELSE 'rejected' END,
                 updated_at = NOW()
             WHERE dining_request_id = $2 AND status = 'pending'
             RETURNING id, updated_at
           ), reserved_request AS (
             UPDATE dining_requests
             SET status = 'reserved', updated_at = NOW()
             WHERE id = $2 AND status = 'open'
             RETURNING id
           ), inserted_reservation AS (
             INSERT INTO reservations (
               id, user_id, restaurant_id, dining_request_id, offer_id,
               reservation_date, reservation_time, head_count, request_memo
             )
             SELECT $3, $4, $5, $2, $1, $6, $7, $8, $9
             WHERE EXISTS (
               SELECT 1 FROM updated_offers WHERE id = $1
             )
               AND EXISTS (SELECT 1 FROM reserved_request)
             RETURNING
               id, user_id, restaurant_id, dining_request_id, offer_id,
               reservation_date, reservation_time, head_count, request_memo,
               status, created_at, updated_at
           )
           SELECT
             inserted_reservation.*,
             updated_offers.updated_at AS selected_offer_updated_at
           FROM inserted_reservation
           JOIN updated_offers ON updated_offers.id = $1`,
          [
            selectedOfferId,
            requestId,
            randomUUID(),
            user.id,
            offer.restaurant_id,
            offer.dining_date,
            offer.available_time,
            offer.head_count,
            offer.request_memo,
          ],
        );
        const mutation = mutationResult.rows[0];

        if (!mutation) {
          throw new ConflictException("오퍼 선택 상태가 변경되어 다시 시도해주세요.");
        }

        return {
          reservation: this.toReservationResponse(mutation),
          offer: this.toResponse({
            ...offer,
            status: "selected",
            updated_at: mutation.selected_offer_updated_at,
          }),
        };
      });
    } catch (error) {
      if (
        this.isUniqueViolation(error, "uq_reservations_dining_request_id") ||
        this.isUniqueViolation(error, "uq_reservations_offer_id")
      ) {
        throw new ConflictException("이미 이 회식 요청의 예약이 확정되었습니다.");
      }

      throw error;
    }
  }

  private normalizeCreateDto(dto: CreateOfferDto): NormalizedCreateOffer {
    const restaurantId = this.validateUuid(dto.restaurantId, "식당 id");
    const pricePerPerson = this.validatePositiveInteger(dto.pricePerPerson, "1인 제안 가격");
    const menuDescription = this.normalizeRequiredText(dto.menuDescription, "메뉴 구성", 1_000);
    const availableTime = this.validateTime(dto.availableTime, "예약 가능 시간");
    const serviceDescription = this.normalizeOptionalText(dto.serviceDescription, "혜택 설명", 1_000);
    const seatDescription = this.normalizeOptionalText(dto.seatDescription, "좌석 설명", 1_000);
    const ownerComment = this.normalizeOptionalText(dto.ownerComment, "사장 코멘트", 2_000);
    const expiresAt = this.validateExpiresAt(dto.expiresAt);

    return {
      restaurantId,
      pricePerPerson,
      menuDescription,
      serviceDescription,
      seatDescription,
      availableTime,
      ownerComment,
      expiresAt,
    };
  }

  private normalizeRequiredText(value: unknown, label: string, maxLength: number) {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new BadRequestException(`${label}은(는) 필수입니다.`);
    }

    const normalized = value.trim();

    if (normalized.length > maxLength) {
      throw new BadRequestException(`${label}은(는) ${maxLength}자 이하여야 합니다.`);
    }

    return normalized;
  }

  private normalizeOptionalText(value: unknown, label: string, maxLength: number) {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    if (typeof value !== "string") {
      throw new BadRequestException(`${label} 형식이 올바르지 않습니다.`);
    }

    const normalized = value.trim();

    if (normalized.length > maxLength) {
      throw new BadRequestException(`${label}은(는) ${maxLength}자 이하여야 합니다.`);
    }

    return normalized || null;
  }

  private validatePositiveInteger(value: unknown, label: string) {
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > POSTGRES_INT_MAX
    ) {
      throw new BadRequestException(`${label}은(는) 0보다 큰 정수여야 합니다.`);
    }

    return value;
  }

  private validateTime(value: unknown, label: string) {
    if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      throw new BadRequestException(`${label}은(는) HH:mm 형식이어야 합니다.`);
    }

    return value;
  }

  private validateExpiresAt(value: unknown) {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    if (typeof value !== "string") {
      throw new BadRequestException("오퍼 만료 시간은 시간대가 포함된 ISO 8601 형식이어야 합니다.");
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);

    if (!match) {
      throw new BadRequestException("오퍼 만료 시간은 시간대가 포함된 ISO 8601 형식이어야 합니다.");
    }

    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const calendarDate = new Date(Date.UTC(year, month - 1, day));

    if (
      calendarDate.getUTCFullYear() !== year ||
      calendarDate.getUTCMonth() !== month - 1 ||
      calendarDate.getUTCDate() !== day
    ) {
      throw new BadRequestException("유효한 오퍼 만료 날짜를 입력해주세요.");
    }

    const expiresAt = new Date(value);

    if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException("오퍼 만료 시간은 현재보다 이후여야 합니다.");
    }

    return expiresAt.toISOString();
  }

  private validateUuid(value: unknown, label: string) {
    if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
      throw new BadRequestException(`${label} 형식이 올바르지 않습니다.`);
    }

    return value.toLowerCase();
  }

  private parseLimit(value?: string) {
    if (value === undefined) {
      return DEFAULT_PAGE_SIZE;
    }

    if (!/^\d+$/.test(value)) {
      throw new BadRequestException("limit은 양의 정수여야 합니다.");
    }

    const limit = Number(value);

    if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      throw new BadRequestException(`limit은 1부터 ${MAX_PAGE_SIZE} 사이여야 합니다.`);
    }

    return limit;
  }

  private parseCursor(value?: string) {
    return value === undefined ? null : this.parseId(value, "cursor");
  }

  private parseId(value: string, label: string) {
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException(`${label} 형식이 올바르지 않습니다.`);
    }

    try {
      if (BigInt(value) > POSTGRES_BIGINT_MAX) {
        throw new BadRequestException(`${label} 범위가 올바르지 않습니다.`);
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`${label} 형식이 올바르지 않습니다.`);
    }

    return value;
  }

  private toResponse(row: OfferRow) {
    return {
      id: row.id,
      diningRequestId: row.dining_request_id,
      restaurantId: row.restaurant_id,
      pricePerPerson: row.price_per_person,
      menuDescription: row.menu_description,
      serviceDescription: row.service_description,
      seatDescription: row.seat_description,
      availableTime: row.available_time,
      ownerComment: row.owner_comment,
      status: row.status,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      restaurantName: row.restaurant_name,
      restaurantAddress: row.restaurant_address,
      requestTitle: row.request_title,
      requestDiningDate: row.request_dining_date,
      requestDiningTime: row.request_dining_time,
      requestHeadCount: row.request_head_count,
      requestRegion: row.request_region,
      requestBudgetPerPerson: row.request_budget_per_person,
      requestStatus: row.request_status,
    };
  }

  private toReservationResponse(row: SelectedReservationRow) {
    return {
      id: row.id,
      userId: row.user_id,
      restaurantId: row.restaurant_id,
      diningRequestId: row.dining_request_id,
      offerId: row.offer_id,
      reservationDate: row.reservation_date,
      reservationTime: row.reservation_time,
      headCount: row.head_count,
      requestMemo: row.request_memo,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private isUniqueViolation(error: unknown, constraint: string) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505" &&
      "constraint" in error &&
      error.constraint === constraint
    );
  }
}
