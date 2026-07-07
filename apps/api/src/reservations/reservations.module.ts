import { Module } from "@nestjs/common";
import { DbService } from "../shared/db.service";
import { ReservationsController } from "./reservations.controller";
import { ReservationsService } from "./reservations.service";

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService, DbService],
})
export class ReservationsModule {}