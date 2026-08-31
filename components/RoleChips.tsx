'use client';

import { Megaphone, Users, Eye } from 'lucide-react';

interface PlayerIdentity {
  id: string;
  name: string;
  color?: string;
}

interface RoleChipsProps {
  clueGiver: PlayerIdentity;
  groupPlayers: PlayerIdentity[];
  currentTurn: string;
}

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || '??';
}

/**
 * RoleChips — two pill chips indicating Clue Giver and Group.
 * Spec: chips 52px tall, gap-2.5, px-3 py-2.5, border-2,
 *       w-8 h-8 avatar, stack overlap -space-x-1.5 ring-2,
 *       Megaphone for CLUE GIVER (text-warning), Users/Eye for GROUP,
 *       aria-current, animate-pulse when active turn.
 */
export default function RoleChips({ clueGiver, groupPlayers, currentTurn }: RoleChipsProps) {
  const isClueGiverTurn = currentTurn === clueGiver.id;
  const isGroupTurn = groupPlayers.some((player) => player.id === currentTurn);

  return (
    <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="Player roles">
      {/* Clue Giver chip */}
      <div
        aria-current={isClueGiverTurn ? 'true' : undefined}
        aria-label={`Clue Giver: ${clueGiver.name}${isClueGiverTurn ? ' — current turn' : ''}`}
        className={[
          'inline-flex items-center gap-2',
          'px-3 py-2.5',
          'min-h-[52px]',
          'rounded-full border-2',
          'bg-bg-card',
          'transition-all',
          isClueGiverTurn
            ? 'border-warning bg-warning/10 animate-pulse shadow-md shadow-warning/10'
            : 'border-warning/40 bg-warning/10',
        ].join(' ')}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono-label font-bold text-paper shrink-0 ring-2 ring-bg-card"
          style={{ background: clueGiver.color ?? 'var(--color-warning)' }}
          aria-hidden="true"
        >
          {initials(clueGiver.name)}
        </div>

        <Megaphone className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />

        <div className="flex flex-col leading-none">
          <span className="text-xs font-semibold text-warning truncate max-w-[90px]">{clueGiver.name}</span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-warning/70">Clue Giver</span>
        </div>
      </div>

      {/* Group chip */}
      <div
        aria-current={isGroupTurn ? 'true' : undefined}
        aria-label={`Group guessers: ${groupPlayers.map((p) => p.name).join(', ')}${isGroupTurn ? ' — current turn' : ''}`}
        className={[
          'inline-flex items-center gap-2',
          'px-3 py-2.5',
          'min-h-[52px]',
          'rounded-full border-2',
          'bg-bg-card',
          'transition-all',
          isGroupTurn
            ? 'border-success bg-success/10 animate-pulse shadow-md shadow-success/10'
            : 'border-border',
        ].join(' ')}
      >
        {/* Stacked avatars: overlap -space-x-1.5 + ring-2 */}
        <div className="flex -space-x-1.5 shrink-0" aria-hidden="true">
          {groupPlayers.length === 0 ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-bg-cell border-2 border-border ring-2 ring-bg-card">
              <Users className="w-4 h-4 text-text-muted" />
            </div>
          ) : (
            groupPlayers.slice(0, 5).map((player) => (
              <div
                key={player.id}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-mono-label font-bold text-paper ring-2 ring-bg-card border border-white/10"
                style={{ background: player.color ?? 'var(--color-accent)' }}
                title={player.name}
              >
                {initials(player.name)}
              </div>
            ))
          )}
          {groupPlayers.length > 5 && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono-label font-bold bg-bg-cell text-text-secondary ring-2 ring-bg-card border-2 border-border">
              +{groupPlayers.length - 5}
            </div>
          )}
        </div>

        {/* Icon: Users normally, Eye when it is group turn (watching/guessing) */}
        {isGroupTurn ? (
          <Eye className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
        ) : (
          <Users className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
        )}

        <div className="flex flex-col leading-none">
          <span className="text-xs font-semibold text-text-primary">
            Group
            <span className="hidden sm:inline font-normal text-text-muted"> · {groupPlayers.length} players</span>
          </span>
          <span className="text-[10px] font-bold tracking-widest uppercase text-text-muted">
            {isGroupTurn ? 'Guessing' : 'Guessers'}
          </span>
        </div>
      </div>
    </div>
  );
}
