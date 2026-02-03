# DB Schema (SQLite)

Die App ist **offline-first**.

DB: `flashcards.db` (via `expo-sqlite`)

## Tabellen

### `decks`

| Spalte | Typ | Bedeutung |
|---|---|---|
| `id` | TEXT PK | Deck UUID |
| `name` | TEXT | Name |
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

## Indizes

- `idx_review_due` auf `review_state(due_at)`
- `idx_cards_deck` auf `cards(deck_id)`

## Migrations

Siehe `src/storage/db.ts`.

