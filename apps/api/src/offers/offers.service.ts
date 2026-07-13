import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { DbService } from "../shared/db.service";
import { CreateOfferDto } from "./dto/create-offer.dto";
import { assertRole, RequestUser } from "./request-user";

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
}

@Injectable()
export class OffersService {
  constructor(private readonly dbService: DbService) {}

  async create(user: RequestUser, diningRequestId: string, dto: CreateOfferDto) {
    assertRole(user, ["OWNER"]);
    this.validateCreateDto(dto);

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

  async findOwnerOffers(user: RequestUser, restaurantId?: string) {
    assertRole(user, ["OWNER"]);

    const result = restaurantId
      ? await this.dbService.query<OfferRow>(
          "SELECT * FROM offers WHERE restaurant_id = $1 ORDER BY created_at DESC",
          [restaurantId],
        )
      : await this.dbService.query<OfferRow>("SELECT * FROM offers ORDER BY created_at DESC");

    return result.rows.map((row) => this.toResponse(row));
  }

  async findOwnerOfferById(user: RequestUser, id: string) {
    assertRole(user, ["OWNER"]);

    const result = await this.dbService.query<OfferRow>("SELECT * FROM offers WHERE id = $1", [id]);

    if (!result.rows[0]) {
      throw new NotFoundException("오퍼를 찾을 수 없습니다.");
    }

    return this.toResponse(result.rows[0]);
  }

  async findOffersForMyDiningRequest(user: RequestUser, diningRequestId: string) {
    assertRole(user, ["USER"]);

    const requestResult = await this.dbService.query<{ id: number }>(
      "SELECT id FROM dining_requests WHERE id = $1 AND user_id = $2",
      [diningRequestId, user.id],
    );

    if (!requestResult.rows[0]) {
      throw new NotFoundException("내 회식 요청을 찾을 수 없습니다.");
    }

    const result = await this.dbService.query<OfferRow>(
      `SELECT * FROM offers
       WHERE dining_request_id = $1
       ORDER BY price_per_person ASC, created_at DESC`,
      [diningRequestId],
    );

    return result.rows.map((row) => this.toResponse(row));
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
