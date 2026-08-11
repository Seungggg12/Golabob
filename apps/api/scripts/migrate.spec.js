const assert = require("node:assert/strict");
const test = require("node:test");
const {
  calculateMigrationChecksum,
  normalizeMigrationSql,
} = require("./migrate");

test("마이그레이션 SQL 줄바꿈을 LF로 정규화한다", () => {
  assert.equal(normalizeMigrationSql("SELECT 1;\r\nSELECT 2;\r"), "SELECT 1;\nSELECT 2;\n");
});

test("LF와 CRLF SQL은 같은 체크섬을 생성한다", () => {
  const lfSql = "CREATE TABLE users (\n  id UUID PRIMARY KEY\n);\n";
  const crlfSql = lfSql.replace(/\n/g, "\r\n");

  assert.equal(calculateMigrationChecksum(crlfSql), calculateMigrationChecksum(lfSql));
});

test("SQL 내용 변경은 다른 체크섬을 생성한다", () => {
  assert.notEqual(
    calculateMigrationChecksum("SELECT 1;\n"),
    calculateMigrationChecksum("SELECT 2;\n"),
  );
});
