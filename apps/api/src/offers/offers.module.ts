import { Module } from "@nestjs/common";
import { DbService } from "../shared/db.service";
import { OffersController } from "./offers.controller";
import { OffersService } from "./offers.service";

@Module({
  controllers: [OffersController],
  providers: [OffersService, DbService],
})
export class OffersModule {}
