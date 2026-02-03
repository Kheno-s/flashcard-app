import type { Card, Deck, DeckId, Rating, ReviewState } from "../domain/types";
import type { Db } from "./db";

export type Repository = ReturnType<typeof createRepository>;

export function createRepository(db: Db) {
  return {
    async listDecks(): Promise<Deck[]> {
      const rows = await db.getAllAsync<{ id: string; name: string; created_at: number; parent_deck_id: string | null }>(
        "SELECT id, name, created_at, parent_deck_id FROM decks ORDER BY created_at DESC"
      );
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        createdAt: r.created_at,
        parentDeckId: r.parent_deck_id ?? undefined,
      }));
    },

    async createDeck(deck: Deck): Promise<void> {
      await db.runAsync("INSERT INTO decks (id, name, created_at, parent_deck_id) VALUES (?, ?, ?, ?)", [
        deck.id,
        deck.name,
        deck.createdAt,
        deck.parentDeckId ?? null,
      ]);
    },

    async createSubdeck(params: { name: string; parentDeckId: DeckId | null; id?: string; now?: number }): Promise<Deck> {
      const deck: Deck = {
        id: params.id ?? randomId("deck"),
        name: params.name,
        createdAt: params.now ?? Date.now(),
        parentDeckId: params.parentDeckId ?? undefined,
      };
      await this.createDeck(deck);
      return deck;
    },

    async updateDeckParent(deckId: DeckId, parentDeckId: DeckId | null): Promise<void> {
      await db.runAsync("UPDATE decks SET parent_deck_id = ? WHERE id = ?", [parentDeckId ?? null, deckId]);
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
      return this.getDueCardsByDeck({ deckId: null, limit, now });
    },

    async getDueCardsByDeck(params: {
      deckId: DeckId | null;
      includeSubdecks?: boolean;
      limit?: number;
      now?: number;
    }): Promise<(Card & { state: ReviewState })[]> {
      const { deckId, includeSubdecks = true, limit = 20, now = Date.now() } = params;

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
        deckId
          ? includeSubdecks
            ? `
        WITH RECURSIVE subtree(id) AS (
          SELECT id FROM decks WHERE id = ?
          UNION ALL
          SELECT d.id FROM decks d
          JOIN subtree s ON d.parent_deck_id = s.id
        )
        SELECT c.id, c.deck_id, c.front, c.back, c.tags_json, c.created_at,
               rs.due_at, rs.interval_days, rs.ease_factor, rs.repetitions, rs.lapses, rs.last_reviewed_at
        FROM review_state rs
        JOIN cards c ON c.id = rs.card_id
        WHERE rs.due_at <= ?
          AND c.deck_id IN (SELECT id FROM subtree)
        ORDER BY rs.due_at ASC
        LIMIT ?
      `
            : `
        SELECT c.id, c.deck_id, c.front, c.back, c.tags_json, c.created_at,
               rs.due_at, rs.interval_days, rs.ease_factor, rs.repetitions, rs.lapses, rs.last_reviewed_at
        FROM review_state rs
        JOIN cards c ON c.id = rs.card_id
        WHERE rs.due_at <= ?
          AND c.deck_id = ?
        ORDER BY rs.due_at ASC
        LIMIT ?
      `
          : `
        SELECT c.id, c.deck_id, c.front, c.back, c.tags_json, c.created_at,
               rs.due_at, rs.interval_days, rs.ease_factor, rs.repetitions, rs.lapses, rs.last_reviewed_at
        FROM review_state rs
        JOIN cards c ON c.id = rs.card_id
        WHERE rs.due_at <= ?
        ORDER BY rs.due_at ASC
        LIMIT ?
      `,
        deckId
          ? includeSubdecks
            ? [deckId, now, limit]
            : [now, deckId, limit]
          : [now, limit]
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

    async recordReview(params: { state: ReviewState; deckId: DeckId; rating: Rating; reviewedAt?: number }): Promise<void> {
      const reviewedAt = params.reviewedAt ?? Date.now();
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `UPDATE review_state
           SET due_at = ?, interval_days = ?, ease_factor = ?, repetitions = ?, lapses = ?, last_reviewed_at = ?
           WHERE card_id = ?`,
          [
            params.state.dueAt,
            params.state.intervalDays,
            params.state.easeFactor,
            params.state.repetitions,
            params.state.lapses,
            reviewedAt,
            params.state.cardId,
          ]
        );
        await db.runAsync(
          "INSERT INTO review_log (id, card_id, deck_id, rating, reviewed_at) VALUES (?, ?, ?, ?, ?)",
          [randomId("rev"), params.state.cardId, params.deckId, params.rating, reviewedAt]
        );
      });
    },

    async getDueCardsForDeck(deckId: string, limit = 50, now = Date.now()): Promise<(Card & { state: ReviewState })[]> {
      // includes subdecks via recursive CTE
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
        WITH RECURSIVE deck_tree(id) AS (
          SELECT id FROM decks WHERE id = ?
          UNION ALL
          SELECT d.id FROM decks d
          JOIN deck_tree dt ON d.parent_deck_id = dt.id
        )
        SELECT c.id, c.deck_id, c.front, c.back, c.tags_json, c.created_at,
               rs.due_at, rs.interval_days, rs.ease_factor, rs.repetitions, rs.lapses, rs.last_reviewed_at
        FROM review_state rs
        JOIN cards c ON c.id = rs.card_id
        WHERE rs.due_at <= ?
          AND c.deck_id IN (SELECT id FROM deck_tree)
        ORDER BY rs.due_at ASC
        LIMIT ?
        `,
        [deckId, now, limit]
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

    async updateReviewState(state: ReviewState, deckId?: string, rating?: string): Promise<void> {
      await db.withTransactionAsync(async () => {
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

        if (deckId && rating && state.lastReviewedAt) {
          const id = `${state.lastReviewedAt}-${state.cardId}`;
          await db.runAsync(
            "INSERT OR REPLACE INTO review_log (id, card_id, deck_id, rating, reviewed_at) VALUES (?, ?, ?, ?, ?)",
            [id, state.cardId, deckId, rating, state.lastReviewedAt]
          );
        }
      });
    },

    // (getStats implemented below)

    async getStats(now = Date.now()): Promise<{
      learnedToday: number;
      totalCards: number;
      dueCards: number;
      streakDays: number;
      last7Days: { day: string; count: number }[];
    }> {
      const total = await db.getFirstAsync<{ c: number }>("SELECT COUNT(*) AS c FROM cards");
      const due = await db.getFirstAsync<{ c: number }>("SELECT COUNT(*) AS c FROM review_state WHERE due_at <= ?", [now]);

      const startOfToday = startOfLocalDay(now);
      const learned = await db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(DISTINCT card_id) AS c FROM review_log WHERE reviewed_at >= ?",
        [startOfToday]
      );

      // last 7 days (including today)
      const start7 = startOfLocalDay(now - 6 * 24 * 60 * 60 * 1000);
      const rows = await db.getAllAsync<{ day: string; c: number }>(
        `
        SELECT strftime('%Y-%m-%d', reviewed_at/1000, 'unixepoch', 'localtime') AS day,
               COUNT(*) AS c
        FROM review_log
        WHERE reviewed_at >= ?
        GROUP BY day
        ORDER BY day ASC
      `,
        [start7]
      );

      const dayMap = new Map(rows.map((r) => [r.day, r.c] as const));
      const last7Days: { day: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(startOfLocalDay(now - i * 24 * 60 * 60 * 1000));
        const key = toDayKey(d);
        last7Days.push({ day: key, count: dayMap.get(key) ?? 0 });
      }

      // streak: consecutive days ending today with >= 1 review
      const daysWithReviews = await db.getAllAsync<{ day: string }>(
        `
        SELECT DISTINCT strftime('%Y-%m-%d', reviewed_at/1000, 'unixepoch', 'localtime') AS day
        FROM review_log
        ORDER BY day DESC
        LIMIT 400
      `
      );
      const daySet = new Set(daysWithReviews.map((r) => r.day));
      let streakDays = 0;
      for (let i = 0; i < 400; i++) {
        const d = new Date(startOfLocalDay(now - i * 24 * 60 * 60 * 1000));
        const key = toDayKey(d);
        if (daySet.has(key)) streakDays += 1;
        else break;
      }

      return {
        learnedToday: learned?.c ?? 0,
        totalCards: total?.c ?? 0,
        dueCards: due?.c ?? 0,
        streakDays,
        last7Days,
      };
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

function randomId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function startOfLocalDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function toDayKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
