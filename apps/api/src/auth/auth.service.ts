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
  roles: UserRole[];
  created_at: Date;
}

interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  roles: UserRole[];
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
      `${this.userSelectSql()}
       WHERE u.email = $1`,
      [email],
    );

    return result.rows[0] ? this.mapUser(result.rows[0]) : null;
  }

  private async findUserById(id: string) {
    const result = await this.dbService.query<UserRow>(
      `${this.userSelectSql()}
       WHERE u.id = $1`,
      [id],
    );

    return result.rows[0] ? this.mapUser(result.rows[0]) : null;
  }

  private async createUser(email: string, passwordHash: string, role: UserRole) {
    const roles: UserRole[] = role === "owner" ? ["user", "owner"] : [role];
    const result = await this.dbService.query<UserRow>(
      `WITH new_user AS (
         INSERT INTO users (id, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, password_hash, role, created_at
       ), new_roles AS (
         INSERT INTO user_roles (user_id, role)
         SELECT new_user.id, requested_role
         FROM new_user
         CROSS JOIN UNNEST($5::text[]) AS requested_role
       )
       SELECT new_user.*, $5::text[] AS roles
       FROM new_user`,
      [randomUUID(), email, passwordHash, role, roles],
    );

    return this.mapUser(result.rows[0]);
  }

  private mapUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      roles: row.roles,
      createdAt: row.created_at,
    };
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles,
    };
  }

  private userSelectSql() {
    return `SELECT
              u.id,
              u.email,
              u.password_hash,
              u.role,
              u.created_at,
              COALESCE(
                (
                  SELECT ARRAY_AGG(ur.role ORDER BY
                    CASE ur.role WHEN 'user' THEN 1 WHEN 'owner' THEN 2 ELSE 3 END
                  )
                  FROM user_roles ur
                  WHERE ur.user_id = u.id
                ),
                ARRAY[u.role]
              ) AS roles
            FROM users u`;
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
