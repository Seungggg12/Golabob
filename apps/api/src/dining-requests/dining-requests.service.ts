import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { DbService } from "../shared/db.service";
import { CreateDiningRequestDto } from "./dto/create-dining-request.dto";
import { assertRole, RequestUser } from "./request-user";

interface DiningRequestRow {
  id: string;
  user_id: string;
  title: string;
  dining_date: string;
  dining_time: string;
  head_count: number;
  region: string;
  budget_per_person: number;
  preferred_menu: string | null;
  required_options: string | null;
  memo: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class DiningRequestsService {
  constructor(private readonly dbService: DbService) {}

  async create(user: RequestUser, dto: CreateDiningRequestDto) {
    assertRole(user, ["USER"]);
    this.validateCreateDto(dto);

    const result = await this.dbService.query<DiningRequestRow>(
      `INSERT INTO dining_requests (
         id, user_id, title, dining_date, dining_time, head_count, region,
         budget_per_person, preferred_menu, required_options, memo
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        randomUUID(),
        user.id,
        dto.title,
        dto.diningDate,
        dto.diningTime,
        dto.headCount,
        dto.region,
        dto.budgetPerPerson,
        dto.preferredMenu || null,
        dto.requiredOptions || null,
        dto.memo || null,
      ],
    );

    return this.toResponse(result.rows[0]);
  }

  async findMine(user: RequestUser) {
    assertRole(user, ["USER"]);

    const result = await this.dbService.query<DiningRequestRow>(
      `SELECT * FROM dining_requests
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id],
    );

    return result.rows.map((row) => this.toResponse(row));
  }

  async findMineById(user: RequestUser, id: string) {
    assertRole(user, ["USER"]);

    const result = await this.dbService.query<DiningRequestRow>(
      `SELECT * FROM dining_requests
       WHERE id = $1 AND user_id = $2`,
      [id, user.id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("회식 요청을 찾을 수 없습니다.");
    }

    return this.toResponse(result.rows[0]);
  }

  async cancelMine(user: RequestUser, id: string) {
    const request = await this.findMineById(user, id);

    if (request.status !== "open") {
      throw new ForbiddenException("모집 중인 회식 요청만 취소할 수 있습니다.");
    }

    const result = await this.dbService.query<DiningRequestRow>(
      `UPDATE dining_requests
       SET status = 'canceled', updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, user.id],
    );

    return this.toResponse(result.rows[0]);
  }

  async findOpenForOwner(user: RequestUser) {
    assertRole(user, ["OWNER"]);

    const result = await this.dbService.query<DiningRequestRow>(
      `SELECT * FROM dining_requests
       WHERE status = 'open'
       ORDER BY dining_date ASC, dining_time ASC, created_at DESC`,
    );

    return result.rows.map((row) => this.toResponse(row));
  }

  async findOpenByIdForOwner(user: RequestUser, id: string) {
    assertRole(user, ["OWNER"]);

    const result = await this.dbService.query<DiningRequestRow>(
      `SELECT * FROM dining_requests
       WHERE id = $1 AND status = 'open'`,
      [id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("사장이 확인할 수 있는 열린 회식 요청이 없습니다.");
    }

    return this.toResponse(result.rows[0]);
  }

  private validateCreateDto(dto: CreateDiningRequestDto) {
    if (!dto.title || !dto.diningDate || !dto.diningTime || !dto.region) {
      throw new BadRequestException("제목, 날짜, 시간, 지역은 필수입니다.");
    }

    const headCount = dto.headCount;
    const budgetPerPerson = dto.budgetPerPerson;

    if (typeof headCount !== "number" || !Number.isInteger(headCount) || headCount < 2) {
      throw new BadRequestException("회식 인원은 2명 이상이어야 합니다.");
    }

    if (
      typeof budgetPerPerson !== "number" ||
      !Number.isInteger(budgetPerPerson) ||
      budgetPerPerson <= 0
    ) {
      throw new BadRequestException("1인 예산은 0보다 커야 합니다.");
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(dto.diningTime)) {
      throw new BadRequestException("회식 시간은 HH:mm 형식이어야 합니다.");
    }
  }

  private toResponse(row: DiningRequestRow) {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      diningDate: row.dining_date,
      diningTime: row.dining_time,
      headCount: row.head_count,
      region: row.region,
      budgetPerPerson: row.budget_per_person,
      preferredMenu: row.preferred_menu,
      requiredOptions: row.required_options,
      memo: row.memo,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
