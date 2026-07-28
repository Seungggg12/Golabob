import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DbService } from "../shared/db.service";
import { ReviewsController } from "./reviews.controller";
import { ReviewsService } from "./reviews.service";

@Module({
  imports: [AuthModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, DbService],
})
export class ReviewsModule {}
