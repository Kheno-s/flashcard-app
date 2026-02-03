# Flashcard App (iOS + Web)

Karteikarten-Lernapp für iPhone **und** als WebApp – mit **Spaced Repetition** und Import-Funktion.

Repo: https://github.com/Kheno-s/flashcard-app

---

## Was ist Expo / Expo SDK?

- **React Native** ist die Basis, um Apps mit JavaScript/TypeScript zu bauen, die *nativ* auf iOS/Android laufen.
- **Expo** ist eine Toolchain + Sammlung von Modulen, die die Entwicklung deutlich vereinfacht (weniger Setup, weniger „native Schmerzen“).
- **Expo SDK** bezeichnet die **Version** dieser Expo-Toolchain (z.B. SDK 52). Eine SDK-Version pinnt kompatible Versionen von React Native + Expo-Modulen, sodass alles zuverlässig zusammenpasst.

Warum das gut ist:
- stabiler, reproduzierbarer Tech-Stack
- einfacher Upgrades (Expo gibt klare Upgrade-Pfade)
- schneller Start ohne Xcode/Gradle-Frickelei

---

## Ziel (MVP)

**MVP-Features (Phase 1):**
1. **Karten anzeigen** (Front/Back, Flip)
2. **Spaced Repetition** (SM-2 oder sehr ähnlich)
3. **Import** von Karteikarten (Start: TSV/Anki-Export; später: .apkg)

**Später (Phase 2+):**
- Statistiken (Streaks, Reviews/Tag)
- Mehrere Decks, Tags/Filter
- Sync/Backup (optional: iCloud / Supabase)
- Rich Text (Markdown), Audio, Bilder

---

## Tech Stack (empfohlen)

- **Expo (React Native) + TypeScript** (ein Codebase für iOS + Web)
- **expo-router** für Navigation
- **Persistenz:** zuerst lokal (z.B. `expo-sqlite`), später optional Cloud Sync
- **State:** leichtgewichtig (Zustand) oder React Context, je nach Komplexität

---

## Architektur (erweiterbar)

Wir halten von Anfang an klare Schichten ein:

- `app/` – Screens/Routes (expo-router)
- `src/domain/` – Fachlogik (Card, Deck, Review, Scheduler)
- `src/services/` – Spaced-Repetition-Algorithmus, Importer
- `src/storage/` – DB/Repository-Layer
- `src/ui/` – wiederverwendbare UI-Komponenten (CardFlip, Buttons, etc.)

Prinzip:
- UI ist dumm
- Domain/Services enthalten Logik
- Storage ist austauschbar (lokal → Cloud später möglich)

---

## Schritt-für-Schritt Plan

### Schritt 1 – Grundgerüst (jetzt)
- [x] Expo Projekt initialisiert (tabs template)
- [x] Strukturordner `src/` angelegt (domain/services/storage/ui)
- [x] Docs angelegt (`docs/ARCHITECTURE.md`, `docs/IMPORT_FORMAT.md`)
- [ ] Basis-Navigation: Home / Decks / Review / Import

### Schritt 2 – Datenmodell
- [ ] Models: `Card`, `Deck`, `ReviewState`
- [ ] Repository-Interface definieren
- [ ] Lokale DB (SQLite) anbinden

### Schritt 3 – Spaced Repetition
- [ ] Scheduler-Service (SM-2)
- [ ] Review-Flow: Again / Hard / Good / Easy

### Schritt 4 – Import
- [ ] Import TSV (Front \t Back \t Tags)
- [ ] Mapping auf Deck + Cards

---

## Development

Install:
```bash
npm install
```

Run (Web):
```bash
npm run web
```

Run (Mobile):
- iOS build brauchst du *für echtes Device* i.d.R. macOS – aber Development geht auch über Expo Go.

---

## Konventionen

- TypeScript strict
- kleine, testbare Services (Scheduler/Importer)
- keine Logik in Screens; Screens orchestrieren nur

---

## Entscheidungen (offen)

Diese Punkte klären wir als Nächstes:
- Import-Formate: nur TSV/CSV oder auch Anki `.apkg`?
- Offline-first + optional Sync?
- UI/UX: minimalistisch (Anki-like) oder hübsch (Duolingo-like)?
