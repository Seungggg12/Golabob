import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from "@nestjs/swagger";

class HealthResponseDto {
  @ApiProperty({ example: "ok" })
  status!: string;

  @ApiProperty({ example: "Golabob API가 정상적으로 동작 중입니다." })
  message!: string;
}

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @ApiOperation({ summary: "서버 상태 확인" })
  @ApiOkResponse({ type: HealthResponseDto })
  @Get()
  getHealth() {
    return {
      status: "ok",
      message: "Golabob API가 정상적으로 동작 중입니다.",
    };
  }
}
