/**
 * SQLite persistence layer for the CRM backend.
 *
 * Strategy: store the entire contents of each top-level collection as a single
 * JSON blob in a key/value table.  This gives us:
 *   - Atomic writes (SQLite WAL mode prevents corruption on crash)
 *   - Concurrent read safety
 *   - Zero changes to the existing in-memory db object / route logic
 *   - A clean migration path to proper row-per-record tables later
 *
 * To upgrade to per-row tables: replace getCollection/setCollection with
 * proper INSERT/UPDATE/SELECT statements without touching any route code.
 */

import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const dbPath = join(process.cwd(), "data", "crm.db");
const legacyJsonPath = join(process.cwd(), "data", "crm-data.json");

// Ensure data directory exists
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent read performance and crash safety
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL");

// Single key/value table — each collection is one row
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS collections (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

const stmtGet = sqlite.prepare<[string], { value: string }>(
  "SELECT value FROM collections WHERE key = ?",
);
const stmtSet = sqlite.prepare<[string, string]>(
  "INSERT INTO collections (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
);

export function getCollection<T>(key: string): T | undefined {
  const row = stmtGet.get(key);
  if (!row) return undefined;
  return JSON.parse(row.value) as T;
}

export function setCollection<T>(key: string, value: T): void {
  stmtSet.run(key, JSON.stringify(value));
}

/**
 * Save all collections atomically in a single transaction.
 * Called every time server.ts would have called writeFileSync.
 */
export function saveAll(data: Record<string, unknown>): void {
  const tx = sqlite.transaction((entries: [string, unknown][]) => {
    for (const [key, val] of entries) {
      stmtSet.run(key, JSON.stringify(val));
    }
  });
  tx(Object.entries(data));
}

/**
 * Load all collections from SQLite, falling back to legacy JSON file
 * on first run so existing data is migrated automatically.
 */
export function loadAll(): Record<string, unknown> {
  // Check if SQLite already has data
  const existing = sqlite
    .prepare<[], { key: string }>("SELECT key FROM collections LIMIT 1")
    .get();

  if (existing) {
    // Read from SQLite
    const rows = sqlite
      .prepare<[], { key: string; value: string }>(
        "SELECT key, value FROM collections",
      )
      .all();
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.key] = JSON.parse(row.value);
    }
    return result;
  }

  // First run — migrate from JSON file if it exists
  if (existsSync(legacyJsonPath)) {
    console.log(
      "[SQLite] Migrating from crm-data.json → crm.db (one-time migration)",
    );
    const jsonData = JSON.parse(
      readFileSync(legacyJsonPath, "utf8"),
    ) as Record<string, unknown>;
    saveAll(jsonData);
    console.log(
      `[SQLite] Migrated ${Object.keys(jsonData).length} collections.`,
    );
    return jsonData;
  }

  // Fresh install — return empty so defaultDatabase takes over
  return {};
}

export default sqlite;
