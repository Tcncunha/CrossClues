// Shared constants and helpers for the Cross Clues (Entre Linhas) rules.
// Kept in English for consistency with the rest of the codebase.

export type RatingId = 'bad' | 'average' | 'good' | 'perfect';

export interface RatingThreshold {
  id: RatingId;
  emoji: string;
  /** Minimum revealed cells (inclusive) for this rating row. */
  min: number;
  /** Maximum revealed cells (inclusive) for this rating row. */
  max: number;
}

/**
 * Scoring classification per grid mode.
 * The grid size determines the mode:
 *   3 => Expresso (3x3), 4 => Classico (4x4), 5 => Expert (5x5).
 */
export const RATING_THRESHOLDS_BY_GRID: Record<number, RatingThreshold[]> = {
  3: [
    { id: 'bad', emoji: '❌', min: 0, max: 5 },
    { id: 'average', emoji: '🪵', min: 6, max: 7 },
    { id: 'good', emoji: '🌟', min: 8, max: 8 },
    { id: 'perfect', emoji: '🧠', min: 9, max: 9 },
  ],
  4: [
    { id: 'bad', emoji: '❌', min: 0, max: 10 },
    { id: 'average', emoji: '🪵', min: 11, max: 13 },
    { id: 'good', emoji: '🌟', min: 14, max: 15 },
    { id: 'perfect', emoji: '🧠', min: 16, max: 16 },
  ],
  5: [
    { id: 'bad', emoji: '❌', min: 0, max: 15 },
    { id: 'average', emoji: '🪵', min: 16, max: 20 },
    { id: 'good', emoji: '🌟', min: 21, max: 24 },
    { id: 'perfect', emoji: '🧠', min: 25, max: 25 },
  ],
};

export function getAvailableGridSizes(): number[] {
  return Object.keys(RATING_THRESHOLDS_BY_GRID).map(Number);
}

/**
 * Returns the rating level for a given grid size and number of revealed cells.
 * Falls back to 'bad' when the grid size has no defined thresholds.
 */
export function getRatingForResult(gridSize: number, revealedCellCount: number): RatingThreshold {
  const thresholds = RATING_THRESHOLDS_BY_GRID[gridSize];
  if (!thresholds) {
    return { id: 'bad', emoji: '❌', min: 0, max: revealedCellCount };
  }
  const found = thresholds.find(
    level => revealedCellCount >= level.min && revealedCellCount <= level.max,
  );
  return found ?? thresholds[0];
}

/** CSS utility token in use by the design system, per rating level. */
export const RATING_COLOR_TOKENS: Record<RatingId, string> = {
  bad: '#b0362b',
  average: '#c98a3b',
  good: '#d6a94e',
  perfect: '#a2dd8a',
};
