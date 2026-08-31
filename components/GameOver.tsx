'use client';

import { Room, Lang } from '@/app/page';
import ScoringTable from '@/components/ScoringTable';
import { getRatingForResult, RATING_COLOR_TOKENS } from '@/lib/rules';

interface Props {
  room: Room;
  playerId: string;
  onRestart: () => void;
  onBackToMenu: () => void;
  lang: Lang;
}

const ui = {
  en: {
    title: 'Game Over!',
    ratingLabel: 'Team Rating',
    cells: 'cells',
    ratingNames: { bad: 'Bad', average: 'Average', good: 'Good', perfect: 'Perfect' },
    ratingHints: {
      bad: 'You barely knew each other',
      average: 'A basic connection',
      good: 'A strong connection',
      perfect: 'A collective mind!',
    },
    grid: 'Final Grid',
    playAgain: 'Deal Again',
    backToMenu: 'Back to Menu',
  },
  pt: {
    title: 'Fim de Jogo!',
    ratingLabel: 'Classificacao da Equipe',
    cells: 'celulas',
    ratingNames: { bad: 'Ruim', average: 'Media', good: 'Bom', perfect: 'Perfeito' },
    ratingHints: {
      bad: 'Voce mal se entendeu',
      average: 'Uma conexao basica',
      good: 'Uma conexao forte',
      perfect: 'Uma mente coletiva!',
    },
    grid: 'Grade Final',
    playAgain: 'Jogar Novamente',
    backToMenu: 'Voltar ao Menu',
  },
};

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || '??';
}

export default function GameOver({ room, playerId, onRestart, onBackToMenu, lang }: Props) {
  const t = ui[lang];
  const sorted = room.players
    .map(p => ({ ...p, score: room.scores[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const medals = ['🥇', '🥈', '🥉'];
  const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, room.gridSize);
  const totalRevealed = room.grid.flat().filter(c => c.revealed).length;
  const totalCells = room.gridSize * room.gridSize;
  const rating = getRatingForResult(room.gridSize, totalRevealed);

  return (
    <div className="flex flex-col items-center animate-rise-in">
      <div className="w-full bg-bg-card rounded-card p-8 border border-border shadow-2xl shadow-black/40">
        <h2 className="font-display text-2xl font-extrabold text-center text-shimmer mb-6">
          {t.title}
        </h2>

        {/* Team rating classification */}
        <div
          className="mb-6 p-4 rounded-cell border-2 text-center"
          style={{ borderColor: RATING_COLOR_TOKENS[rating.id], backgroundColor: `${RATING_COLOR_TOKENS[rating.id]}1a` }}
          aria-label={`${t.ratingLabel}: ${t.ratingNames[rating.id]}`}
        >
          <div className="text-4xl mb-1" aria-hidden="true">{rating.emoji}</div>
          <div className="font-display font-extrabold text-xl" style={{ color: RATING_COLOR_TOKENS[rating.id] }}>
            {t.ratingNames[rating.id]}
          </div>
          <div className="text-sm mt-1" style={{ color: RATING_COLOR_TOKENS[rating.id] }}>
            {t.ratingHints[rating.id]}
          </div>
          <div className="mt-2 text-text-secondary text-sm font-mono-label">
            {totalRevealed}/{totalCells} {t.cells}
          </div>
        </div>

        <div className="mb-6 space-y-2">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-cell ${i === 0 ? 'border-2 border-accent-light bg-accent-light/10' : 'bg-bg-primary border border-border'}`}
            >
              <span className="text-xl w-8 text-center">{medals[i] ?? `${i + 1}º`}</span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono-label font-bold text-paper shrink-0"
                style={{ background: p.color }}
              >
                {initials(p.name)}
              </div>
              <span className="flex-1 font-semibold">{p.name}</span>
              <span className="text-lg font-display font-bold text-accent-light">{p.score} pts</span>
            </div>
          ))}
        </div>

        {/* Full scoring reference */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-text-muted font-semibold text-center mb-3">
            {t.ratingLabel}
          </h3>
          <div className="overflow-x-auto">
            <ScoringTable lang={lang} highlightedRatingId={rating.id} />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-text-muted font-semibold text-center mb-3">
            {t.grid} · {totalRevealed}/{totalCells} {t.cells}
          </h3>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1 mx-auto" style={{ gridTemplateColumns: `minmax(64px, 90px) repeat(${room.gridSize}, minmax(56px, 80px))` }}>
              <div />
              {room.cols.map((word, j) => (
                <div key={`col-${j}`} className="flex flex-col items-center justify-center p-1 bg-bg-secondary rounded-cell border border-border">
                  <span className="text-accent-light font-mono-label font-bold text-[0.6rem]">{colLetters[j]}</span>
                  <span className="text-text-secondary text-[0.5rem] font-medium leading-tight text-center">{word}</span>
                </div>
              ))}
              {room.rows.map((rowWord, i) => (
                <div key={`row-${i}`} className="contents">
                  <div className="flex items-center gap-1 justify-center p-1 bg-bg-secondary rounded-cell border border-border">
                    <span className="text-accent-light font-mono-label font-bold text-[0.6rem]">{i + 1}</span>
                    <span className="text-text-secondary text-[0.5rem] font-medium leading-tight">{rowWord}</span>
                  </div>
                  {room.cols.map((_, j) => {
                    const cell = room.grid[i][j];
                    return (
                      <div
                        key={`cell-${i}-${j}`}
                        className="flex flex-col items-center justify-center p-1 bg-paper paper-grain rounded-cell border border-success/50"
                      >
                        {cell.clue && (
                          <span className="text-warning font-semibold text-[0.7rem]">{cell.clue}</span>
                        )}
                        <span className="text-ink text-[0.5rem] font-semibold mt-0.5">
                          {cell.rowWord} × {cell.colWord}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {room.host === playerId && (
            <button
              onClick={onRestart}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-paper font-display font-bold rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-black/20"
            >
              {t.playAgain}
            </button>
          )}
          <button
            onClick={onBackToMenu}
            className="w-full py-3 bg-transparent text-accent-light border-2 border-accent-light/60 font-display font-bold rounded-cell hover:bg-accent-light/10 transition-all"
          >
            {t.backToMenu}
          </button>
        </div>
      </div>
    </div>
  );
}
