import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
  } from "@nestjs/common";
  import { randomUUID } from "node:crypto";
  import { AuthUser } from "../auth/auth-user";
  import { DbService } from "../shared/db.service";
  import { CreateReviewDto } from "./dto/create-review.dto";
  import { UpdateReviewDto } from "./dto/update-review.dto";
  
  interface ReviewRow {
    id: string;
    reservation_id: string;
    restaurant_id: string;
    user_id: string;
    rating: number;
    content: string;
    created_at: Date;
    updated_at: Date;
  }
  
  interface ReservationRow {
    id: string;
    user_id: string;
    restaurant_id: string;
    status: string;
  }
  
  @Injectable()
  export class ReviewsService {
    constructor(private readonly dbService: DbService) {}
  
    async create(user: AuthUser, dto: CreateReviewDto) {
      if (user.role !== "user") {
        throw new ForbiddenException("일반 사용자만 리뷰를 작성할 수 있습니다.");
      }
  
      this.validateCreateDto(dto);
  
      const reservation = await this.findReservation(dto.reservationId);
  
      if (reservation.user_id !== user.id) {
        throw new ForbiddenException("본인 예약에만 리뷰를 작성할 수 있습니다.");
      }
  
      if (reservation.restaurant_id !== dto.restaurantId) {
        throw new BadRequestException("예약 식당과 리뷰 식당이 일치하지 않습니다.");
      }
  
      if (reservation.status !== "completed") {
        throw new ForbiddenException("방문 완료된 예약에만 리뷰를 작성할 수 있습니다.");
      }
  
      const duplicated = await this.dbService.query<ReviewRow>(
        `SELECT *
         FROM reviews
         WHERE reservation_id = $1 AND user_id = $2`,
        [dto.reservationId, user.id],
      );
  
      if (duplicated.rows[0]) {
        throw new BadRequestException("이미 해당 예약에 리뷰를 작성했습니다.");
      }
  
      const result = await this.dbService.query<ReviewRow>(
        `INSERT INTO reviews (
           id, reservation_id, restaurant_id, user_id, rating, content
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          randomUUID(),
          dto.reservationId,
          dto.restaurantId,
          user.id,
          dto.rating,
          dto.content,
        ],
      );
  
      return this.toResponse(result.rows[0]);
    }
  
    async findMine(user: AuthUser) {
      if (user.role !== "user") {
        throw new ForbiddenException("일반 사용자만 내 리뷰를 조회할 수 있습니다.");
      }
  
      const result = await this.dbService.query<ReviewRow>(
        `SELECT *
         FROM reviews
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [user.id],
      );
  
      return result.rows.map((row) => this.toResponse(row));
    }
  
    async findByRestaurant(restaurantId: string) {
      const result = await this.dbService.query<ReviewRow>(
        `SELECT *
         FROM reviews
         WHERE restaurant_id = $1
         ORDER BY created_at DESC`,
        [restaurantId],
      );
  
      return result.rows.map((row) => this.toResponse(row));
    }
  
    async updateMine(user: AuthUser, id: string, dto: UpdateReviewDto) {
      if (user.role !== "user") {
        throw new ForbiddenException("일반 사용자만 리뷰를 수정할 수 있습니다.");
      }
  
      const review = await this.findMineRow(user.id, id);
  
      if (dto.rating !== undefined) {
        this.validateRating(dto.rating);
      }
  
      if (dto.content !== undefined && dto.content.trim().length === 0) {
        throw new BadRequestException("리뷰 내용은 비어 있을 수 없습니다.");
      }
  
      const result = await this.dbService.query<ReviewRow>(
        `UPDATE reviews
         SET
           rating = $1,
           content = $2,
           updated_at = NOW()
         WHERE id = $3 AND user_id = $4
         RETURNING *`,
        [
          dto.rating ?? review.rating,
          dto.content ?? review.content,
          id,
          user.id,
        ],
      );
  
      return this.toResponse(result.rows[0]);
    }
  
    async removeMine(user: AuthUser, id: string) {
      if (user.role !== "user") {
        throw new ForbiddenException("일반 사용자만 리뷰를 삭제할 수 있습니다.");
      }
  
      await this.findMineRow(user.id, id);
  
      const result = await this.dbService.query<ReviewRow>(
        `DELETE FROM reviews
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, user.id],
      );
  
      return {
        message: "리뷰가 삭제되었습니다.",
        deletedReview: this.toResponse(result.rows[0]),
      };
    }
  
    private async findReservation(id: string) {
      const result = await this.dbService.query<ReservationRow>(
        `SELECT id, user_id, restaurant_id, status
         FROM reservations
         WHERE id = $1`,
        [id],
      );
  
      if (!result.rows[0]) {
        throw new NotFoundException("예약을 찾을 수 없습니다.");
      }
  
      return result.rows[0];
    }
  
    private async findMineRow(userId: string, reviewId: string) {
      const result = await this.dbService.query<ReviewRow>(
        `SELECT *
         FROM reviews
         WHERE id = $1 AND user_id = $2`,
        [reviewId, userId],
      );
  
      if (!result.rows[0]) {
        throw new NotFoundException("리뷰를 찾을 수 없습니다.");
      }
  
      return result.rows[0];
    }
  
    private validateCreateDto(dto: CreateReviewDto) {
      if (!dto.reservationId || !dto.restaurantId) {
        throw new BadRequestException("예약 ID와 식당 ID는 필수입니다.");
      }
  
      this.validateRating(dto.rating);
  
      if (!dto.content || dto.content.trim().length === 0) {
        throw new BadRequestException("리뷰 내용은 필수입니다.");
      }
    }
  
    private validateRating(rating: number) {
      if (
        typeof rating !== "number" ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        throw new BadRequestException("별점은 1점부터 5점까지 가능합니다.");
      }
    }
  
    private toResponse(row: ReviewRow) {
      return {
        id: row.id,
        reservationId: row.reservation_id,
        restaurantId: row.restaurant_id,
        userId: row.user_id,
        rating: row.rating,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }
  }
