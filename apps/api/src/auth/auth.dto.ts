import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type PublicRole = "guest" | "owner";
export type UserRole = PublicRole | "admin";

export class SignupDto {
  @ApiProperty({
    example: "guest@example.com",
    description: "로그인에 사용할 이메일",
  })
  email?: string;

  @ApiProperty({
    example: "password1234",
    description: "로그인에 사용할 비밀번호",
  })
  password?: string;

  @ApiPropertyOptional({
    enum: ["guest", "owner"],
    default: "guest",
    description: "가입 역할",
  })
  role?: PublicRole;
}

export class LoginDto {
  @ApiProperty({
    example: "guest@example.com",
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

  @ApiProperty({ example: "guest@example.com" })
  email!: string;

  @ApiProperty({ enum: ["guest", "owner", "admin"], example: "guest" })
  role!: UserRole;
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
