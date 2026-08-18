import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { assertRole, AuthUser } from "../auth/auth-user";
import { DbService } from "../shared/db.service";
import { CreateDiningRequestDto } from "./dto/create-dining-request.dto";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const POSTGRES_INT_MAX = 2_147_483_647;
const POSTGRES_BIGINT_MAX = 9_223_372_036_854_775_807n;
const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1_000;
const SEOUL_NOW_SQL = "CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul'";

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

interface NormalizedCreateDiningRequest {
  title: string;
  diningDate: string;
  diningTime: string;
  headCount: number;
  region: string;
  budgetPerPerson: number;
  preferredMenu: string | null;
  requiredOptions: string | null;
  memo: string | null;
}

export interface DiningRequestListOptions {
  cursor?: string;
  limit?: string;
}

@Injectable()
export class DiningRequestsService {
  constructor(private readonly dbService: DbService) {}

  async create(user: AuthUser, dto: CreateDiningRequestDto) {
    assertRole(user, ["user"]);
    const input = this.normalizeCreateDto(dto);

    const result = await this.dbService.query<DiningRequestRow>(
      `INSERT INTO dining_requests (
         user_id, title, dining_date, dining_time, head_count, region,
         budget_per_person, preferred_menu, required_options, memo
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING
         id, user_id, title, dining_date, dining_time, head_count, region,
         budget_per_person, preferred_menu, required_options, memo, status,
         created_at, updated_at`,
      [
        user.id,
        input.title,
        input.diningDate,
        input.diningTime,
        input.headCount,
        input.region,
        input.budgetPerPerson,
        input.preferredMenu,
        input.requiredOptions,
        input.memo,
      ],
    );

    return this.toResponse(result.rows[0]);
  }

  async findMine(user: AuthUser, options: DiningRequestListOptions = {}) {
    assertRole(user, ["user"]);
    const cursor = this.parseCursor(options.cursor);
    const limit = this.parseLimit(options.limit);

    const result = await this.dbService.query<DiningRequestRow>(
      `SELECT
         id, user_id, title, dining_date, dining_time, head_count, region,
         budget_per_person, preferred_menu, required_options, memo,
         CASE
           WHEN status = 'open'
             AND dining_date + dining_time <= ${SEOUL_NOW_SQL}
           THEN 'expired'
           ELSE status
         END AS status,
         created_at, updated_at
       FROM dining_requests
       WHERE user_id = $1
         AND ($2::bigint IS NULL OR id < $2::bigint)
       ORDER BY id DESC
       LIMIT $3`,
      [user.id, cursor, limit],
    );

    return result.rows.map((row) => this.toResponse(row));
  }

  async findMineById(user: AuthUser, id: string) {
    assertRole(user, ["user"]);
    const requestId = this.parseId(id, "회식 요청 id");

    const result = await this.dbService.query<DiningRequestRow>(
      `SELECT
         id, user_id, title, dining_date, dining_time, head_count, region,
         budget_per_person, preferred_menu, required_options, memo,
         CASE
           WHEN status = 'open'
             AND dining_date + dining_time <= ${SEOUL_NOW_SQL}
           THEN 'expired'
           ELSE status
         END AS status,
         created_at, updated_at
       FROM dining_requests
       WHERE id = $1 AND user_id = $2`,
      [requestId, user.id],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("회식 요청을 찾을 수 없습니다.");
    }

    return this.toResponse(result.rows[0]);
  }

  async cancelMine(user: AuthUser, id: string) {
    assertRole(user, ["user"]);
    const requestId = this.parseId(id, "회식 요청 id");

    const result = await this.dbService.query<DiningRequestRow>(
      `WITH canceled_request AS (
         UPDATE dining_requests
         SET status = 'canceled', updated_at = NOW()
         WHERE id = $1
           AND user_id = $2
           AND status = 'open'
           AND dining_date + dining_time > ${SEOUL_NOW_SQL}
         RETURNING
           id, user_id, title, dining_date, dining_time, head_count, region,
           budget_per_person, preferred_menu, required_options, memo, status,
           created_at, updated_at
       ), canceled_offers AS (
         UPDATE offers
         SET status = 'canceled', updated_at = NOW()
         WHERE dining_request_id IN (SELECT id FROM canceled_request)
           AND status = 'pending'
         RETURNING id
       )
       SELECT canceled_request.*
       FROM canceled_request
       CROSS JOIN (SELECT COUNT(*) FROM canceled_offers) AS offer_count`,
      [requestId, user.id],
    );

    if (result.rows[0]) {
      return this.toResponse(result.rows[0]);
    }

    const current = await this.dbService.query<{ status: string; is_past: boolean }>(
      `SELECT
         status,
         dining_date + dining_time <= ${SEOUL_NOW_SQL} AS is_past
       FROM dining_requests
       WHERE id = $1 AND user_id = $2`,
      [requestId, user.id],
    );

    if (!current.rows[0]) {
      throw new NotFoundException("회식 요청을 찾을 수 없습니다.");
    }

    if (current.rows[0].is_past) {
      throw new ConflictException("이미 지난 회식 요청은 취소할 수 없습니다.");
    }

    throw new ConflictException("모집 중인 회식 요청만 취소할 수 있습니다.");
  }

