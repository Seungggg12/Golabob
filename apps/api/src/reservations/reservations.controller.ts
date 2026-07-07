import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { UpdateReservationDto } from "./dto/update-reservation.dto";
import { ReservationsService } from "./reservations.service";

function parseRequestUser(headers: Record<string, string | string[] | undefined>) {
  const id = Array.isArray(headers["x-user-id"]) ? headers["x-user-id"][0] : headers["x-user-id"];
  const role = Array.isArray(headers["x-user-role"]) ? headers["x-user-role"][0] : headers["x-user-role"];

  return {
    id: id || "1",
    role: role || "USER",
  };
}

@ApiTags("Reservations")
@Controller()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @ApiOperation({ summary: "식당 예약 등록", description: "사용자가 특정 식당에 일반 예약을 등록합니다." })
  @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
  @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
  @ApiResponse({ status: 201, description: "예약 등록 완료" })
  @Post("reservations")
  create(@Headers() headers: Record<string, string | string[] | undefined>, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(parseRequestUser(headers), dto);
  }

  @ApiOperation({ summary: "내 예약 목록 조회", description: "사용자가 본인이 등록한 예약 목록을 조회합니다." })
  @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
  @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
  @Get("reservations/me")
  findMine(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.reservationsService.findMine(parseRequestUser(headers));
  }

  @ApiOperation({ summary: "내 예약 상세 조회", description: "사용자가 본인이 등록한 특정 예약을 조회합니다." })
  @ApiParam({ name: "id", example: "예약 UUID", description: "조회할 예약 id" })
  @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
  @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
  @Get("reservations/:id")
  findMineById(@Headers() headers: Record<string, string | string[] | undefined>, @Param("id") id: string) {
    return this.reservationsService.findMineById(parseRequestUser(headers), id);
  }

  @ApiOperation({ summary: "내 예약 수정", description: "사용자가 본인이 등록한 확정 상태의 예약 정보를 수정합니다." })
  @ApiParam({ name: "id", example: "예약 UUID", description: "수정할 예약 id" })
  @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
  @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
  @Patch("reservations/:id")
  updateMine(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("id") id: string,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.updateMine(parseRequestUser(headers), id, dto);
  }

  @ApiOperation({ summary: "내 예약 취소", description: "사용자가 본인이 등록한 확정 상태의 예약을 취소합니다." })
  @ApiParam({ name: "id", example: "예약 UUID", description: "취소할 예약 id" })
  @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
  @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
  @Patch("reservations/:id/cancel")
  cancelMine(@Headers() headers: Record<string, string | string[] | undefined>, @Param("id") id: string) {
    return this.reservationsService.cancelMine(parseRequestUser(headers), id);
  }

  @ApiOperation({ summary: "사장 예약 목록 조회", description: "사장이 본인 식당에 들어온 예약 목록을 조회합니다." })
  @ApiHeader({ name: "x-user-id", example: "2", description: "임시 로그인 사장 id" })
  @ApiHeader({ name: "x-user-role", example: "OWNER", description: "임시 역할" })
  @Get("owner/reservations")
  findForOwner(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.reservationsService.findForOwner(parseRequestUser(headers));
  }
}