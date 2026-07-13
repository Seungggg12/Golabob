import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DbService } from "../shared/db.service";
import { DiningRequestsController } from "./dining-requests.controller";
import { DiningRequestsService } from "./dining-requests.service";

@Module({
  imports: [AuthModule],
  controllers: [DiningRequestsController],
  providers: [DiningRequestsService, DbService],
})
export class DiningRequestsModule {}
