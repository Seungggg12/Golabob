import { Module } from "@nestjs/common";
import { DbService } from "../shared/db.service";
import { RestaurantsController } from "./restaurants.controller";
import { RestaurantsService } from "./restaurants.service";

@Module({
  controllers: [RestaurantsController],
  providers: [RestaurantsService, DbService],
})
export class RestaurantsModule {}