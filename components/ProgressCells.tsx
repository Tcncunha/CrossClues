'use client';

import { Grid2x2 } from 'lucide-react';

interface ProgressCellsProps {
  revealed: number;
  total: number;
}

/**
 * ProgressCells — header pill with Grid2x2 icon, text-xs, and progress bar.
 * Bar: w-20 h-1.5 bg-bg-primary rounded-full > inner div w-% bg-success
 * Uses aria-valuenow / aria-valuemin / aria-valuemax.
 */
export default function ProgressCells({ revealed, total }: ProgressCellsProps) {
  const safeTotal = Math.max(1, total);
  const safeRevealed = Math.max(0, Math.min(revealed, safeTotal));
  const percentage = Math.round((safeRevealed / safeTotal) * 100);

  return (
    <div
      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-bg-card border border-border"
      role="group"
      aria-label={`Progress ${safeRevealed} of ${safeTotal} cells revealed`}
    >
      <Grid2x2 className="w-3.5 h-3.5 text-accent-light shrink-0" aria-hidden="true" />

      <span className="text-xs font-mono-label font-semibold text-text-secondary whitespace-nowrap">
        Cells {safeRevealed}/{safeTotal}
      </span>

      <div
        role="progressbar"
        aria-valuenow={safeRevealed}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-label={`${percentage}% complete`}
        className="w-20 h-1.5 bg-bg-primary rounded-full overflow-hidden shrink-0"
      >
        <div
          className="h-full bg-success rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <span className="text-[10px] font-mono-label font-bold text-text-muted min-w-[2ch] text-right" aria-hidden="true">
        {percentage}%
      </span>
    </div>
  );
}
