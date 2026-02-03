import type { Card, Deck, ReviewState } from "../domain/types";
import type { Db } from "./db";

export type Repository = ReturnType<typeof createRepository>;

export function createRepository(db: Db) {
  return {
    async listDecks(): Promise<Deck[]> {
      const rows = await db.getAllAsync<{ id: string; name: string; created_at: number }>(
        "SELECT id, name, created_at FROM decks ORDER BY created_at DESC"
      );
      return rows.map((r) => ({ id: r.id, name: r.name, createdAt: r.created_at }));
    },

    async createDeck(deck: Deck): Promise<void> {
      await db.runAsync("INSERT INTO decks (id, name, created_at) VALUES (?, ?, ?)", [
        deck.id,
        deck.name,
        deck.createdAt,
      ]);
    },

    async addCards(cards: Card[], states: ReviewState[]): Promise<void> {
      await db.withTransactionAsync(async () => {
        for (const c of cards) {
          await db.runAsync(
            "INSERT INTO cards (id, deck_id, front, back, tags_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            [c.id, c.deckId, c.front, c.back, JSON.stringify(c.tags), c.createdAt]
          );
        }
        for (const s of states) {
          await db.runAsync(
            "INSERT INTO review_state (card_id, due_at, interval_days, ease_factor, repetitions, lapses, last_reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              s.cardId,
              s.dueAt,
              s.intervalDays,
              s.easeFactor,
              s.repetitions,
              s.lapses,
              s.lastReviewedAt ?? null,
            ]
          );
        }
      });
    },

    async getDueCards(limit = 20, now = Date.now()): Promise<(Card & { state: ReviewState })[]> {
      const rows = await db.getAllAsync<{
        id: string;
        deck_id: string;
        front: string;
        back: string;
        tags_json: string;
        created_at: number;
        due_at: number;
        interval_days: number;
        ease_factor: number;
        repetitions: number;
        lapses: number;
        last_reviewed_at: number | null;
      }>(
        `
        SELECT c.id, c.deck_id, c.front, c.back, c.tags_json, c.created_at,
               rs.due_at, rs.interval_days, rs.ease_factor, rs.repetitions, rs.lapses, rs.last_reviewed_at
        FROM review_state rs
        JOIN cards c ON c.id = rs.card_id
        WHERE rs.due_at <= ?
        ORDER BY rs.due_at ASC
        LIMIT ?
      `,
        [now, limit]
      );

      return rows.map((r) => ({
        id: r.id,
        deckId: r.deck_id,
        front: r.front,
        back: r.back,
        tags: safeJsonArray(r.tags_json),
        createdAt: r.created_at,
        state: {
          cardId: r.id,
          dueAt: r.due_at,
          intervalDays: r.interval_days,
          easeFactor: r.ease_factor,
          repetitions: r.repetitions,
          lapses: r.lapses,
          lastReviewedAt: r.last_reviewed_at ?? undefined,
        },
      }));
    },

    async updateReviewState(state: ReviewState): Promise<void> {
      await db.runAsync(
        `UPDATE review_state
         SET due_at = ?, interval_days = ?, ease_factor = ?, repetitions = ?, lapses = ?, last_reviewed_at = ?
         WHERE card_id = ?`,
        [
          state.dueAt,
          state.intervalDays,
          state.easeFactor,
          state.repetitions,
          state.lapses,
          state.lastReviewedAt ?? null,
          state.cardId,
        ]
      );
    },
  };
}

function safeJsonArray(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
