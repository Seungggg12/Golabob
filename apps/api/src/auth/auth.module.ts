import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { DbService } from "../shared/db.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtTokenService } from "./jwt-token.service";
import { RolesGuard } from "./roles.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthService, DbService, JwtTokenService, JwtAuthGuard, RolesGuard],
  exports: [JwtTokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
