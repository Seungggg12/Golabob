import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "../auth/auth-user";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { UpdateReservationDto } from "./dto/update-reservation.dto";
import { ReservationsService } from "./reservations.service";

@ApiTags("Reservations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @ApiOperation({ summary: "식당 예약 등록", description: "사용자가 특정 식당에 일반 예약을 등록합니다." })
  @ApiResponse({ status: 201, description: "예약 등록 완료" })
  @Roles("user")
  @Post("reservations")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(user, dto);
  }

  @ApiOperation({ summary: "내 예약 목록 조회", description: "사용자가 본인이 등록한 예약 목록을 조회합니다." })
  @Roles("user")
  @Get("reservations/me")
  findMine(@CurrentUser() user: AuthUser) {
    return this.reservationsService.findMine(user);
  }

  @ApiOperation({ summary: "내 예약 상세 조회", description: "사용자가 본인이 등록한 특정 예약을 조회합니다." })
  @ApiParam({ name: "id", example: "예약 UUID", description: "조회할 예약 id" })
  @Roles("user")
  @Get("reservations/:id")
  findMineById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.reservationsService.findMineById(user, id);
  }

  @ApiOperation({ summary: "내 예약 수정", description: "사용자가 본인이 등록한 확정 상태의 예약 정보를 수정합니다." })
  @ApiParam({ name: "id", example: "예약 UUID", description: "수정할 예약 id" })
  @Roles("user")
  @Patch("reservations/:id")
  updateMine(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.updateMine(user, id, dto);
  }

  @ApiOperation({ summary: "내 예약 취소", description: "사용자가 본인이 등록한 확정 상태의 예약을 취소합니다." })
  @ApiParam({ name: "id", example: "예약 UUID", description: "취소할 예약 id" })
  @Roles("user")
  @Patch("reservations/:id/cancel")
  cancelMine(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.reservationsService.cancelMine(user, id);
  }

  @ApiOperation({ summary: "사장 예약 목록 조회", description: "사장이 본인 식당에 들어온 예약 목록을 조회합니다." })
  @Roles("owner")
  @Get("owner/reservations")
  findForOwner(@CurrentUser() user: AuthUser) {
    return this.reservationsService.findForOwner(user);
  }

  @ApiOperation({ summary: "사장 예약 확정", description: "사장이 본인 식당에 들어온 예약 요청을 확정합니다." })
  @ApiParam({ name: "id", example: "예약 UUID", description: "확정할 예약 id" })
  @Roles("owner")
  @Patch("owner/reservations/:id/confirm")
  confirmForOwner(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.reservationsService.confirmForOwner(user, id);
  }

  @ApiOperation({ summary: "사장 예약 거절", description: "사장이 본인 식당에 들어온 예약 요청을 거절합니다." })
  @ApiParam({ name: "id", example: "예약 UUID", description: "거절할 예약 id" })
  @Roles("owner")
  @Patch("owner/reservations/:id/reject")
  rejectForOwner(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.reservationsService.rejectForOwner(user, id);
  }
}
