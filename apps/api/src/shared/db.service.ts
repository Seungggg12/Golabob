import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

const REQUIRED_SCHEMA_VERSION = "202607280001_initial_schema";

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

  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getPool().connect();

    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async init() {
    await this.query("SELECT 1");

    const tableResult = await this.query<{ table_name: string | null }>(
      "SELECT to_regclass('public.schema_migrations')::text AS table_name",
    );

    if (!tableResult.rows[0]?.table_name) {
      throw new Error(
        "DB 스키마가 초기화되지 않았습니다. `npm run migrate:api`를 먼저 실행해주세요.",
      );
    }

    const versionResult = await this.query<{ version: string }>(
      "SELECT version FROM schema_migrations WHERE version = $1",
      [REQUIRED_SCHEMA_VERSION],
    );

    if (!versionResult.rows[0]) {
      throw new Error(
        `필수 DB 스키마(${REQUIRED_SCHEMA_VERSION})가 없습니다. ` +
          "`npm run migrate:api`를 먼저 실행해주세요.",
      );
    }
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
