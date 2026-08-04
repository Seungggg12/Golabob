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
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: UserRole;
  roles: UserRole[];
  status: AccountStatus;
  email_verified_at: Date | null;
  phone_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  roles: UserRole[];
  status: AccountStatus;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type AccountStatus = "active" | "suspended" | "withdrawn";

interface ActiveTermRow {
  id: string;
  code: string;
  is_required: boolean;
}

const SIGNUP_TERM_CODES = [
  "service_terms",
  "privacy_policy",
  "marketing_consent",
] as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly dbService: DbService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  async signup(body: SignupDto) {
    const name = this.normalizeName(body.name);
    const email = this.normalizeEmail(body.email);
    const phone = this.normalizePhone(body.phone);
    const password = body.password;

    this.validateSignup(name, email, phone, password, body.agreements);

    const conflict = await this.findSignupConflict(email, phone);
    if (conflict === "email") {
      throw new ConflictException("이미 가입된 이메일입니다.");
    }
    if (conflict === "phone") {
      throw new ConflictException("이미 가입된 전화번호입니다.");
    }

    const passwordHash = await bcrypt.hash(password!, 10);

    try {
      const user = await this.createUser(
        name,
        email,
        phone,
        passwordHash,
        body.agreements!,
      );

      return {
        user: this.toPublicUser(user),
        accessToken: this.jwtTokenService.createAccessToken(user),
      };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("이미 가입된 이메일 또는 전화번호입니다.");
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

    if (user.status !== "active") {
      throw new UnauthorizedException("사용할 수 없는 계정입니다.");
    }

    return {
      user: this.toPublicUser(user),
      accessToken: this.jwtTokenService.createAccessToken(user),
    };
  }

  async me(userId: string) {
    const user = await this.findUserById(userId);

    if (!user || user.status !== "active") {
      throw new UnauthorizedException("유효하지 않은 인증 정보입니다.");
    }

    return {
      user: this.toPublicUser(user),
    };
  }

  private normalizeEmail(email?: string) {
    return email?.trim().toLowerCase() || "";
  }

  private normalizeName(name?: string) {
    return name?.trim().replace(/\s+/g, " ") || "";
  }

  private normalizePhone(phone?: string) {
    const compact = phone?.trim().replace(/[\s()-]/g, "") || "";

    if (/^010\d{8}$/.test(compact)) {
      return `+82${compact.slice(1)}`;
    }

    return /^\+8210\d{8}$/.test(compact) ? compact : "";
  }

  private validateSignup(
    name: string,
    email: string,
    phone: string,
    password?: string,
    agreements?: SignupDto["agreements"],
  ) {
    if (name.length < 2 || name.length > 50) {
      throw new BadRequestException("이름은 2자 이상 50자 이하로 입력해주세요.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException("올바른 이메일 형식을 입력해주세요.");
    }

    if (!phone) {
      throw new BadRequestException("올바른 휴대전화 번호를 입력해주세요.");
    }

    if (!password || password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      throw new BadRequestException("비밀번호는 8자 이상 72바이트 이하로 입력해주세요.");
    }

    if (!agreements?.serviceTerms || !agreements.privacyPolicy) {
      throw new BadRequestException("필수 약관에 동의해주세요.");
    }
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

  private async findSignupConflict(email: string, phone: string) {
    const result = await this.dbService.query<{ email: string; phone: string }>(
      `SELECT email, phone
       FROM users
       WHERE LOWER(email) = LOWER($1) OR phone = $2
       LIMIT 1`,
      [email, phone],
    );
    const existing = result.rows[0];

    if (!existing) {
      return null;
    }

    return existing.email.toLowerCase() === email ? "email" : "phone";
  }

  private async createUser(
    name: string,
    email: string,
    phone: string,
    passwordHash: string,
    agreements: NonNullable<SignupDto["agreements"]>,
  ) {
    return this.dbService.transaction(async (client) => {
      const termsResult = await client.query<ActiveTermRow>(
        `SELECT id, code, is_required
         FROM terms
         WHERE is_active = TRUE AND code = ANY($1::text[])
         ORDER BY code
         FOR SHARE`,
        [SIGNUP_TERM_CODES],
      );
      const termsByCode = new Map(termsResult.rows.map((term) => [term.code, term]));

      if (SIGNUP_TERM_CODES.some((code) => !termsByCode.has(code))) {
        throw new Error("회원가입 약관 설정이 올바르지 않습니다.");
      }

      const decisions = new Map<string, boolean>([
        ["service_terms", agreements.serviceTerms === true],
        ["privacy_policy", agreements.privacyPolicy === true],
        ["marketing_consent", agreements.marketingConsent === true],
      ]);

      for (const term of termsResult.rows) {
        if (term.is_required && !decisions.get(term.code)) {
          throw new BadRequestException("필수 약관에 동의해주세요.");
        }
      }

      const userId = randomUUID();
      const userResult = await client.query<UserRow>(
        `INSERT INTO users (id, name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, 'user')
         RETURNING
           id, name, email, phone, password_hash, role, status,
           email_verified_at, phone_verified_at, created_at, updated_at`,
        [userId, name, email, phone, passwordHash],
      );

      await client.query(
        "INSERT INTO user_roles (user_id, role) VALUES ($1, 'user')",
        [userId],
      );

      const orderedTerms = SIGNUP_TERM_CODES.map((code) => termsByCode.get(code)!);
      await client.query(
        `INSERT INTO user_term_agreements (user_id, term_id, agreed, agreed_at)
         SELECT $1, agreement.term_id, agreement.agreed,
                CASE WHEN agreement.agreed THEN NOW() ELSE NULL END
         FROM UNNEST($2::bigint[], $3::boolean[]) AS agreement(term_id, agreed)`,
        [
          userId,
          orderedTerms.map((term) => term.id),
          orderedTerms.map((term) => decisions.get(term.code) === true),
        ],
      );

      return this.mapUser({ ...userResult.rows[0], roles: ["user"] });
    });
  }

  private mapUser(row: UserRow): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      passwordHash: row.password_hash,
      role: row.role,
      roles: row.roles,
      status: row.status,
      emailVerifiedAt: row.email_verified_at,
      phoneVerifiedAt: row.phone_verified_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      emailVerified: Boolean(user.emailVerifiedAt),
      phoneVerified: Boolean(user.phoneVerifiedAt),
      role: user.role,
      roles: user.roles,
    };
  }

  private userSelectSql() {
    return `SELECT
              u.id,
              u.name,
              u.email,
              u.phone,
              u.password_hash,
              u.role,
              u.status,
              u.email_verified_at,
              u.phone_verified_at,
              u.created_at,
              u.updated_at,
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
