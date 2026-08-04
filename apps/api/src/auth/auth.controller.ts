import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthResponseDto, LoginDto, MeResponseDto, SignupDto } from "./auth.dto";
import { AuthUser } from "./auth-user";
import { CurrentUser } from "./current-user.decorator";
import { JwtAuthGuard } from "./jwt-auth.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "회원가입" })
  @ApiBody({ type: SignupDto })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ description: "회원 정보 형식 또는 필수 약관 동의가 올바르지 않습니다." })
  @ApiConflictResponse({ description: "이미 가입된 이메일 또는 전화번호입니다." })
  @Post("signup")
  signup(@Body() body: SignupDto) {
    return this.authService.signup(body);
  }

  @ApiOperation({ summary: "로그인" })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: "이메일 또는 비밀번호가 올바르지 않습니다." })
  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @ApiOperation({ summary: "내 정보 조회" })
  @ApiBearerAuth()
  @ApiOkResponse({ type: MeResponseDto })
  @ApiUnauthorizedResponse({ description: "인증이 필요합니다." })
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }
}
