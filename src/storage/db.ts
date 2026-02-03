import * as SQLite from "expo-sqlite";

const DB_NAME = "flashcards.db";

export type Db = SQLite.SQLiteDatabase;

export async function openDb(): Promise<Db> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await migrate(db);
  return db;
}

async function migrate(db: Db) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      parent_deck_id TEXT,
      FOREIGN KEY(parent_deck_id) REFERENCES decks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY NOT NULL,
      deck_id TEXT NOT NULL,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(deck_id) REFERENCES decks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS review_state (
      card_id TEXT PRIMARY KEY NOT NULL,
      due_at INTEGER NOT NULL,
      interval_days INTEGER NOT NULL,
      ease_factor REAL NOT NULL,
      repetitions INTEGER NOT NULL,
      lapses INTEGER NOT NULL,
      last_reviewed_at INTEGER,
      FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS review_log (
      id TEXT PRIMARY KEY NOT NULL,
      card_id TEXT NOT NULL,
      deck_id TEXT NOT NULL,
      rating TEXT NOT NULL,
      reviewed_at INTEGER NOT NULL,
      FOREIGN KEY(card_id) REFERENCES cards(id) ON DELETE CASCADE,
      FOREIGN KEY(deck_id) REFERENCES decks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_review_due ON review_state(due_at);
    CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deck_id);
    CREATE INDEX IF NOT EXISTS idx_review_log_day ON review_log(reviewed_at);
    CREATE INDEX IF NOT EXISTS idx_review_log_deck ON review_log(deck_id);
  `);

  // Lightweight migration for existing DBs: add parent_deck_id if missing
  const cols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(decks)");
  const hasParent = cols.some((c) => c.name === "parent_deck_id");
  if (!hasParent) {
    await db.execAsync(`ALTER TABLE decks ADD COLUMN parent_deck_id TEXT;`);
  }
}
