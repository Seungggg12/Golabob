import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "./auth-user";

export class SignupTermAgreementsDto {
  @ApiProperty({ example: true, description: "서비스 이용약관 동의(필수)" })
  serviceTerms?: boolean;

  @ApiProperty({ example: true, description: "개인정보 수집 및 이용 동의(필수)" })
  privacyPolicy?: boolean;

  @ApiPropertyOptional({ example: false, description: "마케팅 정보 수신 동의(선택)" })
  marketingConsent?: boolean;
}

export class SignupDto {
  @ApiProperty({ example: "홍길동", description: "회원 이름" })
  name?: string;

  @ApiProperty({
    example: "user@example.com",
    description: "로그인에 사용할 이메일",
  })
  email?: string;

  @ApiProperty({
    example: "password1234",
    description: "로그인에 사용할 비밀번호",
  })
  password?: string;

  @ApiProperty({
    example: "010-1234-5678",
    description: "본인 연락처. 서버에서 +82 E.164 형식으로 정규화합니다.",
  })
  phone?: string;

  @ApiProperty({ type: SignupTermAgreementsDto })
  agreements?: SignupTermAgreementsDto;
}

export class LoginDto {
  @ApiProperty({
    example: "user@example.com",
    description: "가입한 이메일",
  })
  email?: string;

  @ApiProperty({
    example: "password1234",
    description: "가입한 비밀번호",
  })
  password?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "홍길동", description: "변경할 회원 이름" })
  name?: string;

  @ApiPropertyOptional({ example: "user@example.com", description: "변경할 로그인 이메일" })
  email?: string;

  @ApiPropertyOptional({
    example: "010-1234-5678",
    description: "변경할 휴대전화 번호. 서버에서 +82 E.164 형식으로 정규화합니다.",
  })
  phone?: string;
}

export class PublicUserDto {
  @ApiProperty({ example: "7b3e9f6f-d630-42d8-a5c0-8d21fae3dd2e" })
  id!: string;

  @ApiProperty({ example: "홍길동" })
  name!: string;

  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ example: "+821012345678" })
  phone!: string;

  @ApiProperty({ example: "u***@example.com" })
  maskedEmail!: string;

  @ApiProperty({ example: "+8210****5678" })
  maskedPhone!: string;

  @ApiProperty({ enum: ["active", "suspended", "withdrawn"], example: "active" })
  status!: string;

  @ApiProperty({ example: false })
  emailVerified!: boolean;

  @ApiProperty({ example: false })
  phoneVerified!: boolean;

  @ApiProperty({ enum: ["user", "owner", "admin"], example: "user" })
  role!: UserRole;

  @ApiProperty({
    enum: ["user", "owner", "admin"],
    isArray: true,
    example: ["user", "owner"],
  })
  roles!: UserRole[];
}

export class AuthResponseDto {
  @ApiProperty({ type: PublicUserDto })
  user!: PublicUserDto;

  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  accessToken!: string;
}

export class MeResponseDto {
  @ApiProperty({ type: PublicUserDto })
  user!: PublicUserDto;
}
