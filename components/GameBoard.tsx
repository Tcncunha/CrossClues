'use client';

import { useState, useRef, useEffect } from 'react';
import { Room } from '@/app/page';

interface Props {
  room: Room;
  playerId: string;
  selectedClueCell: { row: number; col: number; rowWord: string; colWord: string } | null;
  onSelectCell: (row: number, col: number) => void;
  onSubmitClue: (clue: string) => void;
  onGuessCell: (row: number, col: number) => void;
  isClueGiver: boolean;
  getMyIndex: () => number;
  lang: 'en' | 'pt';
}

const ui = {
  en: {
    room: 'Room',
    yourTurn: 'Your turn!',
    turnOf: 'Turn:',
    selectCell: 'Click an empty cell to give a clue',
    yourClueTurn: 'Your turn to give a clue',
    clueFor: 'Clue for:',
    giveOneWord: 'Give one word that connects both',
    yourClue: 'Your clue...',
    submit: 'Submit',
    clueReceived: 'Clue received',
    clueFrom: 'Clue from:',
    clickCell: 'Click the cell you think is the answer',
  },
  pt: {
    room: 'Sala',
    yourTurn: 'Sua vez!',
    turnOf: 'Turno de:',
    selectCell: 'Clique em uma celula vazia para dar dica',
    yourClueTurn: 'Sua vez de dar dica',
    clueFor: 'Dica para:',
    giveOneWord: 'De uma unica palavra que conecte as duas',
    yourClue: 'Sua dica...',
    submit: 'Enviar',
    clueReceived: 'Dica recebida',
    clueFrom: 'Dica de:',
    clickCell: 'Clique na celula que voce acredita ser a resposta',
  },
};

