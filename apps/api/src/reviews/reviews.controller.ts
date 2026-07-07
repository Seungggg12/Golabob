import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    Param,
    Patch,
    Post,
  } from "@nestjs/common";
  import {
    ApiHeader,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
  } from "@nestjs/swagger";
  import { CreateReviewDto } from "./dto/create-review.dto";
  import { UpdateReviewDto } from "./dto/update-review.dto";
  import { ReviewsService } from "./reviews.service";
  
  function parseRequestUser(headers: Record<string, string | string[] | undefined>) {
    const id = Array.isArray(headers["x-user-id"])
      ? headers["x-user-id"][0]
      : headers["x-user-id"];
  
    const role = Array.isArray(headers["x-user-role"])
      ? headers["x-user-role"][0]
      : headers["x-user-role"];
  
    return {
      id: id || "1",
      role: role || "USER",
    };
  }
  
  @ApiTags("Reviews")
  @Controller()
  export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}
  
    @ApiOperation({ summary: "리뷰 등록", description: "방문 완료된 예약에 대해 리뷰를 작성합니다." })
    @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
    @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
    @ApiResponse({ status: 201, description: "리뷰 등록 완료" })
    @Post("reviews")
    create(
      @Headers() headers: Record<string, string | string[] | undefined>,
      @Body() dto: CreateReviewDto,
    ) {
      return this.reviewsService.create(parseRequestUser(headers), dto);
    }
  
    @ApiOperation({ summary: "내 리뷰 목록 조회", description: "사용자가 본인이 작성한 리뷰 목록을 조회합니다." })
    @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
    @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
    @Get("reviews/me")
    findMine(@Headers() headers: Record<string, string | string[] | undefined>) {
      return this.reviewsService.findMine(parseRequestUser(headers));
    }
  
    @ApiOperation({ summary: "식당 리뷰 목록 조회", description: "특정 식당에 작성된 리뷰 목록을 조회합니다." })
    @ApiParam({ name: "restaurantId", example: "식당 UUID", description: "식당 id" })
    @Get("restaurants/:restaurantId/reviews")
    findByRestaurant(@Param("restaurantId") restaurantId: string) {
      return this.reviewsService.findByRestaurant(restaurantId);
    }
  
    @ApiOperation({ summary: "내 리뷰 수정", description: "사용자가 본인이 작성한 리뷰를 수정합니다." })
    @ApiParam({ name: "id", example: "리뷰 UUID", description: "수정할 리뷰 id" })
    @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
    @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
    @Patch("reviews/:id")
    updateMine(
      @Headers() headers: Record<string, string | string[] | undefined>,
      @Param("id") id: string,
      @Body() dto: UpdateReviewDto,
    ) {
      return this.reviewsService.updateMine(parseRequestUser(headers), id, dto);
    }
  
    @ApiOperation({ summary: "내 리뷰 삭제", description: "사용자가 본인이 작성한 리뷰를 삭제합니다." })
    @ApiParam({ name: "id", example: "리뷰 UUID", description: "삭제할 리뷰 id" })
    @ApiHeader({ name: "x-user-id", example: "1", description: "임시 로그인 사용자 id" })
    @ApiHeader({ name: "x-user-role", example: "USER", description: "임시 역할" })
    @Delete("reviews/:id")
    removeMine(
      @Headers() headers: Record<string, string | string[] | undefined>,
      @Param("id") id: string,
    ) {
      return this.reviewsService.removeMine(parseRequestUser(headers), id);
    }
  }