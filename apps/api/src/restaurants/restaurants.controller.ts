import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import {
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";
import { RestaurantsService } from "./restaurants.service";

interface RequestHeaders {
  [key: string]:
    | string
    | string[]
    | undefined;
}

function parseRequestUser(
  headers: RequestHeaders,
) {
  const idHeader =
    headers["x-user-id"];

  const roleHeader =
    headers["x-user-role"];

  const id = Array.isArray(idHeader)
    ? idHeader[0]
    : idHeader;

  const role = Array.isArray(roleHeader)
    ? roleHeader[0]
    : roleHeader;

  return {
    id: id || "1",
    role: role || "USER",
  };
}

@ApiTags("Restaurants")
@Controller()
export class RestaurantsController {
  constructor(
    private readonly restaurantsService: RestaurantsService,
  ) {}

  @ApiOperation({
    summary: "식당 등록",
    description:
      "사장이 식당 정보를 등록합니다.",
  })
  @ApiHeader({
    name: "x-user-id",
    example: "1",
    description: "임시 로그인 사장 id",
  })
  @ApiHeader({
    name: "x-user-role",
    example: "OWNER",
    description: "임시 역할",
  })
  @ApiResponse({
    status: 201,
    description: "식당 등록 완료",
  })
  @Post("owner/restaurants")
  create(
    @Req() request: Request,
  ) {
    const dto =
      request.body as CreateRestaurantDto;

    console.log(
      "식당 등록 body:",
      dto,
    );

    return this.restaurantsService.create(
      parseRequestUser(
        request.headers as RequestHeaders,
      ),
      dto,
    );
  }

  @ApiOperation({
    summary: "식당 목록 조회",
    description:
      "사용자가 예약 가능한 식당 목록을 조회합니다.",
  })
  @Get("restaurants")
  findAll() {
    return this.restaurantsService.findAll();
  }

  @ApiOperation({
    summary: "식당 상세 조회",
    description:
      "사용자가 특정 식당 상세 정보를 조회합니다.",
  })
  @ApiParam({
    name: "id",
    example: "식당 UUID",
    description: "조회할 식당 id",
  })
  @Get("restaurants/:id")
  findOne(
    @Param("id") id: string,
  ) {
    return this.restaurantsService.findOne(
      id,
    );
  }

  @ApiOperation({
    summary: "내 식당 목록 조회",
    description:
      "사장이 본인이 등록한 식당 목록을 조회합니다.",
  })
  @ApiHeader({
    name: "x-user-id",
    example: "1",
    description: "임시 로그인 사장 id",
  })
  @ApiHeader({
    name: "x-user-role",
    example: "OWNER",
    description: "임시 역할",
  })
  @Get("owner/restaurants")
  findMine(
    @Headers()
    headers: RequestHeaders,
  ) {
    return this.restaurantsService.findMine(
      parseRequestUser(headers),
    );
  }

  @ApiOperation({
    summary: "내 식당 수정",
    description:
      "사장이 본인이 등록한 식당 정보를 수정합니다.",
  })
  @ApiHeader({
    name: "x-user-id",
    example: "1",
    description: "임시 로그인 사장 id",
  })
  @ApiHeader({
    name: "x-user-role",
    example: "OWNER",
    description: "임시 역할",
  })
  @ApiParam({
    name: "id",
    example: "식당 UUID",
    description: "수정할 식당 id",
  })
  @Patch("owner/restaurants/:id")
  updateMine(
    @Req() request: Request,
    @Param("id") id: string,
  ) {
    const dto =
      request.body as UpdateRestaurantDto;

    return this.restaurantsService.updateMine(
      parseRequestUser(
        request.headers as RequestHeaders,
      ),
      id,
      dto,
    );
  }

  @ApiOperation({
    summary: "내 식당 삭제",
    description:
      "사장이 본인이 등록한 식당을 삭제합니다.",
  })
  @ApiHeader({
    name: "x-user-id",
    example: "1",
    description: "임시 로그인 사장 id",
  })
  @ApiHeader({
    name: "x-user-role",
    example: "OWNER",
    description: "임시 역할",
  })
  @ApiParam({
    name: "id",
    example: "식당 UUID",
    description: "삭제할 식당 id",
  })
  @ApiResponse({
    status: 200,
    description: "식당 삭제 완료",
  })
  @Delete("owner/restaurants/:id")
  removeMine(
    @Headers()
    headers: RequestHeaders,
    @Param("id") id: string,
  ) {
    return this.restaurantsService.removeMine(
      parseRequestUser(headers),
      id,
    );
  }
}