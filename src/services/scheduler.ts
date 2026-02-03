import type { Rating, ReviewState } from "../domain/types";

/**
 * Minimal SM-2 inspired scheduler with 4 buttons.
 *
 * - again: lapse → short retry
 * - hard: smaller interval growth + lower ease
 * - good: normal growth
 * - easy: bigger growth + higher ease
 */
export function scheduleNext(state: ReviewState, rating: Rating, now = Date.now()): ReviewState {
  let { easeFactor, intervalDays, repetitions, lapses } = state;

  // Defaults
  if (!easeFactor || easeFactor < 1.3) easeFactor = 2.5;
  if (!intervalDays || intervalDays < 0) intervalDays = 0;
  if (!repetitions || repetitions < 0) repetitions = 0;
  if (!lapses || lapses < 0) lapses = 0;

  // "Again" → short relearn step (minutes)
  if (rating === "again") {
    lapses += 1;
    repetitions = 0;
    intervalDays = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    const dueAt = now + 10 * 60 * 1000; // 10 minutes
    return { ...state, lapses, repetitions, intervalDays, easeFactor, dueAt, lastReviewedAt: now };
  }

  // ease adjustments
  if (rating === "hard") {
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (rating === "good") {
    easeFactor = Math.max(1.3, easeFactor - 0.02);
  } else if (rating === "easy") {
    easeFactor = easeFactor + 0.1;
  }

  repetitions += 1;

  // Learning steps
  if (repetitions === 1) {
    intervalDays = rating === "hard" ? 1 : rating === "easy" ? 2 : 1;
  } else if (repetitions === 2) {
    intervalDays = rating === "hard" ? 2 : rating === "easy" ? 5 : 3;
  } else {
    // Review steps
    const multiplier = rating === "hard" ? 1.15 : rating === "easy" ? 1.7 : 1.4;
    intervalDays = Math.max(1, Math.round(intervalDays * easeFactor * multiplier));
  }

  const dueAt = now + intervalDays * 24 * 60 * 60 * 1000;
  return { ...state, lapses, repetitions, intervalDays, easeFactor, dueAt, lastReviewedAt: now };
}

export function previewNext(state: ReviewState, rating: Rating, now = Date.now()): { dueAt: number; label: string } {
  const next = scheduleNext(state, rating, now);
  return { dueAt: next.dueAt, label: formatDueLabel(next.dueAt, now) };
}

export function formatDueLabel(dueAt: number, now = Date.now()): string {
  const diff = Math.max(0, dueAt - now);
  const mins = Math.round(diff / (60 * 1000));
  if (mins < 60) return mins <= 1 ? "1m" : `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}
