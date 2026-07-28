import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthUser } from "../auth/auth-user";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";
import { RestaurantsService } from "./restaurants.service";

@ApiTags("Restaurants")
@Controller()
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @ApiOperation({ summary: "식당 등록", description: "사장이 식당 정보를 등록합니다." })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: "식당 등록 완료" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("owner")
  @Post("owner/restaurants")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRestaurantDto) {
    return this.restaurantsService.create(user, dto);
  }

  @ApiOperation({ summary: "식당 목록 조회", description: "사용자가 예약 가능한 식당 목록을 조회합니다." })
  @Get("restaurants")
  findAll() {
    return this.restaurantsService.findAll();
  }

  @ApiOperation({ summary: "식당 상세 조회", description: "사용자가 특정 식당 상세 정보를 조회합니다." })
  @ApiParam({ name: "id", example: "식당 UUID", description: "조회할 식당 id" })
  @Get("restaurants/:id")
  findOne(@Param("id") id: string) {
    return this.restaurantsService.findOne(id);
  }

  @ApiOperation({ summary: "내 식당 목록 조회", description: "사장이 본인이 등록한 식당 목록을 조회합니다." })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("owner")
  @Get("owner/restaurants")
  findMine(@CurrentUser() user: AuthUser) {
    return this.restaurantsService.findMine(user);
  }

  @ApiOperation({ summary: "내 식당 수정", description: "사장이 본인이 등록한 식당 정보를 수정합니다." })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("owner")
  @Patch("owner/restaurants/:id")
  updateMine(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.updateMine(user, id, dto);
  }
}
