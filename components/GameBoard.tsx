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
  onDrawCard: () => void;
  onPassTurn: () => void;
  onLeaveRoom: () => void;
  drawnCard: { row: number; col: number; label: string; rowWord: string; colWord: string } | null;
  isClueGiver: boolean;
  getMyIndex: () => number;
  lang: 'en' | 'pt';
  error?: string | null;
}

const ui = {
  en: {
    room: 'Table',
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
    drawCard: 'Draw a Card',
    passTurn: 'Pass',
    exit: 'Exit',
    cardAssigned: 'Your card',
    clickCellAssigned: 'Click the highlighted cell to give your clue',
    deckRemaining: 'Cards left in deck:',
  },
  pt: {
    room: 'Mesa',
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
    drawCard: 'Comprar Carta',
    passTurn: 'Passar',
    exit: 'Sair',
    cardAssigned: 'Sua carta',
    clickCellAssigned: 'Clique na celula destacada para dar sua dica',
    deckRemaining: 'Cartas restantes no baralho:',
  },
};

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || '??';
}

export default function GameBoard({ room, playerId, selectedClueCell, onSelectCell, onSubmitClue, onGuessCell, onDrawCard, onPassTurn, onLeaveRoom, drawnCard, isClueGiver, getMyIndex, lang, error }: Props) {
  const [clueInput, setClueInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const t = ui[lang];

  const currentPlayer = room.players[room.currentTurn];
  const isMyTurn = currentPlayer?.id === playerId;
  const hasActiveClue = room.currentClue != null;

  const waitingForDraw = isClueGiver && !hasActiveClue && !drawnCard && !selectedClueCell;
  const waitingForCellClick = isClueGiver && !hasActiveClue && drawnCard && !selectedClueCell;
  const waitingForClueInput = isClueGiver && !hasActiveClue && selectedClueCell != null;
  const showGuessPanel = !isClueGiver && hasActiveClue;

  useEffect(() => {
    if (waitingForClueInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [waitingForClueInput]);

  useEffect(() => {
    setClueInput('');
  }, [selectedClueCell, drawnCard]);

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
    <div className="flex flex-col gap-3 max-w-[700px] mx-auto pb-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-mono-label text-text-muted bg-bg-card px-2.5 py-1 rounded-md border border-border">{t.room} {room.code}</span>
        <span
          className={`text-sm font-display font-bold px-2.5 py-1 rounded-full ${isMyTurn ? 'bg-warning/20 text-warning animate-pulse-border border border-warning' : ''}`}
          style={!isMyTurn ? { color: currentPlayer?.color } : undefined}
        >
          {isMyTurn ? t.yourTurn : `${t.turnOf} ${currentPlayer?.name}`}
        </span>
        <button onClick={onLeaveRoom} className="ml-auto px-3 py-1 text-xs text-text-muted hover:text-error border border-border hover:border-error rounded-cell transition-all">
          {t.exit}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {room.players.map((p, i) => (
          <div key={p.id} className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 bg-bg-card rounded-full text-xs border ${i === room.currentTurn ? 'border-warning' : 'border-border'}`}>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono-label font-bold text-paper"
              style={{ background: p.color }}
            >
              {initials(p.name)}
            </div>
            <span>{p.name}</span>
            <span className="font-bold text-accent-light">{room.scores[p.id] || 0}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="px-3 py-2 bg-error/15 border border-error rounded-cell text-error text-xs text-center animate-shake">
          {error}
        </div>
      )}

      <div className="overflow-x-auto py-2">
        <div className="flex gap-2 items-start justify-center">
        <div className="inline-grid gap-1 mx-auto" style={{ gridTemplateColumns: `minmax(64px, 90px) repeat(${size}, minmax(56px, 80px))` }}>
          <div />
          {room.cols.map((word, j) => (
            <div key={`col-${j}`} className="flex flex-col items-center justify-center p-1 bg-bg-secondary rounded-cell border border-border min-h-[55px] md:min-h-[65px]">
              <span className="text-accent-light font-mono-label font-bold text-xs">{colLetters[j]}</span>
              <span className="text-text-secondary text-[0.6rem] font-medium leading-tight text-center">{word}</span>
            </div>
          ))}

          {room.rows.map((rowWord, i) => (
            <div key={`row-${i}`} className="contents">
              <div className="flex items-center gap-1 justify-center p-1 bg-bg-secondary rounded-cell border border-border min-h-[55px] md:min-h-[65px]">
                <span className="text-accent-light font-mono-label font-bold text-xs">{i + 1}</span>
                <span className="text-text-secondary text-[0.6rem] font-medium leading-tight">{rowWord}</span>
              </div>
              {room.cols.map((_, j) => {
                const cell = room.grid[i][j];
                const isActive = hasActiveClue && room.currentClue!.row === i && room.currentClue!.col === j;
                const isDrawnCardCell = drawnCard && drawnCard.row === i && drawnCard.col === j && !cell.revealed;
                const isClickableEmpty = waitingForCellClick && isDrawnCardCell && !cell.clue;
                const isClickableGuess = showGuessPanel && !cell.revealed;

                let cellClass = 'relative flex flex-col items-center justify-center p-1 rounded-cell border-2 min-h-[55px] md:min-h-[65px] transition-all text-center';

                if (cell.revealed) {
                  cellClass += ' bg-paper paper-grain border-success';
                } else if (isActive) {
                  cellClass += ' bg-bg-cell border-warning animate-pulse-border';
                } else if (isDrawnCardCell) {
                  cellClass += ' bg-accent-light/10 border-accent-light animate-pulse-border';
                } else {
                  cellClass += ' bg-bg-cell border-transparent';
                }

                if (isClickableEmpty || isClickableGuess) {
                  cellClass += ' cursor-pointer hover:bg-bg-cell-hover hover:border-accent-light hover:scale-105';
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
                    <span className="absolute top-0.5 left-1 text-[0.45rem] font-mono-label text-text-muted opacity-60">
                      {!cell.revealed && getCellLabel(i, j)}
                    </span>
                    {cell.revealed ? (
                      <>
                        <span className="text-ink text-[0.5rem] font-semibold">{cell.rowWord}</span>
                        <span className="text-ink-light text-[0.45rem]">× {cell.colWord}</span>
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
        {showGuessPanel && room.currentClue && (
          <div className="flex flex-col gap-1 shrink-0 mt-1">
            <span className="text-[0.55rem] font-mono-label text-text-muted uppercase tracking-wider mb-1 text-center">{lang === 'en' ? 'Select cell' : 'Selecionar'}</span>
            {(() => {
              const cells: { row: number; col: number; label: string; hasClue: boolean }[] = [];
              for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                  const c = room.grid[i][j];
                  if (!c.revealed) {
                    cells.push({ row: i, col: j, label: getCellLabel(i, j), hasClue: !!c.clue });
                  }
                }
              }
              return cells.map(({ row, col, label, hasClue }) => (
                <button
                  key={label}
                  onClick={() => onGuessCell(row, col)}
                  className={`w-12 h-8 rounded-cell border text-xs font-mono-label font-bold transition-all ${
                    hasClue
                      ? 'bg-warning/15 border-warning/50 text-warning hover:bg-warning/30'
                      : 'bg-bg-cell border-border text-text-muted hover:bg-bg-cell-hover hover:border-accent-light hover:text-accent-light'
                  }`}
                >
                  {label}
                </button>
              ));
            })()}
          </div>
        )}
        </div>
      </div>

      {waitingForDraw && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3">
          <div className="max-w-lg mx-auto bg-bg-card border-2 border-accent-light/60 rounded-card p-5 shadow-2xl shadow-black/50">
            <h3 className="font-display text-sm font-bold mb-2 text-accent-light">{t.yourClueTurn}</h3>
            <p className="text-text-secondary text-xs mb-3 font-mono-label">{t.deckRemaining} {room.cardDeckCount}</p>
            <button onClick={onDrawCard} className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-paper font-display font-bold rounded-cell transition-all text-sm">
              {t.drawCard}
            </button>
          </div>
        </div>
      )}

      {waitingForCellClick && drawnCard && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3">
          <div className="max-w-lg mx-auto bg-bg-card border-2 border-accent-light/60 rounded-card p-5 shadow-2xl shadow-black/50">
            <h3 className="font-display text-sm font-bold mb-2 text-accent-light">{t.cardAssigned}</h3>
            <div key={`${drawnCard.row}-${drawnCard.col}`} className="animate-card-flip w-24 mx-auto mb-3 aspect-[5/7] bg-paper paper-grain grain-overlay rounded-lg shadow-lg relative flex items-center justify-center">
              <span className="absolute top-1.5 left-2 text-[0.6rem] font-mono-label font-bold text-ink-light">{drawnCard.label}</span>
              <span className="font-display text-2xl font-extrabold text-ink">{drawnCard.label}</span>
              <span className="absolute bottom-1.5 right-2 text-[0.6rem] font-mono-label font-bold text-ink-light rotate-180">{drawnCard.label}</span>
            </div>
            <p className="text-text-secondary text-xs mb-3 text-center">{t.clickCellAssigned}</p>
            <button onClick={onPassTurn} className="w-full px-4 py-2 bg-bg-primary hover:bg-bg-cell-hover border-2 border-border text-text-secondary font-semibold rounded-cell transition-all text-sm">
              {t.passTurn}
            </button>
          </div>
        </div>
      )}

      {waitingForClueInput && selectedClueCell && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3">
          <div className="max-w-lg mx-auto bg-bg-card border-2 border-accent-light/60 rounded-card p-5 shadow-2xl shadow-black/50">
            {drawnCard && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-text-muted">{t.cardAssigned}:</span>
                <span className="text-sm font-mono-label font-bold text-ink bg-paper px-2 py-0.5 rounded-md">{drawnCard.label}</span>
              </div>
            )}
            <h3 className="font-display text-sm font-bold mb-1 text-accent-light">{t.clueFor}</h3>
            <p className="text-lg font-bold text-accent-light mb-2">
              <span className="font-mono-label">{getCellLabel(selectedClueCell.row, selectedClueCell.col)}</span> — {selectedClueCell.rowWord} × {selectedClueCell.colWord}
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
                className="flex-1 px-3 py-2 bg-bg-primary border-2 border-border rounded-cell text-text-primary text-sm outline-none focus:border-accent-light transition-colors"
              />
              <button onClick={handleSubmit} className="px-4 py-2 bg-accent hover:bg-accent-hover text-paper font-semibold rounded-cell transition-all text-sm">
                {t.submit}
              </button>
            </div>
            <button onClick={onPassTurn} className="w-full mt-2 px-4 py-2 bg-bg-primary hover:bg-bg-cell-hover border-2 border-border text-text-secondary font-semibold rounded-cell transition-all text-xs">
              {t.passTurn}
            </button>
          </div>
        </div>
      )}

      {showGuessPanel && room.currentClue && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-3">
          <div className="max-w-lg mx-auto bg-bg-card border-2 border-warning rounded-card p-5 shadow-2xl shadow-black/50">
            <h3 className="font-display text-sm font-bold mb-1 text-warning">{t.clueReceived}</h3>
            <p className="text-lg font-bold text-warning mb-1">{room.currentClue.clue}</p>
            <p className="text-text-muted text-xs italic mb-2">{t.clueFrom} {room.currentClue.clueBy}</p>
            <p className="text-text-secondary text-xs">{t.clickCell}</p>
          </div>
        </div>
      )}
    </div>
  );
}
