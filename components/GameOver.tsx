'use client';

import { Room } from '@/app/page';

interface Props {
  room: Room;
  playerId: string;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export default function GameOver({ room, playerId, onRestart, onBackToMenu }: Props) {
  const sorted = room.players
    .map(p => ({ ...p, score: room.scores[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const ranks = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣'];

  const totalRevealed = room.grid.flat().filter(c => c.revealed).length;
  const totalCells = room.gridSize * room.gridSize;

  return (
    <div className="flex flex-col items-center">
      <div className="w-full bg-bg-card rounded-card p-8 border border-border shadow-lg">
        <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent mb-6">
          Fim de Jogo!
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
            Grade Final ({totalRevealed}/{totalCells} celulas)
          </h3>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1 mx-auto" style={{ gridTemplateColumns: `minmax(50px, 70px) repeat(${room.gridSize}, minmax(55px, 70px))` }}>
              <div className="w-full aspect-square" />
              {room.cols.map((word, j) => (
                <div key={`col-${j}`} className="flex items-center justify-center p-1 bg-bg-card rounded-cell border border-border font-bold text-accent-light text-[0.65rem]">
                  {word}
                </div>
              ))}
              {room.rows.map((rowWord, i) => (
                <div key={`row-${i}`} className="contents">
                  <div className="flex items-center justify-center p-1 bg-bg-card rounded-cell border border-border font-bold text-accent-light text-[0.65rem] aspect-square">
                    {rowWord}
                  </div>
                  {room.cols.map((_, j) => {
                    const cell = room.grid[i][j];
                    return (
                      <div
                        key={`cell-${i}-${j}`}
                        className="flex flex-col items-center justify-center p-1 bg-bg-cell rounded-cell border border-success/50 aspect-square"
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
              Jogar Novamente
            </button>
          )}
          <button
            onClick={onBackToMenu}
            className="w-full py-3 bg-transparent text-accent-light border-2 border-accent font-semibold rounded-cell hover:bg-accent/15 transition-all"
          >
            Voltar ao Menu
          </button>
        </div>
      </div>
    </div>
  );
}
