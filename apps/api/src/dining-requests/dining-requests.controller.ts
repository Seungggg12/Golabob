import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateDiningRequestDto } from "./dto/create-dining-request.dto";
import { DiningRequestsService } from "./dining-requests.service";
import { parseRequestUser } from "./request-user";

@ApiTags("Dining Requests")
@Controller()
export class DiningRequestsController {
  constructor(private readonly diningRequestsService: DiningRequestsService) {}

  @ApiOperation({
    summary: "회식 조건 등록",
    description: "사용자가 지역, 날짜, 시간, 인원, 예산, 음식 종류, 요청 옵션, 추가 요청사항을 입력해 회식 요청을 생성합니다.",
  })
  @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
  @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
  @ApiResponse({ status: 201, description: "회식 요청 등록 완료" })
  @Post("dining-requests")
  create(@Headers() headers: Record<string, string | string[] | undefined>, @Body() dto: CreateDiningRequestDto) {
    return this.diningRequestsService.create(parseRequestUser(headers), dto);
  }

  @ApiOperation({ summary: "내 요청 목록 조회", description: "로그인한 사용자가 직접 등록한 회식 요청 목록을 조회합니다." })
  @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
  @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
  @Get("dining-requests/me")
  findMine(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.diningRequestsService.findMine(parseRequestUser(headers));
  }

  @ApiOperation({ summary: "내 요청 상세 조회", description: "사용자가 본인이 등록한 특정 회식 요청의 상세 조건을 확인합니다." })
  @ApiParam({ name: "id", example: "1", description: "조회할 회식 요청 id" })
  @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
  @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
  @Get("dining-requests/:id")
  findMineById(@Headers() headers: Record<string, string | string[] | undefined>, @Param("id") id: string) {
    return this.diningRequestsService.findMineById(parseRequestUser(headers), id);
  }

  @ApiOperation({ summary: "요청 취소", description: "사용자가 등록한 OPEN 상태의 회식 요청을 CANCELED 상태로 변경합니다." })
  @ApiParam({ name: "id", example: "1", description: "취소할 회식 요청 id" })
  @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
  @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
  @Patch("dining-requests/:id/cancel")
  cancelMine(@Headers() headers: Record<string, string | string[] | undefined>, @Param("id") id: string) {
    return this.diningRequestsService.cancelMine(parseRequestUser(headers), id);
  }

  @ApiOperation({ summary: "신규 회식 요청 조회", description: "사장이 오퍼를 제안할 수 있는 OPEN 상태의 회식 요청 목록을 조회합니다." })
  @ApiHeader({ name: "x-user-id", example: "2", description: "임시 로그인 사장 id" })
  @ApiHeader({ name: "x-user-role", example: "OWNER", description: "임시 역할" })
  @Get("owner/dining-requests")
  findOpenForOwner(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.diningRequestsService.findOpenForOwner(parseRequestUser(headers));
  }

  @ApiOperation({ summary: "회식 요청 상세 조회", description: "사장이 특정 회식 요청의 지역, 날짜, 시간, 인원, 예산, 요청사항을 확인합니다." })
  @ApiParam({ name: "id", example: "1", description: "사장이 확인할 회식 요청 id" })
  @ApiHeader({ name: "x-user-id", example: "2", description: "임시 로그인 사장 id" })
  @ApiHeader({ name: "x-user-role", example: "OWNER", description: "임시 역할" })
  @Get("owner/dining-requests/:id")
  findOpenByIdForOwner(@Headers() headers: Record<string, string | string[] | undefined>, @Param("id") id: string) {
    return this.diningRequestsService.findOpenByIdForOwner(parseRequestUser(headers), id);
  }
}
