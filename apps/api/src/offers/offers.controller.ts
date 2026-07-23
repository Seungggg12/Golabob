import { Body, Controller, Get, Headers, Param, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateOfferDto } from "./dto/create-offer.dto";
import { OffersService } from "./offers.service";
import { parseRequestUser } from "./request-user";

@ApiTags("Offers")
@ApiBearerAuth()
@Controller()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  private static readonly authHeader = {
    name: "access-token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "로그인/회원가입 응답의 accessToken",
  };

  @ApiOperation({
    summary: "오퍼 작성",
    description: "사장이 특정 회식 요청에 가격, 메뉴 구성, 혜택, 좌석 정보, 가능 시간, 사장 메시지를 입력해 맞춤 오퍼를 제안합니다.",
  })
  @ApiParam({ name: "requestId", example: "1", description: "오퍼를 보낼 회식 요청 id" })
  @ApiHeader(OffersController.authHeader)
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
  @ApiHeader(OffersController.authHeader)
  @Get("owner/offers")
  findOwnerOffers(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Query("restaurantId") restaurantId?: string,
  ) {
    return this.offersService.findOwnerOffers(parseRequestUser(headers), restaurantId);
  }

  @ApiOperation({
    summary: "오퍼 작성용 내 식당 목록 조회",
    description: "로그인한 사장이 오퍼를 보낼 식당을 이름으로 선택할 수 있도록 본인 식당 목록을 조회합니다.",
  })
  @ApiHeader(OffersController.authHeader)
  @Get("owner/offers/restaurants")
  findOwnerRestaurants(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.offersService.findOwnerRestaurants(parseRequestUser(headers));
  }

  @ApiOperation({ summary: "보낸 오퍼 상세 조회", description: "사장이 본인이 보낸 특정 오퍼의 상세 내용을 확인합니다." })
  @ApiParam({ name: "id", example: "1", description: "조회할 오퍼 id" })
  @ApiHeader(OffersController.authHeader)
  @Get("owner/offers/:id")
  findOwnerOfferById(@Headers() headers: Record<string, string | string[] | undefined>, @Param("id") id: string) {
    return this.offersService.findOwnerOfferById(parseRequestUser(headers), id);
  }

  @ApiOperation({
    summary: "오퍼 목록 조회",
    description: "사용자가 본인의 회식 요청에 들어온 식당 오퍼 목록을 조회합니다.",
  })
  @ApiParam({ name: "requestId", example: "1", description: "오퍼 목록을 확인할 내 회식 요청 id" })
  @ApiHeader(OffersController.authHeader)
  @Get("dining-requests/:requestId/offers")
  findOffersForMyDiningRequest(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("requestId") requestId: string,
  ) {
    return this.offersService.findOffersForMyDiningRequest(parseRequestUser(headers), requestId);
  }

  @ApiOperation({
    summary: "오퍼 선택 및 예약 확정",
    description: "사용자가 본인의 열린 회식 요청에 도착한 오퍼를 선택하고 예약을 확정합니다.",
  })
  @ApiParam({ name: "requestId", example: "1", description: "내 회식 요청 id" })
  @ApiParam({ name: "offerId", example: "1", description: "선택할 오퍼 id" })
  @ApiHeader(OffersController.authHeader)
  @ApiResponse({ status: 201, description: "오퍼 선택 및 예약 확정 완료" })
  @Post("dining-requests/:requestId/offers/:offerId/select")
  selectOffer(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("requestId") requestId: string,
    @Param("offerId") offerId: string,
  ) {
    return this.offersService.selectOffer(
      parseRequestUser(headers),
      requestId,
      offerId,
    );
  }
}
