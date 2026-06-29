import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool, QueryResult, QueryResultRow } from "pg";

@Injectable()
export class DbService implements OnModuleDestroy {
  private pool?: Pool;

  private getPool() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL 환경 변수가 필요합니다.");
    }

    if (!this.pool) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
    }

    return this.pool;
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.getPool().query<T>(text, params);
  }

  async init() {
    await this.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('guest', 'owner', 'admin')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
