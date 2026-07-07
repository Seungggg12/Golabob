import { Body, Controller, Get, Headers, Param, Patch, Post } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";
import { RestaurantsService } from "./restaurants.service";

function parseRequestUser(headers: Record<string, string | string[] | undefined>) {
  const id = Array.isArray(headers["x-user-id"]) ? headers["x-user-id"][0] : headers["x-user-id"];
  const role = Array.isArray(headers["x-user-role"]) ? headers["x-user-role"][0] : headers["x-user-role"];

  return {
    id: id || "1",
    role: role || "USER",
  };
}

@ApiTags("Restaurants")
@Controller()
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @ApiOperation({ summary: "식당 등록", description: "사장이 식당 정보를 등록합니다." })
  @ApiHeader({ name: "x-user-id", example: "2", description: "임시 로그인 사장 id" })
  @ApiHeader({ name: "x-user-role", example: "OWNER", description: "임시 역할" })
  @ApiResponse({ status: 201, description: "식당 등록 완료" })
  @Post("owner/restaurants")
  create(@Headers() headers: Record<string, string | string[] | undefined>, @Body() dto: CreateRestaurantDto) {
    return this.restaurantsService.create(parseRequestUser(headers), dto);
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
  @ApiHeader({ name: "x-user-id", example: "2", description: "임시 로그인 사장 id" })
  @ApiHeader({ name: "x-user-role", example: "OWNER", description: "임시 역할" })
  @Get("owner/restaurants")
  findMine(@Headers() headers: Record<string, string | string[] | undefined>) {
    return this.restaurantsService.findMine(parseRequestUser(headers));
  }

  @ApiOperation({ summary: "내 식당 수정", description: "사장이 본인이 등록한 식당 정보를 수정합니다." })
  @ApiHeader({ name: "x-user-id", example: "2", description: "임시 로그인 사장 id" })
  @ApiHeader({ name: "x-user-role", example: "OWNER", description: "임시 역할" })
  @Patch("owner/restaurants/:id")
  updateMine(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param("id") id: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.updateMine(parseRequestUser(headers), id, dto);
  }

  
}