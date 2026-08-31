/**
 * Client-side clue validation for Cross Clues.
 *
 * Rules enforced here (all checked before the clue reaches the server):
 *   1. Must not be empty or whitespace-only.
 *   2. Must be a single word (no spaces after trim).
 *   3. Must not contain hyphens (no compound words).
 *   4. Must not consist of digits only (no numbers).
 *   5. Must not be a 2-3 letter all-uppercase string (no abbreviations).
 *   6. Max length is handled by the input's maxLength attribute (15).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ClueValidationErrorCode =
  | 'empty'
  | 'multipleWords'
  | 'compoundWord'
  | 'number'
  | 'abbreviation'
  | 'tooLong';

export interface ValidationMessages {
  empty: string;
  multipleWords: string;
  compoundWord: string;
  number: string;
  abbreviation: string;
  tooLong: string;
}

// ---------------------------------------------------------------------------
// Bilingual message map (US-03)
// ---------------------------------------------------------------------------

export const validationMessages: Record<'en' | 'pt', ValidationMessages> = {
  en: {
    empty: 'Type a word first',
    multipleWords: 'Clue must be a single word',
    compoundWord: 'Clue cannot be a compound word',
    number: 'Clue cannot be a number',
    abbreviation: 'Clue cannot be an abbreviation',
    tooLong: 'Clue must be 15 characters or fewer',
  },
  pt: {
    empty: 'Digite uma palavra primeiro',
    multipleWords: 'A dica deve ser uma única palavra',
    compoundWord: 'A dica não pode ser palavra composta',
    number: 'A dica não pode ser um número',
    abbreviation: 'A dica não pode ser uma sigla',
    tooLong: 'A dica deve ter no máximo 15 caracteres',
  },
};

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/** Matches 2 or 3 consecutive uppercase letters (e.g. "ONG", "CPU"). */
const ABBREVIATION_REGEX = /^[A-Z]{2,3}$/;

/** Matches strings that consist solely of digits. */
const DIGITS_ONLY_REGEX = /^\d+$/;

// ---------------------------------------------------------------------------
// Main validation function (US-01)
// ---------------------------------------------------------------------------

/**
 * Validates a raw clue string against client-side rules.
 *
 * @param clue - The raw input string from the user.
 * @returns A {@link ClueValidationErrorCode} if the clue is invalid, or `null`
 *          when the clue passes all checks.
 */
export function validateClueLocal(clue: string): ClueValidationErrorCode | null {
  const trimmed = clue.trim();

  // 1. Empty / whitespace-only
  if (!trimmed) {
    return 'empty';
  }

  // 2. Multiple words (whitespace detected after trim)
  if (/\s/.test(trimmed)) {
    return 'multipleWords';
  }

  // 3. Compound word (hyphen detected)
  if (trimmed.includes('-')) {
    return 'compoundWord';
  }

  // 4. Number (digits only)
  if (DIGITS_ONLY_REGEX.test(trimmed)) {
    return 'number';
  }

  // 5. Abbreviation (2-3 uppercase letters — checked against the original
  //    input so "ONG" is caught but "ong" is not an abbreviation, it's a word)
  if (ABBREVIATION_REGEX.test(clue.trim())) {
    return 'abbreviation';
  }

  // 6. Too long (defense-in-depth against the input maxLength attribute)
  if (trimmed.length > 15) {
    return 'tooLong';
  }

  return null;
}

/**
 * Returns the localised error message for a given validation error code.
 */
export function getValidationMessage(
  errorCode: ClueValidationErrorCode,
  lang: 'en' | 'pt',
): string {
  return validationMessages[lang][errorCode];
}
