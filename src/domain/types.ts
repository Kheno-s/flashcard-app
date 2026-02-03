export type DeckId = string;
export type CardId = string;

export type Card = {
  id: CardId;
  deckId: DeckId;
  front: string;
  back: string;
  tags: string[];
  createdAt: number; // unix ms
};

export type ReviewState = {
  cardId: CardId;
  dueAt: number; // unix ms
  intervalDays: number;
  easeFactor: number; // SM-2 EF, typical start 2.5
  repetitions: number;
  lapses: number;
  lastReviewedAt?: number;
};

export type Deck = {
  id: DeckId;
  name: string;
  createdAt: number;
  parentDeckId?: DeckId;
};

export type Rating = "again" | "hard" | "good" | "easy";
