import { join } from 'node:path';

import Database from 'better-sqlite3';

import { SCHEMA } from './schema';

/**
 * Single SQLite connection, memoized on `globalThis` so Next's dev HMR (which
 * re-evaluates modules) reuses one handle instead of opening a new file lock
 * per reload. The schema is applied on first open (idempotent `IF NOT EXISTS`).
 */

const DB_PATH = process.env.DB_PATH ?? join(process.cwd(), 'shop.db');

declare global {
  // eslint-disable-next-line no-var
  var __shopDb: Database.Database | undefined;
}

function open(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  return db;
}

export function getDb(): Database.Database {
  if (!globalThis.__shopDb) globalThis.__shopDb = open();
  return globalThis.__shopDb;
}
