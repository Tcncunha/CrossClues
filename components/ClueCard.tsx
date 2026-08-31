'use client';

type ClueCardState = 'inHand' | 'locked' | 'revealed';

interface ClueCardProps {
  label: string;
  rowWord: string;
  colWord: string;
  state: ClueCardState;
  onGiveClue?: () => void;
}

/**
 * ClueCard — 96x136 desktop / 120x168 mobile, paper stock.
 * - bg-paper #ede0c4 + paper-grain texture
 * - rounded-card 16px, border-2, shadow-lg
 * - Top-left label mono 10px, center font-display 28px, subtitle 12px
 * - Hover rotate-1, animate-card-flip 0.65s
 * - locked: grayscale opacity-60 + overlay 🔒
 */
export default function ClueCard({ label, rowWord, colWord, state, onGiveClue }: ClueCardProps) {
  const isLocked = state === 'locked';
  const isInteractive = state === 'inHand' && typeof onGiveClue === 'function' && !isLocked;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isInteractive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onGiveClue?.();
    }
  };

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={isInteractive ? `Give clue for ${label} ${rowWord} by ${colWord}` : `${label} ${rowWord} ${colWord} ${state}`}
      aria-disabled={isLocked || undefined}
      onClick={isInteractive ? onGiveClue : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={[
        'relative flex flex-col items-center justify-center',
        'w-[120px] h-[168px] md:w-24 md:h-[136px]',
        'bg-paper paper-grain',
        'border-2 rounded-card shadow-lg',
        'overflow-hidden select-none',
        'transition-transform duration-200',
        'animate-card-flip',
        state === 'revealed' ? 'border-success' : 'border-border',
        isLocked ? 'grayscale opacity-60' : 'hover:rotate-1 hover:shadow-xl hover:-translate-y-0.5',
        isInteractive ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary' : '',
      ].join(' ')}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Top-left cell label — mono 10px */}
      <span
        className="absolute top-1.5 left-2 font-mono-label font-bold tracking-wider text-ink-light leading-none"
        style={{ fontSize: '10px' }}
        aria-hidden="true"
      >
        {label}
      </span>

      {/* Center content */}
      <div className="flex flex-col items-center justify-center gap-0.5 px-2 text-center">
        <span className="font-display font-extrabold text-ink leading-none" style={{ fontSize: '28px' }}>
          {label}
        </span>
        <span className="font-body font-medium text-ink-light leading-tight text-center" style={{ fontSize: '12px' }}>
          {rowWord} <span className="opacity-60">×</span> {colWord}
        </span>
      </div>

      {/* Bottom-right mirrored label decorative */}
      <span
        className="absolute bottom-1.5 right-2 font-mono-label font-bold tracking-wider text-ink-light leading-none rotate-180"
        style={{ fontSize: '10px' }}
        aria-hidden="true"
      >
        {label}
      </span>

      {/* Locked overlay */}
      {isLocked && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-paper/60 backdrop-blur-[0.5px] rounded-card"
          aria-hidden="true"
        >
          <span className="text-2xl leading-none" role="img" aria-label="locked">
            🔒
          </span>
          <span className="mt-1 text-[10px] font-mono-label font-bold tracking-widest text-ink-light uppercase">Locked</span>
        </div>
      )}

      {/* Grain overlay for paper texture */}
      <span className="pointer-events-none absolute inset-0 rounded-card grain-overlay" aria-hidden="true" />
    </div>
  );
}
