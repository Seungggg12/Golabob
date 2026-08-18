import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthUser } from "../auth/auth-user";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateDiningRequestDto } from "./dto/create-dining-request.dto";
import { DiningRequestsService } from "./dining-requests.service";

@ApiTags("Dining Requests")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DiningRequestsController {
  constructor(private readonly diningRequestsService: DiningRequestsService) {}

  @ApiOperation({
    summary: "회식 조건 등록",
    description: "사용자가 지역, 날짜, 시간, 인원, 예산, 음식 종류, 요청 옵션, 추가 요청사항을 입력해 회식 요청을 생성합니다.",
  })
  @ApiResponse({ status: 201, description: "회식 요청 등록 완료" })
  @Roles("user")
  @Post("dining-requests")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDiningRequestDto) {
    return this.diningRequestsService.create(user, dto);
  }

  @ApiOperation({ summary: "내 요청 목록 조회", description: "로그인한 사용자가 직접 등록한 회식 요청 목록을 조회합니다." })
  @ApiQuery({ name: "cursor", required: false, description: "직전 페이지 마지막 요청 id" })
  @ApiQuery({ name: "limit", required: false, example: 50, description: "조회 개수(1~100)" })
  @Roles("user")
  @Get("dining-requests/me")
  findMine(
    @CurrentUser() user: AuthUser,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.diningRequestsService.findMine(user, { cursor, limit });
  }

  @ApiOperation({ summary: "내 요청 상세 조회", description: "사용자가 본인이 등록한 특정 회식 요청의 상세 조건을 확인합니다." })
  @ApiParam({ name: "id", example: "1", description: "조회할 회식 요청 id" })
  @Roles("user")
  @Get("dining-requests/:id")
  findMineById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.diningRequestsService.findMineById(user, id);
  }

  @ApiOperation({ summary: "요청 취소", description: "사용자가 등록한 OPEN 상태의 회식 요청을 CANCELED 상태로 변경합니다." })
  @ApiParam({ name: "id", example: "1", description: "취소할 회식 요청 id" })
  @Roles("user")
  @Patch("dining-requests/:id/cancel")
  cancelMine(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.diningRequestsService.cancelMine(user, id);
  }

  @ApiOperation({ summary: "신규 회식 요청 조회", description: "사장이 오퍼를 제안할 수 있는 OPEN 상태의 회식 요청 목록을 조회합니다." })
  @ApiQuery({ name: "cursor", required: false, description: "직전 페이지 마지막 요청 id" })
  @ApiQuery({ name: "limit", required: false, example: 50, description: "조회 개수(1~100)" })
  @Roles("owner")
  @Get("owner/dining-requests")
  findOpenForOwner(
    @CurrentUser() user: AuthUser,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.diningRequestsService.findOpenForOwner(user, { cursor, limit });
  }

  @ApiOperation({ summary: "회식 요청 상세 조회", description: "사장이 특정 회식 요청의 지역, 날짜, 시간, 인원, 예산, 요청사항을 확인합니다." })
  @ApiParam({ name: "id", example: "1", description: "사장이 확인할 회식 요청 id" })
  @Roles("owner")
  @Get("owner/dining-requests/:id")
  findOpenByIdForOwner(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.diningRequestsService.findOpenByIdForOwner(user, id);
  }
}
