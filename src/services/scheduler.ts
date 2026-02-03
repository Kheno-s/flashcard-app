import type { Rating, ReviewState } from "../domain/types";

/**
 * Minimal SM-2 inspired scheduler.
 * Ratings map (roughly):
 * - again: failure, reset reps, short retry
 * - hard: low quality
 * - good: normal
 * - easy: higher quality
 */
export function scheduleNext(state: ReviewState, rating: Rating, now = Date.now()): ReviewState {
  let { easeFactor, intervalDays, repetitions, lapses } = state;

  // Defaults
  if (!easeFactor || easeFactor < 1.3) easeFactor = 2.5;
  if (!intervalDays || intervalDays < 0) intervalDays = 0;
  if (!repetitions || repetitions < 0) repetitions = 0;
  if (!lapses || lapses < 0) lapses = 0;

  if (rating === "again") {
    // lapse
    lapses += 1;
    repetitions = 0;
    intervalDays = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    const dueAt = now + 10 * 60 * 1000; // 10 minutes
    return { ...state, lapses, repetitions, intervalDays, easeFactor, dueAt, lastReviewedAt: now };
  }

  // quality-like adjustments
  if (rating === "hard") {
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (rating === "good") {
    easeFactor = Math.max(1.3, easeFactor - 0.02);
  } else if (rating === "easy") {
    easeFactor = easeFactor + 0.1;
  }

  repetitions += 1;

  if (repetitions === 1) intervalDays = 1;
  else if (repetitions === 2) intervalDays = 3;
  else {
    const multiplier = rating === "hard" ? 1.2 : rating === "easy" ? 1.6 : 1.4;
    intervalDays = Math.max(1, Math.round(intervalDays * easeFactor * multiplier));
  }

  const dueAt = now + intervalDays * 24 * 60 * 60 * 1000;
  return { ...state, lapses, repetitions, intervalDays, easeFactor, dueAt, lastReviewedAt: now };
}
