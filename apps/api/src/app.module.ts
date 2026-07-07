import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { DiningRequestsModule } from "./dining-requests/dining-requests.module";
import { HealthController } from "./health/health.controller";
import { OffersModule } from "./offers/offers.module";
import { DbService } from "./shared/db.service";
import { RestaurantsModule } from "./restaurants/restaurants.module";
import { ReservationsModule } from "./reservations/reservations.module";
import { ReviewsModule } from "./reviews/reviews.module";

@Module({
  imports: [
    AuthModule,
    DiningRequestsModule,
    OffersModule,
    RestaurantsModule,
    ReservationsModule,
    ReviewsModule,
  ],
  controllers: [HealthController],
  providers: [DbService],
  exports: [DbService],
})
export class AppModule {}