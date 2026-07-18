'use client';

import { Room, Lang } from '@/app/page';

interface Props {
  room: Room;
  playerId: string;
  onRestart: () => void;
  onBackToMenu: () => void;
  lang: Lang;
}

const ui = {
  en: { title: 'Game Over!', grid: 'Final Grid', cells: 'cells', playAgain: 'Play Again', backToMenu: 'Back to Menu' },
  pt: { title: 'Fim de Jogo!', grid: 'Grade Final', cells: 'celulas', playAgain: 'Jogar Novamente', backToMenu: 'Voltar ao Menu' },
};

export default function GameOver({ room, playerId, onRestart, onBackToMenu, lang }: Props) {
  const t = ui[lang];
  const sorted = room.players
    .map(p => ({ ...p, score: room.scores[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const ranks = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];
  const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, room.gridSize);
  const totalRevealed = room.grid.flat().filter(c => c.revealed).length;
  const totalCells = room.gridSize * room.gridSize;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full bg-bg-card rounded-card p-8 border border-border shadow-lg">
        <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent mb-6">
          {t.title}
        </h2>

        <div className="mb-6">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-cell mb-2 ${i === 0 ? 'border-2 border-warning bg-warning/10' : 'bg-bg-primary'}`}
            >
              <span className="text-xl w-10 text-center">{ranks[i]}</span>
              <span className="flex-1 font-semibold">{p.name}</span>
              <span className="text-lg font-bold text-accent-light">{p.score} pts</span>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h3 className="text-sm text-text-secondary font-medium text-center mb-3">
            {t.grid} ({totalRevealed}/{totalCells} {t.cells})
          </h3>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1 mx-auto" style={{ gridTemplateColumns: `minmax(70px, 90px) repeat(${room.gridSize}, minmax(60px, 80px))` }}>
              <div />
              {room.cols.map((word, j) => (
                <div key={`col-${j}`} className="flex flex-col items-center justify-center p-1 bg-bg-card rounded-cell border border-border">
                  <span className="text-accent-light font-bold text-[0.6rem]">{colLetters[j]}</span>
                  <span className="text-text-secondary text-[0.5rem] font-medium leading-tight text-center">{word}</span>
                </div>
              ))}
              {room.rows.map((rowWord, i) => (
                <div key={`row-${i}`} className="contents">
                  <div className="flex items-center gap-1 justify-center p-1 bg-bg-card rounded-cell border border-border">
                    <span className="text-accent-light font-bold text-[0.6rem]">{i + 1}</span>
                    <span className="text-text-secondary text-[0.5rem] font-medium leading-tight">{rowWord}</span>
                  </div>
                  {room.cols.map((_, j) => {
                    const cell = room.grid[i][j];
                    return (
                      <div
                        key={`cell-${i}-${j}`}
                        className="flex flex-col items-center justify-center p-1 bg-bg-cell rounded-cell border border-success/50"
                      >
                        {cell.clue && (
                          <span className="text-warning font-semibold text-[0.7rem]">{cell.clue}</span>
                        )}
                        <span className="text-success text-[0.5rem] font-semibold mt-0.5">
                          {cell.rowWord} x {cell.colWord}
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
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {t.playAgain}
            </button>
          )}
          <button
            onClick={onBackToMenu}
            className="w-full py-3 bg-transparent text-accent-light border-2 border-accent font-semibold rounded-cell hover:bg-accent/15 transition-all"
          >
            {t.backToMenu}
          </button>
        </div>
      </div>
    </div>
  );
}
