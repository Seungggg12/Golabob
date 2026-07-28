import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DbService } from "../shared/db.service";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";

interface RestaurantRow {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  phone: string | null;
  image_url: string | null;
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

interface RequestUser {
  id: string;
  role: string;
}

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly dbService: DbService,
  ) {}

  async create(
    user: RequestUser,
    dto: CreateRestaurantDto,
  ) {
    if (user.role !== "OWNER") {
      throw new ForbiddenException(
        "사장만 식당을 등록할 수 있습니다.",
      );
    }

    this.validateCreateDto(dto);

    const result =
      await this.dbService.query<RestaurantRow>(
        `INSERT INTO restaurants (
           id,
           owner_id,
           name,
           address,
           phone,
           image_url,
           category,
           description,
           max_capacity,
           has_room,
           has_parking,
           open_time,
           close_time
         )
         VALUES (
           $1,
           $2,
           $3,
           $4,
           $5,
           $6,
           $7,
           $8,
           $9,
           $10,
           $11,
           $12,
           $13
         )
         RETURNING *`,
        [
          randomUUID(),
          user.id,
          dto.name,
          dto.address,
          dto.phone,
          dto.imageUrl,
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
    const result =
      await this.dbService.query<RestaurantRow>(
        `SELECT *
         FROM restaurants
         WHERE status = 'approved'
         ORDER BY created_at DESC`,
      );

    return result.rows.map((row) =>
      this.toResponse(row),
    );
  }

  async findOne(id: string) {
    const result =
      await this.dbService.query<RestaurantRow>(
        `SELECT *
         FROM restaurants
         WHERE id = $1`,
        [id],
      );

    if (!result.rows[0]) {
      throw new NotFoundException(
        "식당을 찾을 수 없습니다.",
      );
    }

    return this.toResponse(result.rows[0]);
  }

  async findMine(user: RequestUser) {
    if (user.role !== "OWNER") {
      throw new ForbiddenException(
        "사장만 내 식당을 조회할 수 있습니다.",
      );
    }

    const result =
      await this.dbService.query<RestaurantRow>(
        `SELECT *
         FROM restaurants
         WHERE owner_id = $1
         ORDER BY created_at DESC`,
        [user.id],
      );

    return result.rows.map((row) =>
      this.toResponse(row),
    );
  }

  async updateMine(
    user: RequestUser,
    id: string,
    dto: UpdateRestaurantDto,
  ) {
    if (user.role !== "OWNER") {
      throw new ForbiddenException(
        "사장만 식당을 수정할 수 있습니다.",
      );
    }

    await this.assertOwnRestaurant(
      user.id,
      id,
    );

    const current =
      await this.dbService.query<RestaurantRow>(
        `SELECT *
         FROM restaurants
         WHERE id = $1`,
        [id],
      );

    const restaurant = current.rows[0];

    const result =
      await this.dbService.query<RestaurantRow>(
        `UPDATE restaurants
         SET
           name = $1,
           address = $2,
           phone = $3,
           image_url = $4,
           category = $5,
           description = $6,
           max_capacity = $7,
           has_room = $8,
           has_parking = $9,
           open_time = $10,
           close_time = $11,
           updated_at = NOW()
         WHERE id = $12
         RETURNING *`,
        [
          dto.name ?? restaurant.name,
          dto.address ?? restaurant.address,
          dto.phone ?? restaurant.phone,
          dto.imageUrl ??
            restaurant.image_url,
          dto.category ??
            restaurant.category,
          dto.description ??
            restaurant.description,
          dto.maxCapacity ??
            restaurant.max_capacity,
          dto.hasRoom ??
            restaurant.has_room,
          dto.hasParking ??
            restaurant.has_parking,
          dto.openTime ??
            restaurant.open_time,
          dto.closeTime ??
            restaurant.close_time,
          id,
        ],
      );

    return this.toResponse(result.rows[0]);
  }

  async removeMine(
    user: RequestUser,
    id: string,
  ) {
    if (user.role !== "OWNER") {
      throw new ForbiddenException(
        "사장만 식당을 삭제할 수 있습니다.",
      );
    }

    await this.assertOwnRestaurant(
      user.id,
      id,
    );

    const reservationResult =
      await this.dbService.query<{
        count: string;
      }>(
        `SELECT COUNT(*) AS count
         FROM reservations
         WHERE restaurant_id = $1
           AND status IN (
             'pending',
             'confirmed'
           )`,
        [id],
      );

    const activeReservationCount =
      Number(
        reservationResult.rows[0]?.count ??
          0,
      );

    if (activeReservationCount > 0) {
      throw new BadRequestException(
        "진행 중인 예약이 있는 식당은 삭제할 수 없습니다.",
      );
    }

    const result =
      await this.dbService.query<RestaurantRow>(
        `DELETE FROM restaurants
         WHERE id = $1
           AND owner_id = $2
         RETURNING *`,
        [id, user.id],
      );

    if (!result.rows[0]) {
      throw new NotFoundException(
        "삭제할 식당을 찾을 수 없습니다.",
      );
    }

    return {
      message:
        "식당이 삭제되었습니다.",
      restaurantId: id,
    };
  }

  private async assertOwnRestaurant(
    ownerId: string,
    restaurantId: string,
  ) {
    const result =
      await this.dbService.query<RestaurantRow>(
        `SELECT *
         FROM restaurants
         WHERE id = $1
           AND owner_id = $2`,
        [
          restaurantId,
          ownerId,
        ],
      );

    if (!result.rows[0]) {
      throw new NotFoundException(
        "내 식당을 찾을 수 없습니다.",
      );
    }
  }

  private validateCreateDto(
    dto: CreateRestaurantDto,
  ) {
    if (
      !dto.name ||
      !dto.address ||
      !dto.phone ||
      !dto.category ||
      !dto.openTime ||
      !dto.closeTime
    ) {
      throw new BadRequestException(
        "식당명, 주소, 전화번호, 대표 이미지, 카테고리, 영업시간은 필수입니다.",
      );
    }

    if (
      typeof dto.maxCapacity !==
        "number" ||
      !Number.isInteger(
        dto.maxCapacity,
      ) ||
      dto.maxCapacity <= 0
    ) {
      throw new BadRequestException(
        "최대 수용 인원은 1명 이상이어야 합니다.",
      );
    }

    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        dto.openTime,
      )
    ) {
      throw new BadRequestException(
        "영업 시작 시간은 HH:mm 형식이어야 합니다.",
      );
    }

    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        dto.closeTime,
      )
    ) {
      throw new BadRequestException(
        "영업 종료 시간은 HH:mm 형식이어야 합니다.",
      );
    }

    if (
      dto.openTime >= dto.closeTime
    ) {
      throw new BadRequestException(
        "영업 종료 시간은 시작 시간보다 늦어야 합니다.",
      );
    }

    if (
      !/^[0-9\-+()\s]{8,30}$/.test(
        dto.phone,
      )
    ) {
      throw new BadRequestException(
        "전화번호 형식이 올바르지 않습니다.",
      );
    }
  }

  private toResponse(
    row: RestaurantRow,
  ) {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      address: row.address,
      phone: row.phone,
      imageUrl: row.image_url,
      category: row.category,
      description: row.description,
      maxCapacity:
        row.max_capacity,
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