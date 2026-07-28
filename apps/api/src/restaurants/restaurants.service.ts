import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AuthUser, hasRole } from "../auth/auth-user";
import { DbService } from "../shared/db.service";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";

interface RestaurantRow {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  category: string;
  description: string | null;
  max_capacity: number;
  has_room: boolean;
  has_parking: boolean;
  open_time: string;
  close_time: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class RestaurantsService {
  constructor(private readonly dbService: DbService) {}

  async create(user: AuthUser, dto: CreateRestaurantDto) {
    if (!hasRole(user, "owner")) {
      throw new ForbiddenException("사장만 식당을 등록할 수 있습니다.");
    }

    this.validateCreateDto(dto);

    const result = await this.dbService.query<RestaurantRow>(
      `INSERT INTO restaurants (
         id, owner_id, name, address, category, description,
         max_capacity, has_room, has_parking, open_time, close_time
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        randomUUID(),
        user.id,
        dto.name,
        dto.address,
        dto.category,
        dto.description || null,
        dto.maxCapacity,
        dto.hasRoom ?? false,
        dto.hasParking ?? false,
        dto.openTime,
        dto.closeTime,
      ],
    );

    return this.toResponse(result.rows[0]);
  }

  async findAll() {
    const result = await this.dbService.query<RestaurantRow>(
      `SELECT *
       FROM restaurants
       WHERE status = 'approved'
       ORDER BY created_at DESC`,
    );

    return result.rows.map((row) => this.toResponse(row));
  }

  async findOne(id: string) {
    const result = await this.dbService.query<RestaurantRow>(
      `SELECT *
       FROM restaurants
       WHERE id = $1`,
      [id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("식당을 찾을 수 없습니다.");
    }

    return this.toResponse(result.rows[0]);
  }

  async findMine(user: AuthUser) {
    if (!hasRole(user, "owner")) {
      throw new ForbiddenException("사장만 내 식당을 조회할 수 있습니다.");
    }

    const result = await this.dbService.query<RestaurantRow>(
      `SELECT *
       FROM restaurants
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [user.id],
    );

    return result.rows.map((row) => this.toResponse(row));
  }

  async updateMine(user: AuthUser, id: string, dto: UpdateRestaurantDto) {
    if (!hasRole(user, "owner")) {
      throw new ForbiddenException("사장만 식당을 수정할 수 있습니다.");
    }

    await this.assertOwnRestaurant(user.id, id);

    const current = await this.dbService.query<RestaurantRow>(
      `SELECT *
       FROM restaurants
       WHERE id = $1`,
      [id],
    );

    const restaurant = current.rows[0];

    const result = await this.dbService.query<RestaurantRow>(
      `UPDATE restaurants
       SET
         name = $1,
         address = $2,
         category = $3,
         description = $4,
         max_capacity = $5,
         has_room = $6,
         has_parking = $7,
         open_time = $8,
         close_time = $9,
         updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        dto.name ?? restaurant.name,
        dto.address ?? restaurant.address,
        dto.category ?? restaurant.category,
        dto.description ?? restaurant.description,
        dto.maxCapacity ?? restaurant.max_capacity,
        dto.hasRoom ?? restaurant.has_room,
        dto.hasParking ?? restaurant.has_parking,
        dto.openTime ?? restaurant.open_time,
        dto.closeTime ?? restaurant.close_time,
        id,
      ],
    );

    return this.toResponse(result.rows[0]);
  }

  private async assertOwnRestaurant(ownerId: string, restaurantId: string) {
    const result = await this.dbService.query<RestaurantRow>(
      `SELECT *
       FROM restaurants
       WHERE id = $1 AND owner_id = $2`,
      [restaurantId, ownerId],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("수정할 식당을 찾을 수 없습니다.");
    }
  }

  private validateCreateDto(dto: CreateRestaurantDto) {
    if (!dto.name || !dto.address || !dto.category || !dto.openTime || !dto.closeTime) {
      throw new BadRequestException("식당명, 주소, 카테고리, 영업시간은 필수입니다.");
    }

    if (typeof dto.maxCapacity !== "number" || !Number.isInteger(dto.maxCapacity) || dto.maxCapacity <= 0) {
      throw new BadRequestException("최대 수용 인원은 1명 이상이어야 합니다.");
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.openTime)) {
      throw new BadRequestException("영업 시작 시간은 HH:mm 형식이어야 합니다.");
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.closeTime)) {
      throw new BadRequestException("영업 종료 시간은 HH:mm 형식이어야 합니다.");
    }
  }

  private toResponse(row: RestaurantRow) {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      address: row.address,
      category: row.category,
      description: row.description,
      maxCapacity: row.max_capacity,
      hasRoom: row.has_room,
      hasParking: row.has_parking,
      openTime: row.open_time,
      closeTime: row.close_time,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
