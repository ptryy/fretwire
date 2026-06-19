/** SQLite schema, applied (idempotently) on first connection. */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_slug TEXT NOT NULL,
  price_display REAL NOT NULL,
  image TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS orders (
  external_order_id TEXT PRIMARY KEY,
  np_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  coin TEXT NOT NULL,
  network TEXT,
  amount REAL NOT NULL,
  address TEXT,
  memo TEXT,
  expires_at TEXT,
  paid_at TEXT,
  transaction_hash TEXT,
  ipn_status TEXT,
  ipn_delivered_at TEXT,
  email TEXT,
  cart_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS np_nonce (
  public_key TEXT PRIMARY KEY,
  last_nonce INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS np_ipn_delivery (
  delivery_id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL
);
`;
