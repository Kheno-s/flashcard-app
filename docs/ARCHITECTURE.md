# Architektur

Ziel: iOS + Web aus *einem* Codebase, aber sauber strukturiert, damit wir später Features hinzufügen können (Sync, Stats, Audio, etc.).

## Schichten

- **Routes / Screens**: `app/` (expo-router)
- **UI Komponenten**: `components/`, `constants/`
- **Domain**: `src/domain/` (Types, fachliche Regeln)
- **Services**: `src/services/` (Spaced Repetition, Import)
- **Storage**: `src/storage/` (SQLite + Repository)
- **Theme**: `src/theme/` (Dark Mode, ThemeContext)
- **Docs**: `docs/`

## Prinzipien

- Screens enthalten möglichst wenig Logik (nur Orchestrierung & UI).
- Fachlogik ist in `domain/` + `services/` isoliert und später testbar.
- Persistenz ist gekapselt (Repository Pattern) → später Sync/Cloud möglich.
- Theme wird über Context (`ThemeContext`) bereitgestellt und persistiert in AsyncStorage.

## Datenfluss (high-level)

### Import
1. UI (Import Screen) nimmt TSV/CSV Text entgegen
2. `services/importDelimited.ts` parst → `Deck + Cards + ReviewState`
3. `storage/repository.ts` persistiert alles (Transaktion)

### Review
1. UI zeigt Deck-Picker → User wählt Deck oder "Review All"
2. `repo.getDueCardsForDeck(deckId, now)` oder `repo.getDueCards(now)`
3. User flipt Karte ("Show Answer")
4. User bewertet (Again/Hard/Good/Easy) mit Interval-Preview
5. `services/scheduler.ts` berechnet `next ReviewState`
6. `repo.updateReviewState(nextState, deckId, rating)` persistiert + loggt Review

### Subdecks
1. Decks haben optionales `parent_deck_id` für Hierarchie
2. `repo.getDueCardsForDeck` inkludiert rekursiv alle Subdecks
3. Deck-UI zeigt collapsible Tree-Ansicht

### Stats
1. `repo.getStats(now)` aggregiert:
   - Karten gelernt heute
   - Gesamt-/fällige Karten
   - Streak (aufeinanderfolgende Tage mit Reviews)
   - Letzte 7 Tage als Chart-Daten

## Datenmodell

Siehe `docs/DB_SCHEMA.md`.

## Spaced Repetition

SM-2 inspirierter Scheduler (`src/services/scheduler.ts`) mit 4 Buttons:

- **Again**: Lapse → 10min, EF -0.2
- **Hard**: +1.2× Multiplikator, EF -0.15
- **Good**: +1.4× Multiplikator, EF -0.02
- **Easy**: +1.6× Multiplikator, EF +0.1

Jeder Button zeigt Preview des nächsten Review-Termins (z.B. "in 3d").

## Theme / Dark Mode

- `ThemeProvider` in `src/theme/ThemeProvider.tsx`
- Speichert Präferenz (system/light/dark) in AsyncStorage
- `useColorScheme()` Hook liefert aktuelles Schema
- Alle Screens nutzen `Colors[scheme]` für dynamische Farben

## Erweiterungspunkte

- **Sync** (optional): z.B. Supabase oder iCloud CloudKit
- **Import v2**: Datei-Import, Anki `.apkg`
- **Audio**: TTS für Karten
- **Bilder**: Karten mit Bildern
