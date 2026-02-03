import type { Card, Deck, ReviewState } from "../domain/types";

export type ImportResult = {
  deck: Deck;
  cards: Card[];
  reviewStates: ReviewState[];
  warnings: string[];
};

/**
 * TSV format (Anki-like):
 * Front\tBack\tTags(optional)
 * Tags can be space or comma separated.
 */
export function parseTsvToDeck(
  tsv: string,
  deckName: string,
  now = Date.now(),
  idFactory: { deckId: () => string; cardId: () => string } = {
    deckId: () => cryptoRandomId(),
    cardId: () => cryptoRandomId(),
  }
): ImportResult {
  const warnings: string[] = [];
  const deck: Deck = { id: idFactory.deckId(), name: deckName.trim() || "Imported", createdAt: now };

  const lines = tsv
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  const cards: Card[] = [];
  const reviewStates: ReviewState[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const parts = raw.split("\t");
    if (parts.length < 2) {
      warnings.push(`Zeile ${i + 1}: hat weniger als 2 Spalten (Front/Back). Übersprungen.`);
      continue;
    }
    const front = parts[0]?.trim() ?? "";
    const back = parts[1]?.trim() ?? "";
    const tagStr = (parts[2] ?? "").trim();

    if (!front || !back) {
      warnings.push(`Zeile ${i + 1}: Front oder Back leer. Übersprungen.`);
      continue;
    }

    const tags = tagStr
      ? tagStr
          .split(/[ ,]+/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const id = idFactory.cardId();
    const card: Card = {
      id,
      deckId: deck.id,
      front,
      back,
      tags,
      createdAt: now,
    };

    const rs: ReviewState = {
      cardId: id,
      dueAt: now,
      intervalDays: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
    };

    cards.push(card);
    reviewStates.push(rs);
  }

  return { deck, cards, reviewStates, warnings };
}

function cryptoRandomId(): string {
  // Works on web + modern RN.
  // Fallback to Math.random if crypto is unavailable.
  const c = (globalThis as any).crypto as undefined | { randomUUID?: () => string };
  if (c?.randomUUID) return c.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
