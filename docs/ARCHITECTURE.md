# Architektur

Ziel: iOS + Web aus *einem* Codebase, aber sauber strukturiert, damit wir später Features hinzufügen können (Sync, Stats, Audio, etc.).

## Schichten

- **Routes / Screens**: `app/` (expo-router)
- **UI Komponenten**: `src/ui/`
- **Domain**: `src/domain/` (Types, fachliche Regeln)
- **Services**: `src/services/` (Spaced Repetition, Import)
- **Storage**: `src/storage/` (SQLite + Repository)
- **Docs**: `docs/`

## Prinzipien

- Screens enthalten möglichst wenig Logik (nur Orchestrierung & UI).
- Fachlogik ist in `domain/` + `services/` isoliert und später testbar.
- Persistenz ist gekapselt (Repository Pattern) → später Sync/Cloud möglich.

## Datenfluss (high-level)

**Import**
1. UI (Import Screen) nimmt TSV/CSV Text entgegen
2. `services/importDelimited.ts` parst → `Deck + Cards + ReviewState`
3. `storage/repository.ts` persistiert alles (Transaktion)

**Review**
1. UI fragt `repo.getDueCards(now)` ab
2. User flippt Karte → bewertet (Again/Hard/Good/Easy)
3. `services/scheduler.ts` berechnet `next ReviewState`
4. `repo.updateReviewState(nextState)`

## Datenmodell (MVP)

Siehe `docs/DB_SCHEMA.md`.

## Spaced Repetition

MVP nutzt einen **SM-2 inspirierten** Scheduler (`src/services/scheduler.ts`).

Ziel: schnell nutzbar, später austauschbar (z.B. FSRS).

## Erweiterungspunkte

- **Deck-Filter im Review** (nur due Karten eines Decks)
- **Stats** (Reviews/Tag, Streak)
- **Sync** (optional): z.B. Supabase oder iCloud CloudKit
- **Import v2**: Datei-Import, Anki `.apkg`
