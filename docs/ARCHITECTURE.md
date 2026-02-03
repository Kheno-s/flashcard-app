# Architektur

Ziel: iOS + Web aus *einem* Codebase, aber sauber strukturiert, damit wir später Features hinzufügen können (Sync, Stats, Audio, etc.).

## Schichten

- **UI / Screens**: `app/` (expo-router)
- **UI Komponenten**: `src/ui/`
- **Domain**: `src/domain/` (Types, fachliche Regeln)
- **Services**: `src/services/` (Spaced Repetition, Import)
- **Storage**: `src/storage/` (SQLite + Repository)

Prinzip:
- Screens enthalten kaum Logik, nur Orchestrierung.
- Fachlogik ist in Services/Domain testbar.
- Storage kann später gegen Cloud/Sync ausgetauscht werden.

## Datenmodell (MVP)

- `decks`
- `cards` (tags als JSON)
- `review_state`

## Spaced Repetition

MVP nutzt einen **SM-2 inspirierten** Scheduler (`src/services/scheduler.ts`).
Später kann man ihn genauer machen (z.B. FSRS).
