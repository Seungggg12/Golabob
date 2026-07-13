import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuthUser } from "../auth/auth-user";
import { DbService } from "../shared/db.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { UpdateReservationDto } from "./dto/update-reservation.dto";

interface ReservationRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  reservation_date: string;
  reservation_time: string;
  head_count: number;
  request_memo: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

interface RestaurantRow {
  id: string;
  owner_id: string;
  max_capacity: number;
  status: string;
}

@Injectable()
export class ReservationsService {
  constructor(private readonly dbService: DbService) {}

  async create(user: AuthUser, dto: CreateReservationDto) {
    if (user.role !== "user") {
      throw new ForbiddenException("일반 사용자만 예약할 수 있습니다.");
    }

    this.validateCreateDto(dto);

    const restaurantResult = await this.dbService.query<RestaurantRow>(
      `SELECT id, owner_id, max_capacity, status
       FROM restaurants
       WHERE id = $1`,
      [dto.restaurantId],
    );

    const restaurant = restaurantResult.rows[0];

    if (!restaurant) {
      throw new NotFoundException("식당을 찾을 수 없습니다.");
    }

    if (restaurant.status !== "approved") {
      throw new BadRequestException("예약할 수 없는 식당입니다.");
    }

    if (dto.headCount > restaurant.max_capacity) {
      throw new BadRequestException("예약 인원이 식당 최대 수용 인원을 초과했습니다.");
    }

    const result = await this.dbService.query<ReservationRow>(
      `INSERT INTO reservations (
         id, user_id, restaurant_id, reservation_date, reservation_time,
         head_count, request_memo
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        randomUUID(),
        user.id,
        dto.restaurantId,
        dto.reservationDate,
        dto.reservationTime,
        dto.headCount,
        dto.requestMemo || null,
      ],
    );

    return this.toResponse(result.rows[0]);
  }

  async findMine(user: AuthUser) {
    if (user.role !== "user") {
      throw new ForbiddenException("일반 사용자만 내 예약을 조회할 수 있습니다.");
    }

    const result = await this.dbService.query<ReservationRow>(
      `SELECT *
       FROM reservations
       WHERE user_id = $1
       ORDER BY reservation_date DESC, reservation_time DESC, created_at DESC`,
      [user.id],
    );

    return result.rows.map((row) => this.toResponse(row));
  }

  async findMineById(user: AuthUser, id: string) {
    if (user.role !== "user") {
      throw new ForbiddenException("일반 사용자만 예약 상세를 조회할 수 있습니다.");
    }

    const result = await this.dbService.query<ReservationRow>(
      `SELECT *
       FROM reservations
       WHERE id = $1 AND user_id = $2`,
      [id, user.id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("예약을 찾을 수 없습니다.");
    }

    return this.toResponse(result.rows[0]);
  }

  async updateMine(user: AuthUser, id: string, dto: UpdateReservationDto) {
    const current = await this.findMineRow(user, id);

    if (current.status !== "confirmed") {
      throw new ForbiddenException("확정 상태의 예약만 수정할 수 있습니다.");
    }

    if (dto.headCount !== undefined) {
      if (typeof dto.headCount !== "number" || !Number.isInteger(dto.headCount) || dto.headCount <= 0) {
        throw new BadRequestException("예약 인원은 1명 이상이어야 합니다.");
      }

      const restaurantResult = await this.dbService.query<RestaurantRow>(
        `SELECT id, owner_id, max_capacity, status
         FROM restaurants
         WHERE id = $1`,
        [current.restaurant_id],
      );

      const restaurant = restaurantResult.rows[0];

      if (restaurant && dto.headCount > restaurant.max_capacity) {
        throw new BadRequestException("예약 인원이 식당 최대 수용 인원을 초과했습니다.");
      }
    }

    if (dto.reservationTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.reservationTime)) {
      throw new BadRequestException("예약 시간은 HH:mm 형식이어야 합니다.");
    }

    const result = await this.dbService.query<ReservationRow>(
      `UPDATE reservations
       SET
         reservation_date = $1,
         reservation_time = $2,
         head_count = $3,
         request_memo = $4,
         updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [
        dto.reservationDate ?? current.reservation_date,
        dto.reservationTime ?? current.reservation_time,
        dto.headCount ?? current.head_count,
        dto.requestMemo ?? current.request_memo,
        id,
        user.id,
      ],
    );

    return this.toResponse(result.rows[0]);
  }

  async cancelMine(user: AuthUser, id: string) {
    const current = await this.findMineRow(user, id);

    if (current.status !== "confirmed") {
      throw new ForbiddenException("확정 상태의 예약만 취소할 수 있습니다.");
    }

    const result = await this.dbService.query<ReservationRow>(
      `UPDATE reservations
       SET status = 'canceled', updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, user.id],
    );

    return this.toResponse(result.rows[0]);
  }

  async findForOwner(user: AuthUser) {
    if (user.role !== "owner") {
      throw new ForbiddenException("사장만 예약 목록을 조회할 수 있습니다.");
    }

    const result = await this.dbService.query<ReservationRow>(
      `SELECT r.*
       FROM reservations r
       JOIN restaurants rt ON rt.id = r.restaurant_id
       WHERE rt.owner_id = $1
       ORDER BY r.reservation_date ASC, r.reservation_time ASC, r.created_at DESC`,
      [user.id],
    );

    return result.rows.map((row) => this.toResponse(row));
  }

  private async findMineRow(user: AuthUser, id: string) {
    if (user.role !== "user") {
      throw new ForbiddenException("일반 사용자만 예약을 관리할 수 있습니다.");
    }

    const result = await this.dbService.query<ReservationRow>(
      `SELECT *
       FROM reservations
       WHERE id = $1 AND user_id = $2`,
      [id, user.id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("예약을 찾을 수 없습니다.");
    }

    return result.rows[0];
  }

  private validateCreateDto(dto: CreateReservationDto) {
    if (!dto.restaurantId || !dto.reservationDate || !dto.reservationTime) {
      throw new BadRequestException("식당, 예약 날짜, 예약 시간은 필수입니다.");
    }

    if (typeof dto.headCount !== "number" || !Number.isInteger(dto.headCount) || dto.headCount <= 0) {
      throw new BadRequestException("예약 인원은 1명 이상이어야 합니다.");
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.reservationTime)) {
      throw new BadRequestException("예약 시간은 HH:mm 형식이어야 합니다.");
    }
  }

  private toResponse(row: ReservationRow) {
    return {
      id: row.id,
      userId: row.user_id,
      restaurantId: row.restaurant_id,
      reservationDate: row.reservation_date,
      reservationTime: row.reservation_time,
      headCount: row.head_count,
      requestMemo: row.request_memo,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
