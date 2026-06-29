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

    await this.query(`
      CREATE TABLE IF NOT EXISTS dining_requests (
        id UUID PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        dining_date DATE NOT NULL,
        dining_time TIME NOT NULL,
        head_count INTEGER NOT NULL CHECK (head_count >= 2),
        region TEXT NOT NULL,
        budget_per_person INTEGER NOT NULL CHECK (budget_per_person > 0),
        preferred_menu TEXT,
        required_options TEXT,
        memo TEXT,
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reserved', 'canceled', 'expired')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await this.query(`
      CREATE INDEX IF NOT EXISTS idx_dining_requests_user_id
      ON dining_requests(user_id)
    `);

    await this.query(`
      CREATE INDEX IF NOT EXISTS idx_dining_requests_status_date
      ON dining_requests(status, dining_date, dining_time)
    `);

    await this.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id UUID PRIMARY KEY,
        dining_request_id UUID NOT NULL REFERENCES dining_requests(id) ON DELETE CASCADE,
        restaurant_id TEXT NOT NULL,
        price_per_person INTEGER NOT NULL CHECK (price_per_person > 0),
        menu_description TEXT NOT NULL,
        service_description TEXT,
        seat_description TEXT,
        available_time TIME NOT NULL,
        owner_comment TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected', 'expired', 'canceled')),
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_offers_request_restaurant UNIQUE (dining_request_id, restaurant_id)
      )
    `);

    await this.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_dining_request_id
      ON offers(dining_request_id)
    `);

    await this.query(`
      CREATE INDEX IF NOT EXISTS idx_offers_restaurant_id
      ON offers(restaurant_id)
    `);
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
