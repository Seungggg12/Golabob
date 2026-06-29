import { Module } from "@nestjs/common";
import { DbService } from "../shared/db.service";
import { DiningRequestsController } from "./dining-requests.controller";
import { DiningRequestsService } from "./dining-requests.service";

@Module({
  controllers: [DiningRequestsController],
  providers: [DiningRequestsService, DbService],
})
export class DiningRequestsModule {}
