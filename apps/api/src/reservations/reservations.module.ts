import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DbService } from "../shared/db.service";
import { ReservationsController } from "./reservations.controller";
import { ReservationsService } from "./reservations.service";

@Module({
  imports: [AuthModule],
  controllers: [ReservationsController],
  providers: [ReservationsService, DbService],
})
export class ReservationsModule {}
