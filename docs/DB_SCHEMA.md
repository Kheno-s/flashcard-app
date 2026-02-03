# DB Schema (SQLite)

Die App ist **offline-first**.

DB: `flashcards.db` (via `expo-sqlite`)

## Tabellen

### `decks`

| Spalte | Typ | Bedeutung |
|---|---|---|
| `id` | TEXT PK | Deck UUID |
| `name` | TEXT | Name |
| `parent_deck_id` | TEXT NULL FK | optionales Parent-Deck (Subdecks) |
| `created_at` | INTEGER | Unix ms |

### `cards`

| Spalte | Typ | Bedeutung |
|---|---|---|
| `id` | TEXT PK | Card UUID |
| `deck_id` | TEXT FK | Referenz `decks.id` |
| `front` | TEXT | Vorderseite |
| `back` | TEXT | Rückseite |
| `tags_json` | TEXT | JSON Array `string[]` |
| `created_at` | INTEGER | Unix ms |

### `review_state`

| Spalte | Typ | Bedeutung |
|---|---|---|
| `card_id` | TEXT PK/FK | Referenz `cards.id` |
| `due_at` | INTEGER | nächste Fälligkeit (Unix ms) |
| `interval_days` | INTEGER | Interval in Tagen |
| `ease_factor` | REAL | SM-2 EF |
| `repetitions` | INTEGER | Anzahl Wiederholungen |
| `lapses` | INTEGER | Anzahl "Again" |
| `last_reviewed_at` | INTEGER NULL | letzte Review-Zeit |

### `review_log`

| Spalte | Typ | Bedeutung |
|---|---|---|
| `id` | TEXT PK | (reviewed_at + card_id) |
| `card_id` | TEXT FK | Referenz `cards.id` |
| `deck_id` | TEXT FK | Referenz `decks.id` |
| `rating` | TEXT | again/hard/good/easy |
| `reviewed_at` | INTEGER | Unix ms |

## Indizes

- `idx_review_due` auf `review_state(due_at)`
- `idx_cards_deck` auf `cards(deck_id)`
- `idx_review_log_day` auf `review_log(reviewed_at)`
- `idx_review_log_deck` auf `review_log(deck_id)`

## Migrations

Siehe `src/storage/db.ts`.

