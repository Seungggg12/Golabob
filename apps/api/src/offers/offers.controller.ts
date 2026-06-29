import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateOfferDto } from "./dto/create-offer.dto";
import { OffersService } from "./offers.service";
import { parseRequestUser } from "./request-user";

@ApiTags("Offers")
@Controller()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @ApiOperation({
    summary: "오퍼 작성",
    description: "사장이 특정 회식 요청에 가격, 메뉴 구성, 혜택, 좌석 정보, 가능 시간, 사장 메시지를 입력해 맞춤 오퍼를 제안합니다.",
  })
  @ApiParam({ name: "requestId", example: "1", description: "오퍼를 보낼 회식 요청 id" })
  @ApiHeader({ name: "x-user-id", example: "2", description: "임시 로그인 사장 id" })
  @ApiHeader({ name: "x-user-role", example: "OWNER", description: "임시 역할" })
  @ApiResponse({ status: 201, description: "오퍼 작성 성공" })
  @Post("dining-requests/:requestId/offers")
  create(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("requestId") requestId: string,
    @Body() dto: CreateOfferDto,
  ) {
    return this.offersService.create(parseRequestUser(headers), requestId, dto);
  }

  @ApiOperation({
    summary: "오퍼 상태 조회",
    description: "사장이 보낸 오퍼 목록과 선택 여부를 확인합니다. restaurantId를 넘기면 특정 식당의 오퍼만 조회합니다.",
  })
  @ApiQuery({ name: "restaurantId", required: false, example: "1", description: "특정 식당 id" })
  @ApiHeader({ name: "x-user-id", example: "2", description: "임시 로그인 사장 id" })
  @ApiHeader({ name: "x-user-role", example: "OWNER", description: "임시 역할" })
  @Get("owner/offers")
  findOwnerOffers(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query("restaurantId") restaurantId?: string,
  ) {
    return this.offersService.findOwnerOffers(parseRequestUser(headers), restaurantId);
  }

  @ApiOperation({ summary: "보낸 오퍼 상세 조회", description: "사장이 본인이 보낸 특정 오퍼의 상세 내용을 확인합니다." })
  @ApiParam({ name: "id", example: "1", description: "조회할 오퍼 id" })
  @ApiHeader({ name: "x-user-id", example: "2", description: "임시 로그인 사장 id" })
  @ApiHeader({ name: "x-user-role", example: "OWNER", description: "임시 역할" })
  @Get("owner/offers/:id")
  findOwnerOfferById(@Headers() headers: Record<string, string | string[] | undefined>, @Param("id") id: string) {
    return this.offersService.findOwnerOfferById(parseRequestUser(headers), id);
  }

  @ApiOperation({
    summary: "오퍼 목록 조회",
    description: "사용자가 본인의 회식 요청에 들어온 식당 오퍼 목록을 조회합니다.",
  })
  @ApiParam({ name: "requestId", example: "1", description: "오퍼 목록을 확인할 내 회식 요청 id" })
  @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
  @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
  @Get("dining-requests/:requestId/offers")
  findOffersForMyDiningRequest(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("requestId") requestId: string,
  ) {
    return this.offersService.findOffersForMyDiningRequest(parseRequestUser(headers), requestId);
  }
}
