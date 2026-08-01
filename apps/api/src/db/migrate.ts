import { SQL } from 'bun';
import { getMigrations } from '#lib/assets.ts';
import { env } from '#lib/env.ts';
import { createLogger } from '#lib/logger.ts';

const MIGRATIONS_SCHEMA = 'api_migrations';
const MIGRATIONS_TABLE = `${MIGRATIONS_SCHEMA}.migrations`;
const MIGRATION_FILE_EXTENSION = '.sql';

const logger = createLogger('migrate');

// The runner owns its bookkeeping schema; migration files own the app schema, so
// the runner never has to assume anything about what a migration creates.
async function ensureMigrationsTable(sql: SQL): Promise<void> {
  await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS ${MIGRATIONS_SCHEMA}`);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      name       text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function appliedMigrations(sql: SQL): Promise<Set<string>> {
  const rows = (await sql.unsafe(`SELECT name FROM ${MIGRATIONS_TABLE}`)) as Array<{
    name: string;
  }>;
  return new Set(rows.map((row) => row.name));
}

async function applyMigration({
  sql,
  name,
  file,
}: {
  sql: SQL;
  name: string;
  file: Blob;
}): Promise<void> {
  const ddl = await file.text();

  await sql.begin(async (tx) => {
    await tx.unsafe(ddl);
    await tx.unsafe(`INSERT INTO ${MIGRATIONS_TABLE} (name) VALUES ($1)`, [name]);
  });

  logger.info(`applied: ${name}`);
}

async function applyPending(sql: SQL): Promise<void> {
  await ensureMigrationsTable(sql);
  const applied = await appliedMigrations(sql);

  for (const [name, file] of getMigrations()) {
    if (!name.endsWith(MIGRATION_FILE_EXTENSION) || applied.has(name)) {
      continue;
    }

    await applyMigration({ sql, name, file });
  }
}

// Runs on a dedicated client that is closed before the server's pool spins up,
// so no connection lingers for the process lifetime.
export async function runMigrations(): Promise<void> {
  const sql = new SQL(env.DATABASE_URL);
  try {
    await applyPending(sql);
  } finally {
    await sql.end();
  }
}
