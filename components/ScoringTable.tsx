'use client';

import { RATING_THRESHOLDS_BY_GRID, RATING_COLOR_TOKENS } from '@/lib/rules';
import type { RatingId } from '@/lib/rules';
import type { Lang } from '@/app/page';

interface Props {
  lang: Lang;
  /** If provided, the matching rating row is highlighted (used on Game Over). */
  highlightedRatingId?: RatingId | null;
}

const ui = {
  en: {
    title: 'Final Scoring',
    express: 'Express (3x3)',
    classic: 'Classic (4x4)',
    expert: 'Expert (5x5)',
    columns: ['Rating', 'Express (3x3)', 'Classic (4x4)', 'Expert (5x5)'],
    ratingNames: { bad: 'Bad', average: 'Average', good: 'Good', perfect: 'Perfect' },
  },
  pt: {
    title: 'Tabela de Pontuacao',
    express: 'Expresso (3x3)',
    classic: 'Classico (4x4)',
    expert: 'Expert (5x5)',
    columns: ['Classificacao', 'Expresso (3x3)', 'Classico (4x4)', 'Expert (5x5)'],
    ratingNames: { bad: 'Ruim', average: 'Media', good: 'Bom', perfect: 'Perfeito' },
  },
};

function formatRange(min: number, max: number): string {
  if (min === max) return `${min}`;
  return `${min} a ${max}`;
}

const RATING_ORDER: RatingId[] = ['bad', 'average', 'good', 'perfect'];

export default function ScoringTable({ lang, highlightedRatingId = null }: Props) {
  const t = ui[lang];
  const gridSizes = [3, 4, 5];

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr>
          <th
            scope="col"
            className="text-left px-3 py-2 bg-bg-primary border border-border font-display font-bold text-text-primary"
          >
            {t.columns[0]}
          </th>
          {gridSizes.map(size => (
            <th
              key={size}
              scope="col"
              className="px-3 py-2 bg-bg-primary border border-border text-center font-mono-label font-bold text-accent-light"
            >
              {size === 3 ? t.express : size === 4 ? t.classic : t.expert}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {RATING_ORDER.map(ratingId => {
          const isHighlighted = highlightedRatingId === ratingId;
          const rowAccent = RATING_COLOR_TOKENS[ratingId];
          return (
            <tr
              key={ratingId}
              className={
                isHighlighted
                  ? 'bg-success/10 border-2 border-accent-light'
                  : 'border border-border'
              }
            >
              <th
                scope="row"
                className={`px-3 py-2.5 text-left font-semibold border border-border ${
                  isHighlighted ? 'bg-accent-light/10 text-accent-light' : 'bg-bg-card text-text-primary'
                }`}
              >
                <span aria-hidden="true" style={{ color: rowAccent }}>
                  {RATING_THRESHOLDS_BY_GRID[3].find(level => level.id === ratingId)?.emoji}
                </span>{' '}
                {t.ratingNames[ratingId]}
              </th>
              {gridSizes.map(size => {
                const threshold = RATING_THRESHOLDS_BY_GRID[size].find(
                  level => level.id === ratingId,
                );
                return (
                  <td
                    key={size}
                    className={`px-3 py-2.5 text-center border border-border ${
                      isHighlighted ? 'bg-success/10 text-success font-bold' : 'bg-bg-card text-text-secondary'
                    }`}
                  >
                    {threshold ? formatRange(threshold.min, threshold.max) : '—'}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
