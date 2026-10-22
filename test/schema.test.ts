import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = resolve(__dirname, "../supabase/migrations");

function loadMigrations() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  return files.map((name) => ({
    name,
    sql: readFileSync(resolve(MIGRATIONS_DIR, name), "utf8"),
  }));
}

function findTablesCreated(sql: string): string[] {
  const matches = sql.matchAll(/create table public\.(\w+)/gi);
  return [...matches].map((match) => match[1]);
}

function findRlsEnabledTables(sql: string): string[] {
  const matches = sql.matchAll(/alter table public\.(\w+) enable row level security/gi);
  return [...matches].map((match) => match[1]);
}

function findPoliciesByTable(sql: string): Map<string, number> {
  const counts = new Map<string, number>();
  const matches = sql.matchAll(/create policy\s+"[^"]+"\s+on public\.(\w+)/gi);
  for (const match of matches) {
    const table = match[1];
    counts.set(table, (counts.get(table) ?? 0) + 1);
  }
  return counts;
}

describe("supabase migrations", () => {
  const migrations = loadMigrations();

  it("has at least one migration file", () => {
    expect(migrations.length).toBeGreaterThan(0);
  });

  it("is named with a sortable timestamp prefix, in increasing order", () => {
    const names = migrations.map((m) => m.name);
    for (const name of names) {
      expect(name).toMatch(/^\d{14}_[a-z0-9_]+\.sql$/);
    }
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it("every created table has a primary key", () => {
    for (const { name, sql } of migrations) {
      for (const table of findTablesCreated(sql)) {
        // Look at the CREATE TABLE statement body only (up to the matching
        // top-level closing paren is overkill here; a simple proximity
        // check on the raw text is enough to catch a forgotten PK).
        const start = sql.indexOf(`create table public.${table}`);
        const snippet = sql.slice(start, start + 2000);
        const statementEnd = snippet.indexOf(");");
        const statement = statementEnd === -1 ? snippet : snippet.slice(0, statementEnd);
        expect(statement, `${table} in ${name} should declare a primary key`).toMatch(
          /primary key/i
        );
      }
    }
  });

  it("every created table has Row Level Security enabled (in the same migration)", () => {
    for (const { name, sql } of migrations) {
      const created = findTablesCreated(sql);
      const rlsEnabled = new Set(findRlsEnabledTables(sql));
      for (const table of created) {
        expect(rlsEnabled.has(table), `${table} created in ${name} has no RLS enable statement`).toBe(
          true
        );
      }
    }
  });

  it("every RLS-enabled table has at least one policy across all migrations", () => {
    const allSql = migrations.map((m) => m.sql).join("\n");
    const rlsEnabled = new Set(
      migrations.flatMap(({ sql }) => findRlsEnabledTables(sql))
    );
    const policyCounts = findPoliciesByTable(allSql);

    for (const table of rlsEnabled) {
      expect(policyCounts.get(table) ?? 0, `${table} has RLS enabled but no policies`).toBeGreaterThan(0);
    }
  });

  it("every public storage bucket created has at least one storage.objects policy referencing it", () => {
    const allSql = migrations.map((m) => m.sql).join("\n");
    const bucketMatches = allSql.matchAll(/insert into storage\.buckets[^;]*values\s*\('([\w-]+)'/gi);
    const buckets = [...new Set([...bucketMatches].map((match) => match[1]))];

    expect(buckets.length).toBeGreaterThan(0);

    for (const bucket of buckets) {
      const policyPattern = new RegExp(`bucket_id\\s*=\\s*'${bucket}'`, "i");
      expect(policyPattern.test(allSql), `bucket "${bucket}" has no storage.objects policy`).toBe(true);
    }
  });
});