export default function GameBoard({ room, playerId, selectedClueCell, onSelectCell, onSubmitClue, onGuessCell, isClueGiver, getMyIndex, lang }: Props) {
  const [clueInput, setClueInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = ui[lang];

  const currentPlayer = room.players[room.currentTurn];
  const isMyTurn = currentPlayer?.id === playerId;
  const hasActiveClue = room.currentClue != null;
  const waitingForSelection = isClueGiver && !hasActiveClue && !selectedClueCell;
  const waitingForClueInput = isClueGiver && !hasActiveClue && selectedClueCell != null;
  const showGuessPanel = !isClueGiver && hasActiveClue;

  useEffect(() => {
    if (waitingForClueInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [waitingForClueInput]);

  useEffect(() => {
    setClueInput('');
  }, [selectedClueCell]);

  const handleSubmit = () => {
    const trimmed = clueInput.trim();
    if (!trimmed) return;
    onSubmitClue(trimmed);
    setClueInput('');
  };

  const size = room.gridSize;
  const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, size);
  const getCellLabel = (row: number, col: number) => `${colLetters[col]}${row + 1}`;

  return (
    <div className="flex flex-col gap-3 max-w-[700px] mx-auto">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-text-muted bg-bg-card px-2.5 py-1 rounded-md">{t.room}: {room.code}</span>
        <span className="text-sm font-semibold" style={{ color: currentPlayer?.color }}>
          {isMyTurn ? t.yourTurn : `${t.turnOf} ${currentPlayer?.name}`}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {room.players.map((p, i) => (
          <div key={p.id} className={`flex items-center gap-1.5 px-2.5 py-1 bg-bg-card rounded-full text-xs border ${i === room.currentTurn ? 'border-accent bg-accent/20' : 'border-border'}`}>
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span>{p.name}</span>
            <span className="font-bold text-accent-light">{room.scores[p.id] || 0}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto py-2">
        <div className="inline-grid gap-1 mx-auto" style={{ gridTemplateColumns: `minmax(70px, 90px) repeat(${size}, minmax(60px, 80px))` }}>
          <div />
          {room.cols.map((word, j) => (
            <div key={`col-${j}`} className="flex flex-col items-center justify-center p-1 bg-bg-card rounded-cell border border-border min-h-[55px] md:min-h-[65px]">
              <span className="text-accent-light font-bold text-xs">{colLetters[j]}</span>
              <span className="text-text-secondary text-[0.6rem] font-medium leading-tight text-center">{word}</span>
            </div>
          ))}

          {room.rows.map((rowWord, i) => (
            <div key={`row-${i}`} className="contents">
              <div className="flex items-center gap-1 justify-center p-1 bg-bg-card rounded-cell border border-border min-h-[55px] md:min-h-[65px]">
                <span className="text-accent-light font-bold text-xs">{i + 1}</span>
                <span className="text-text-secondary text-[0.6rem] font-medium leading-tight">{rowWord}</span>
              </div>
              {room.cols.map((_, j) => {
                const cell = room.grid[i][j];
                const isActive = hasActiveClue && room.currentClue!.row === i && room.currentClue!.col === j;
                const isClickableEmpty = waitingForSelection && !cell.revealed && !cell.clue;
                const isClickableGuess = showGuessPanel && !cell.revealed && cell.clue;

                let cellClass = 'flex flex-col items-center justify-center p-1 rounded-cell border-2 min-h-[55px] md:min-h-[65px] transition-all text-center';

                if (cell.revealed) {
                  cellClass += ' bg-success/20 border-success';
                } else if (isActive) {
                  cellClass += ' bg-bg-cell border-warning animate-pulse-border';
                } else {
                  cellClass += ' bg-bg-cell border-transparent';
                }

                if (isClickableEmpty || isClickableGuess) {
                  cellClass += ' cursor-pointer hover:bg-bg-cell-hover hover:border-accent hover:scale-105';
                }

                return (
                  <div
                    key={`cell-${i}-${j}`}
                    className={cellClass}
                    onClick={() => {
                      if (isClickableEmpty) onSelectCell(i, j);
                      else if (isClickableGuess) onGuessCell(i, j);
                    }}
                  >
                    {cell.revealed ? (
                      <>
                        <span className="text-success text-[0.5rem] font-semibold">{cell.rowWord}</span>
                        <span className="text-success text-[0.45rem] opacity-70">x {cell.colWord}</span>
                      </>
                    ) : cell.clue ? (
                      <span className="text-warning font-semibold text-[0.8rem]">{cell.clue}</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {waitingForSelection && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3">
          <div className="max-w-lg mx-auto bg-bg-card border-2 border-accent rounded-card p-5 shadow-lg">
            <h3 className="text-sm font-bold mb-2 text-accent-light">{t.yourClueTurn}</h3>
            <p className="text-text-secondary text-xs">{t.selectCell}</p>
          </div>
        </div>
      )}

      {waitingForClueInput && selectedClueCell && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3">
          <div className="max-w-lg mx-auto bg-bg-card border-2 border-accent rounded-card p-5 shadow-lg">
            <h3 className="text-sm font-bold mb-1 text-accent-light">{t.clueFor}</h3>
            <p className="text-lg font-bold text-accent-light mb-2">
              {getCellLabel(selectedClueCell.row, selectedClueCell.col)} — {selectedClueCell.rowWord} x {selectedClueCell.colWord}
            </p>
            <p className="text-text-secondary text-xs mb-3">{t.giveOneWord}</p>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={clueInput}
                onChange={e => setClueInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                placeholder={t.yourClue}
                maxLength={15}
                className="flex-1 px-3 py-2 bg-bg-primary border-2 border-border rounded-cell text-text-primary text-sm outline-none focus:border-accent transition-colors"
              />
              <button onClick={handleSubmit} className="px-4 py-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-cell transition-all text-sm">
                {t.submit}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuessPanel && room.currentClue && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3">
          <div className="max-w-lg mx-auto bg-bg-card border-2 border-warning rounded-card p-5 shadow-lg">
            <h3 className="text-sm font-bold mb-1 text-warning">{t.clueReceived}</h3>
            <p className="text-lg font-bold text-warning mb-1">{room.currentClue.clue}</p>
            <p className="text-text-muted text-xs italic mb-2">{t.clueFrom} {room.currentClue.clueBy} — {getCellLabel(room.currentClue.row, room.currentClue.col)}</p>
            <p className="text-text-secondary text-xs">{t.clickCell}</p>
          </div>
        </div>
      )}
    </div>
  );
}
