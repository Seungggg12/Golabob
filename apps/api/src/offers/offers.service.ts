import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { assertRole, AuthUser } from "../auth/auth-user";
import { DbService } from "../shared/db.service";
import { CreateOfferDto } from "./dto/create-offer.dto";

interface OfferRow {
  id: number;
  dining_request_id: number;
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
}

interface OfferRestaurantRow {
  id: string;
  name: string;
  address: string;
}

interface SelectableOfferRow extends OfferRow {
  request_user_id: string;
  request_status: string;
  dining_date: string;
  head_count: number;
  request_memo: string | null;
  restaurant_status: string;
  max_capacity: number;
  restaurant_name: string;
  restaurant_address: string;
}

interface SelectedReservationRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  dining_request_id: number;
  offer_id: number;
  reservation_date: string;
  reservation_time: string;
  head_count: number;
  request_memo: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class OffersService {
  constructor(private readonly dbService: DbService) {}

  async create(user: AuthUser, diningRequestId: string, dto: CreateOfferDto) {
    assertRole(user, ["owner"]);
    this.validateCreateDto(dto);
    await this.assertOwnedRestaurant(user.id, dto.restaurantId!);

    const requestResult = await this.dbService.query<{ id: number; status: string }>(
      "SELECT id, status FROM dining_requests WHERE id = $1",
      [diningRequestId],
    );
    const request = requestResult.rows[0];

    if (!request) {
      throw new NotFoundException("오퍼를 보낼 회식 요청을 찾을 수 없습니다.");
    }

    if (request.status !== "open") {
      throw new ForbiddenException("모집 중인 회식 요청에만 오퍼를 보낼 수 있습니다.");
    }

    try {
      const result = await this.dbService.query<OfferRow>(
        `INSERT INTO offers (
           dining_request_id, restaurant_id, price_per_person, menu_description,
           service_description, seat_description, available_time, owner_comment, expires_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          diningRequestId,
          dto.restaurantId,
          dto.pricePerPerson,
          dto.menuDescription,
          dto.serviceDescription || null,
          dto.seatDescription || null,
          dto.availableTime,
          dto.ownerComment || null,
          dto.expiresAt || null,
        ],
      );

      return this.toResponse(result.rows[0]);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("이미 이 회식 요청에 오퍼를 보낸 식당입니다.");
      }

      throw error;
    }
  }

  async findOwnerOffers(user: AuthUser, restaurantId?: string) {
    assertRole(user, ["owner"]);

    const result = restaurantId
      ? await this.dbService.query<OfferRow>(
          `SELECT o.*
           FROM offers o
           JOIN restaurants r ON r.id = o.restaurant_id
           WHERE o.restaurant_id = $1 AND r.owner_id = $2
           ORDER BY o.created_at DESC`,
          [restaurantId, user.id],
        )
      : await this.dbService.query<OfferRow>(
          `SELECT o.*
           FROM offers o
           JOIN restaurants r ON r.id = o.restaurant_id
           WHERE r.owner_id = $1
           ORDER BY o.created_at DESC`,
          [user.id],
        );

    return result.rows.map((row) => this.toResponse(row));
  }

  async findOwnerRestaurants(user: AuthUser) {
    assertRole(user, ["owner"]);

    const result = await this.dbService.query<OfferRestaurantRow>(
      `SELECT id, name, address
       FROM restaurants
       WHERE owner_id = $1 AND status = 'approved'
       ORDER BY name ASC`,
      [user.id],
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
    }));
  }

  async findOwnerOfferById(user: AuthUser, id: string) {
    assertRole(user, ["owner"]);

    const result = await this.dbService.query<OfferRow>(
      `SELECT o.*
       FROM offers o
       JOIN restaurants r ON r.id = o.restaurant_id
       WHERE o.id = $1 AND r.owner_id = $2`,
      [id, user.id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("오퍼를 찾을 수 없습니다.");
    }

    return this.toResponse(result.rows[0]);
  }

  async findOffersForMyDiningRequest(user: AuthUser, diningRequestId: string) {
    assertRole(user, ["user"]);

    const requestResult = await this.dbService.query<{ id: number }>(
      "SELECT id FROM dining_requests WHERE id = $1 AND user_id = $2",
      [diningRequestId, user.id],
    );

    if (!requestResult.rows[0]) {
      throw new NotFoundException("내 회식 요청을 찾을 수 없습니다.");
    }

    const result = await this.dbService.query<OfferRow>(
      `SELECT o.*, r.name AS restaurant_name, r.address AS restaurant_address
       FROM offers o
       JOIN restaurants r ON r.id = o.restaurant_id
       WHERE o.dining_request_id = $1
       ORDER BY o.price_per_person ASC, o.created_at DESC`,
      [diningRequestId],
    );

    return result.rows.map((row) => this.toResponse(row));
  }

  async selectOffer(user: AuthUser, diningRequestId: string, offerId: string) {
    assertRole(user, ["user"]);

    return this.dbService.transaction(async (client) => {
      const offerResult = await client.query<SelectableOfferRow>(
        `SELECT
           o.*,
           dr.user_id AS request_user_id,
           dr.status AS request_status,
           dr.dining_date,
           dr.head_count,
           dr.memo AS request_memo,
           r.status AS restaurant_status,
           r.max_capacity,
           r.name AS restaurant_name,
           r.address AS restaurant_address
         FROM offers o
         JOIN dining_requests dr ON dr.id = o.dining_request_id
         JOIN restaurants r ON r.id = o.restaurant_id
         WHERE o.id = $1 AND o.dining_request_id = $2
         FOR UPDATE OF dr`,
        [offerId, diningRequestId],
      );
      const offer = offerResult.rows[0];

      if (!offer || offer.request_user_id !== user.id) {
        throw new NotFoundException("선택할 수 있는 오퍼를 찾을 수 없습니다.");
      }

      if (offer.request_status !== "open") {
        throw new ConflictException("이미 마감된 회식 요청입니다.");
      }

      if (offer.status !== "pending") {
        throw new ConflictException("대기 중인 오퍼만 선택할 수 있습니다.");
      }

      if (offer.expires_at && new Date(offer.expires_at).getTime() <= Date.now()) {
        throw new ConflictException("유효 시간이 지난 오퍼입니다.");
      }

      if (offer.restaurant_status !== "approved") {
        throw new BadRequestException("현재 예약할 수 없는 식당입니다.");
      }

      if (offer.head_count > offer.max_capacity) {
        throw new BadRequestException("요청 인원이 식당 최대 수용 인원을 초과합니다.");
      }

      const reservationResult = await client.query<SelectedReservationRow>(
        `INSERT INTO reservations (
           id, user_id, restaurant_id, dining_request_id, offer_id,
           reservation_date, reservation_time, head_count, request_memo
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          randomUUID(),
          user.id,
          offer.restaurant_id,
          offer.dining_request_id,
          offer.id,
          offer.dining_date,
          offer.available_time,
          offer.head_count,
          offer.request_memo,
        ],
      );

      await client.query(
        `UPDATE offers
         SET status = CASE WHEN id = $1 THEN 'selected' ELSE 'rejected' END,
             updated_at = NOW()
         WHERE dining_request_id = $2 AND status = 'pending'`,
        [offer.id, offer.dining_request_id],
      );

      await client.query(
        `UPDATE dining_requests
         SET status = 'reserved', updated_at = NOW()
         WHERE id = $1`,
        [offer.dining_request_id],
      );

      return {
        reservation: this.toReservationResponse(reservationResult.rows[0]),
        offer: this.toResponse({ ...offer, status: "selected" }),
      };
    });
  }

  private validateCreateDto(dto: CreateOfferDto) {
    if (!dto.restaurantId || !dto.menuDescription || !dto.availableTime) {
      throw new BadRequestException("식당 id, 메뉴 구성, 예약 가능 시간은 필수입니다.");
    }

    const pricePerPerson = dto.pricePerPerson;

    if (typeof pricePerPerson !== "number" || !Number.isInteger(pricePerPerson) || pricePerPerson <= 0) {
      throw new BadRequestException("1인 제안 가격은 0보다 커야 합니다.");
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.availableTime)) {
      throw new BadRequestException("예약 가능 시간은 HH:mm 형식이어야 합니다.");
    }
  }

  private async assertOwnedRestaurant(ownerId: string, restaurantId: string) {
    const result = await this.dbService.query<{ id: string }>(
      "SELECT id FROM restaurants WHERE id = $1 AND owner_id = $2 AND status = 'approved'",
      [restaurantId, ownerId],
    );

    if (!result.rows[0]) {
      throw new ForbiddenException("본인 소유의 승인된 식당으로만 오퍼를 보낼 수 있습니다.");
    }
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

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    );
  }
}
