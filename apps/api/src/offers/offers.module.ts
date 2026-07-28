import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DbService } from "../shared/db.service";
import { OffersController } from "./offers.controller";
import { OffersService } from "./offers.service";

@Module({
  imports: [AuthModule],
  controllers: [OffersController],
  providers: [OffersService, DbService],
})
export class OffersModule {}
