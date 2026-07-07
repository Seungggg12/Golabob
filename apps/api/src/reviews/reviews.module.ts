import { Module } from "@nestjs/common";
import { DbService } from "../shared/db.service";
import { ReviewsController } from "./reviews.controller";
import { ReviewsService } from "./reviews.service";

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, DbService],
})
export class ReviewsModule {}