import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { DbService } from "../shared/db.service";
import { UserRole } from "./auth-user";
import { LoginDto, SignupDto } from "./auth.dto";
import { JwtTokenService } from "./jwt-token.service";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

const PUBLIC_SIGNUP_ROLES = new Set(["user", "owner"]);

@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DbService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async signup(body: SignupDto) {
    const email = this.normalizeEmail(body.email);
    const password = body.password;
    const role = body.role || "user";

    if (!email || !password) {
      throw new BadRequestException("이메일과 비밀번호를 입력해주세요.");
    }

    if (!PUBLIC_SIGNUP_ROLES.has(role)) {
      throw new BadRequestException("가입할 수 없는 역할입니다.");
    }

    if (await this.findUserByEmail(email)) {
      throw new ConflictException("이미 가입된 이메일입니다.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const user = await this.createUser(email, passwordHash, role);

      return {
        user: this.toPublicUser(user),
        accessToken: this.jwtTokenService.createAccessToken(user),
      };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("이미 가입된 이메일입니다.");
      }

      throw error;
    }
  }

  async login(body: LoginDto) {
    const email = this.normalizeEmail(body.email);
    const password = body.password;

    if (!email || !password) {
      throw new BadRequestException("이메일과 비밀번호를 입력해주세요.");
    }

    const user = await this.findUserByEmail(email);

    if (!user) {
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    return {
      user: this.toPublicUser(user),
      accessToken: this.jwtTokenService.createAccessToken(user),
    };
  }

  async me(userId: string) {
    const user = await this.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException("유효하지 않은 인증 정보입니다.");
    }

    return {
      user: this.toPublicUser(user),
    };
  }

  private normalizeEmail(email?: string) {
    return email?.trim().toLowerCase() || "";
  }

  private async findUserByEmail(email: string) {
    const result = await this.dbService.query<UserRow>(
      "SELECT id, email, password_hash, role, created_at FROM users WHERE email = $1",
      [email],
    );

    return result.rows[0] ? this.mapUser(result.rows[0]) : null;
  }

  private async findUserById(id: string) {
    const result = await this.dbService.query<UserRow>(
      "SELECT id, email, password_hash, role, created_at FROM users WHERE id = $1",
      [id],
    );

    return result.rows[0] ? this.mapUser(result.rows[0]) : null;
  }

  private async createUser(email: string, passwordHash: string, role: UserRole) {
    const result = await this.dbService.query<UserRow>(
      `INSERT INTO users (id, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, password_hash, role, created_at`,
      [randomUUID(), email, passwordHash, role],
    );

    return this.mapUser(result.rows[0]);
  }

  private mapUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at,
    };
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    );
  }
}
