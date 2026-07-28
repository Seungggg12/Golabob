import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "./auth-user";

export type PublicRole = "user" | "owner";

export class SignupDto {
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

  @ApiPropertyOptional({
    enum: ["user", "owner"],
    default: "user",
    description: "가입 역할",
  })
  role?: PublicRole;
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

export class PublicUserDto {
  @ApiProperty({ example: "7b3e9f6f-d630-42d8-a5c0-8d21fae3dd2e" })
  id!: string;

  @ApiProperty({ example: "user@example.com" })
  email!: string;

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
