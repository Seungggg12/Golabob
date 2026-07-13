import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthUser } from "../auth/auth-user";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateReviewDto } from "./dto/create-review.dto";
import { UpdateReviewDto } from "./dto/update-review.dto";
import { ReviewsService } from "./reviews.service";

@ApiTags("Reviews")
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: "리뷰 등록", description: "방문 완료된 예약에 대해 리뷰를 작성합니다." })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: "리뷰 등록 완료" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("user")
  @Post("reviews")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user, dto);
  }

  @ApiOperation({ summary: "내 리뷰 목록 조회", description: "사용자가 본인이 작성한 리뷰 목록을 조회합니다." })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("user")
  @Get("reviews/me")
  findMine(@CurrentUser() user: AuthUser) {
    return this.reviewsService.findMine(user);
  }

  @ApiOperation({ summary: "식당 리뷰 목록 조회", description: "특정 식당에 작성된 리뷰 목록을 조회합니다." })
  @ApiParam({ name: "restaurantId", example: "식당 UUID", description: "식당 id" })
  @Get("restaurants/:restaurantId/reviews")
  findByRestaurant(@Param("restaurantId") restaurantId: string) {
    return this.reviewsService.findByRestaurant(restaurantId);
  }

  @ApiOperation({ summary: "내 리뷰 수정", description: "사용자가 본인이 작성한 리뷰를 수정합니다." })
  @ApiParam({ name: "id", example: "리뷰 UUID", description: "수정할 리뷰 id" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("user")
  @Patch("reviews/:id")
  updateMine(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.updateMine(user, id, dto);
  }

  @ApiOperation({ summary: "내 리뷰 삭제", description: "사용자가 본인이 작성한 리뷰를 삭제합니다." })
  @ApiParam({ name: "id", example: "리뷰 UUID", description: "삭제할 리뷰 id" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("user")
  @Delete("reviews/:id")
  removeMine(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.reviewsService.removeMine(user, id);
  }
}
