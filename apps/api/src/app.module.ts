import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { DiningRequestsModule } from "./dining-requests/dining-requests.module";
import { HealthController } from "./health/health.controller";
import { OffersModule } from "./offers/offers.module";
import { DbService } from "./shared/db.service";

@Module({
  imports: [AuthModule, DiningRequestsModule, OffersModule],
  controllers: [HealthController],
  providers: [DbService],
  exports: [DbService],
})
export class AppModule {}
