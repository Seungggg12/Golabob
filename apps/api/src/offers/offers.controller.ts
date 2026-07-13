import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "../auth/auth-user";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateOfferDto } from "./dto/create-offer.dto";
import { OffersService } from "./offers.service";

@ApiTags("Offers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @ApiOperation({
    summary: "오퍼 작성",
    description: "사장이 특정 회식 요청에 가격, 메뉴 구성, 혜택, 좌석 정보, 가능 시간, 사장 메시지를 입력해 맞춤 오퍼를 제안합니다.",
  })
  @ApiParam({ name: "requestId", example: "1", description: "오퍼를 보낼 회식 요청 id" })
  @ApiResponse({ status: 201, description: "오퍼 작성 성공" })
  @Roles("owner")
  @Post("dining-requests/:requestId/offers")
  create(
    @CurrentUser() user: AuthUser,
    @Param("requestId") requestId: string,
    @Body() dto: CreateOfferDto,
  ) {
    return this.offersService.create(user, requestId, dto);
  }

  @ApiOperation({
    summary: "오퍼 상태 조회",
    description: "사장이 보낸 오퍼 목록과 선택 여부를 확인합니다. restaurantId를 넘기면 특정 식당의 오퍼만 조회합니다.",
  })
  @ApiQuery({ name: "restaurantId", required: false, example: "1", description: "특정 식당 id" })
  @Roles("owner")
  @Get("owner/offers")
  findOwnerOffers(
    @CurrentUser() user: AuthUser,
    @Query("restaurantId") restaurantId?: string,
  ) {
    return this.offersService.findOwnerOffers(user, restaurantId);
  }

  @ApiOperation({ summary: "보낸 오퍼 상세 조회", description: "사장이 본인이 보낸 특정 오퍼의 상세 내용을 확인합니다." })
  @ApiParam({ name: "id", example: "1", description: "조회할 오퍼 id" })
  @Roles("owner")
  @Get("owner/offers/:id")
  findOwnerOfferById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.offersService.findOwnerOfferById(user, id);
  }

  @ApiOperation({
    summary: "오퍼 목록 조회",
    description: "사용자가 본인의 회식 요청에 들어온 식당 오퍼 목록을 조회합니다.",
  })
  @ApiParam({ name: "requestId", example: "1", description: "오퍼 목록을 확인할 내 회식 요청 id" })
  @Roles("user")
  @Get("dining-requests/:requestId/offers")
  findOffersForMyDiningRequest(
    @CurrentUser() user: AuthUser,
    @Param("requestId") requestId: string,
  ) {
    return this.offersService.findOffersForMyDiningRequest(user, requestId);
  }
}