  async findOpenForOwner(user: AuthUser, options: DiningRequestListOptions = {}) {
    assertRole(user, ["owner"]);
    const cursor = this.parseCursor(options.cursor);
    const limit = this.parseLimit(options.limit);
    const params: unknown[] = [];
    let cursorCondition = "";

    if (cursor) {
      params.push(cursor);
      cursorCondition = `
         AND (dr.dining_date, dr.dining_time, dr.id) > (
           SELECT dining_date, dining_time, id
           FROM dining_requests
           WHERE id = $1
         )`;
    }

    params.push(limit);
    const limitParameter = params.length;
    const result = await this.dbService.query<DiningRequestRow>(
      `SELECT
         dr.id, dr.user_id, dr.title, dr.dining_date, dr.dining_time,
         dr.head_count, dr.region, dr.budget_per_person, dr.preferred_menu,
         dr.required_options, dr.memo, dr.status, dr.created_at, dr.updated_at
       FROM dining_requests dr
       WHERE dr.status = 'open'
         AND dr.dining_date + dr.dining_time > ${SEOUL_NOW_SQL}${cursorCondition}
       ORDER BY dr.dining_date ASC, dr.dining_time ASC, dr.id ASC
       LIMIT $${limitParameter}`,
      params,
    );

    return result.rows.map((row) => this.toResponse(row));
  }

  async findOpenByIdForOwner(user: AuthUser, id: string) {
    assertRole(user, ["owner"]);
    const requestId = this.parseId(id, "회식 요청 id");

    const result = await this.dbService.query<DiningRequestRow>(
      `SELECT
         id, user_id, title, dining_date, dining_time, head_count, region,
         budget_per_person, preferred_menu, required_options, memo, status,
         created_at, updated_at
       FROM dining_requests
       WHERE id = $1
         AND status = 'open'
         AND dining_date + dining_time > ${SEOUL_NOW_SQL}`,
      [requestId],
    );

    if (!result.rows[0]) {
      throw new NotFoundException("사장이 확인할 수 있는 열린 회식 요청이 없습니다.");
    }

    return this.toResponse(result.rows[0]);
  }

  private normalizeCreateDto(dto: CreateDiningRequestDto): NormalizedCreateDiningRequest {
    const title = this.normalizeRequiredText(dto.title, "제목", 100);
    const region = this.normalizeRequiredText(dto.region, "지역", 100);
    const diningDate = this.validateDate(dto.diningDate);
    const diningTime = this.validateTime(dto.diningTime, "회식 시간");
    const headCount = this.validatePositiveInteger(dto.headCount, "회식 인원", 2);
    const budgetPerPerson = this.validatePositiveInteger(dto.budgetPerPerson, "1인 예산");
    const preferredMenu = this.normalizeOptionalText(dto.preferredMenu, "선호 메뉴", 200);
    const requiredOptions = this.normalizeOptionalText(dto.requiredOptions, "필수 조건", 1_000);
    const memo = this.normalizeOptionalText(dto.memo, "추가 요청사항", 2_000);

    const [year, month, day] = diningDate.split("-").map(Number);
    const [hour, minute] = diningTime.split(":").map(Number);
    const diningAt = Date.UTC(year, month - 1, day, hour, minute) - SEOUL_OFFSET_MS;

    if (diningAt <= Date.now()) {
      throw new BadRequestException("회식 날짜와 시간은 현재보다 이후여야 합니다.");
    }

    return {
      title,
      diningDate,
      diningTime,
      headCount,
      region,
      budgetPerPerson,
      preferredMenu,
      requiredOptions,
      memo,
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

  private validateDate(value: unknown) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException("회식 날짜는 YYYY-MM-DD 형식이어야 합니다.");
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new BadRequestException("유효한 회식 날짜를 입력해주세요.");
    }

    return value;
  }

  private validateTime(value: unknown, label: string) {
    if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      throw new BadRequestException(`${label}은(는) HH:mm 형식이어야 합니다.`);
    }

    return value;
  }

  private validatePositiveInteger(value: unknown, label: string, minimum = 1) {
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < minimum ||
      value > POSTGRES_INT_MAX
    ) {
      throw new BadRequestException(
        minimum === 1
          ? `${label}은(는) 0보다 큰 정수여야 합니다.`
          : `${label}은(는) ${minimum} 이상의 정수여야 합니다.`,
      );
    }

    return value;
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
