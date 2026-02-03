import type { Card, Deck, ReviewState } from "../domain/types";

export type ImportResult = {
  deck: Deck;
  cards: Card[];
  reviewStates: ReviewState[];
  warnings: string[];
  format: "tsv" | "csv";
  delimiter: "\t" | "," | ";";
};

/**
 * Pragmatic TSV/CSV importer.
 *
 * Supported inputs:
 * - TSV: Front\tBack\tTags(optional)
 * - CSV: Front,Back,Tags(optional)  (comma or semicolon)
 *
 * Notes:
 * - CSV quoting is supported in a minimal way ("...") for commas/semicolons.
 */
export function parseDelimitedToDeck(
  input: string,
  deckName: string,
  now = Date.now(),
  idFactory: { deckId: () => string; cardId: () => string } = {
    deckId: () => cryptoRandomId(),
    cardId: () => cryptoRandomId(),
  }
): ImportResult {
  const warnings: string[] = [];
  const deck: Deck = { id: idFactory.deckId(), name: deckName.trim() || "Imported", createdAt: now };

  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  // detect delimiter from the first non-empty line
  const first = lines[0] ?? "";
  const delimiter: "\t" | "," | ";" = first.includes("\t") ? "\t" : first.includes(";") ? ";" : ",";
  const format: "tsv" | "csv" = delimiter === "\t" ? "tsv" : "csv";

  const cards: Card[] = [];
  const reviewStates: ReviewState[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const parts = delimiter === "\t" ? raw.split("\t") : splitCsvLine(raw, delimiter);

    if (parts.length < 2) {
      warnings.push(`Zeile ${i + 1}: hat weniger als 2 Spalten (Front/Back). Übersprungen.`);
      continue;
    }

    const front = (parts[0] ?? "").trim();
    const back = (parts[1] ?? "").trim();
    const tagStr = (parts[2] ?? "").trim();

    // skip header-like first line
    if (i === 0 && isHeader(front, back)) {
      continue;
    }

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
    cards.push({ id, deckId: deck.id, front, back, tags, createdAt: now });
    reviewStates.push({
      cardId: id,
      dueAt: now,
      intervalDays: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
    });
  }

  return { deck, cards, reviewStates, warnings, format, delimiter };
}

function isHeader(front: string, back: string) {
  const f = front.toLowerCase();
  const b = back.toLowerCase();
  return (f === "front" && b === "back") || (f.includes("frage") && b.includes("antwort"));
}

function splitCsvLine(line: string, delimiter: "," | ";"): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // handle escaped quotes ""
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out;
}

function cryptoRandomId(): string {
  const c = (globalThis as any).crypto as undefined | { randomUUID?: () => string };
  if (c?.randomUUID) return c.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
