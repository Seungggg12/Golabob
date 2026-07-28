import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DbService } from "../shared/db.service";
import { RestaurantsController } from "./restaurants.controller";
import { RestaurantsService } from "./restaurants.service";

@Module({
  imports: [AuthModule],
  controllers: [RestaurantsController],
  providers: [RestaurantsService, DbService],
})
export class RestaurantsModule {}
