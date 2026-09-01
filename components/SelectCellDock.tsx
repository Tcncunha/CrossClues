'use client';

interface ActiveClue {
  row: number;
  col: number;
}

interface SelectCellDockProps {
  gridSize: number;
  onGuess: (row: number, col: number) => void;
  activeClue?: ActiveClue | null;
  isClueGiver: boolean;
}

/**
 * SelectCellDock — grid of cell buttons for guessing.
 * Spec: 5x4 grid (gridSize dynamic), w-full h-10 min 44px per button,
 *       hasClue bg-warning ring-2, always visible but disabled opacity-40
 *       when not player's guessing action.
 *
 * Disabled when: isClueGiver === true OR activeClue == null
 */
export default function SelectCellDock({ gridSize, onGuess, activeClue, isClueGiver }: SelectCellDockProps) {
  const safeSize = Math.max(1, Math.min(10, Math.floor(gridSize)));
  const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, safeSize);

  const hasActiveClue = activeClue != null;
  const isDisabled = isClueGiver || !hasActiveClue;

  const getLabel = (row: number, col: number) => `${colLetters[col]}${row + 1}`;

  // hasClue highlight: visible only for clue giver — never reveal target cell to guessers
  const isHasClueCell = (row: number, col: number) =>
    isClueGiver && hasActiveClue && activeClue!.row === row && activeClue!.col === col;

  const cells: { row: number; col: number; label: string; hasClue: boolean }[] = [];
  for (let row = 0; row < safeSize; row++) {
    for (let col = 0; col < safeSize; col++) {
      cells.push({
        row,
        col,
        label: getLabel(row, col),
        hasClue: isHasClueCell(row, col),
      });
    }
  }

  return (
    <div
      className={[
        'w-full rounded-card border bg-bg-card p-3 shadow-lg',
        'transition-opacity duration-200',
        isDisabled ? 'opacity-40' : 'opacity-100',
      ].join(' ')}
      aria-disabled={isDisabled}
      aria-label="Select cell to guess"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono-label font-bold tracking-widest uppercase text-text-muted">
          Select Cell
        </span>
        {isDisabled && (
          <span className="text-[10px] font-mono-label text-text-muted">
            {isClueGiver ? 'Wait for group to guess' : 'No active clue'}
          </span>
        )}
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${safeSize}, minmax(0, 1fr))` }}
        role="group"
        aria-label={`Grid ${safeSize} by ${safeSize}`}
      >
        {cells.map(({ row, col, label, hasClue }) => (
          <button
            key={label}
            type="button"
            disabled={isDisabled}
            onClick={() => {
              if (!isDisabled) onGuess(row, col);
            }}
            aria-label={`Guess cell ${label}${hasClue ? ' — has clue' : ''}`}
            aria-disabled={isDisabled}
            className={[
              'w-full h-10 rounded-cell border-2',
              'text-xs font-mono-label font-bold',
              'transition-all duration-150',
              'flex items-center justify-center',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card',
              // min 44px touch target (h-10 = 40px, enforce min-h)
              'min-h-[44px]',
              hasClue
                ? 'bg-warning text-ink border-warning ring-2 ring-warning/40 shadow-md'
                : 'bg-bg-cell border-border text-text-secondary hover:bg-bg-cell-hover hover:border-accent-light hover:text-accent-light',
              isDisabled ? 'cursor-not-allowed' : 'cursor-pointer active:scale-[0.97]',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
