const { createHash } = require("node:crypto");
const { readFile, readdir } = require("node:fs/promises");
const path = require("node:path");
const { config } = require("dotenv");
const { Client } = require("pg");

const migrationsDirectory = path.resolve(__dirname, "../migrations/managed");
const migrationFilePattern = /^\d{12,}_[a-z0-9_]+\.sql$/;
const advisoryLockId = 748193523;

config({ path: path.resolve(__dirname, "../.env") });

function normalizeMigrationSql(sql) {
  return sql.replace(/\r\n?/g, "\n");
}

function calculateMigrationChecksum(sql) {
  return createHash("sha256").update(normalizeMigrationSql(sql)).digest("hex");
}

async function loadMigrations() {
  const fileNames = (await readdir(migrationsDirectory))
    .filter((fileName) => migrationFilePattern.test(fileName))
    .sort();

  if (fileNames.length === 0) {
    throw new Error("적용할 마이그레이션 파일이 없습니다.");
  }

  return Promise.all(
    fileNames.map(async (fileName) => {
      const sql = await readFile(path.join(migrationsDirectory, fileName), "utf8");

      return {
        version: fileName.replace(/\.sql$/, ""),
        fileName,
        sql,
        checksum: calculateMigrationChecksum(sql),
      };
    }),
  );
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function hasMigrationsTable(client) {
  const result = await client.query(
    "SELECT to_regclass('public.schema_migrations')::text AS table_name",
  );

  return Boolean(result.rows[0]?.table_name);
}

async function readAppliedMigrations(client) {
  const result = await client.query(
    "SELECT version, checksum, applied_at FROM schema_migrations ORDER BY version",
  );

  return new Map(result.rows.map((row) => [row.version, row]));
}

function assertNoDrift(migrations, appliedMigrations) {
  const localVersions = new Set(migrations.map((migration) => migration.version));

  for (const [version] of appliedMigrations) {
    if (!localVersions.has(version)) {
      throw new Error(`DB에만 존재하는 마이그레이션입니다: ${version}`);
    }
  }

  for (const migration of migrations) {
    const applied = appliedMigrations.get(migration.version);

    if (applied && applied.checksum !== migration.checksum) {
      throw new Error(`적용 후 변경된 마이그레이션입니다: ${migration.fileName}`);
    }
  }
}

function printStatus(migrations, appliedMigrations) {
  for (const migration of migrations) {
    const status = appliedMigrations.has(migration.version) ? "applied" : "pending";
    console.log(`${status.padEnd(7)} ${migration.version}`);
  }
}

async function applyMigration(client, migration) {
  await client.query("BEGIN");

  try {
    await client.query(migration.sql);
    await client.query(
      "INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)",
      [migration.version, migration.checksum],
    );
    await client.query("COMMIT");
    console.log(`applied ${migration.version}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL 환경 변수가 필요합니다.");
  }

  const migrations = await loadMigrations();
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [advisoryLockId]);

    if (process.argv.includes("--status")) {
      const appliedMigrations = (await hasMigrationsTable(client))
        ? await readAppliedMigrations(client)
        : new Map();

      assertNoDrift(migrations, appliedMigrations);
      printStatus(migrations, appliedMigrations);
      return;
    }

    await ensureMigrationsTable(client);
    const appliedMigrations = await readAppliedMigrations(client);
    assertNoDrift(migrations, appliedMigrations);

    for (const migration of migrations) {
      if (!appliedMigrations.has(migration.version)) {
        await applyMigration(client, migration);
      }
    }

    console.log("마이그레이션이 최신 상태입니다.");
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [advisoryLockId]);
    await client.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

module.exports = {
  calculateMigrationChecksum,
  normalizeMigrationSql,
};
