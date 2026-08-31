'use client';

import { useState, useRef, useEffect } from 'react';
import { Room } from '@/app/page';
import ClueRestrictions from '@/components/ClueRestrictions';
import { getValidationMessage, validateClueLocal, type ClueValidationErrorCode } from '@/lib/validation';
import ClueCard from '@/components/ClueCard';
import RoleChips from '@/components/RoleChips';
import ProgressCells from '@/components/ProgressCells';
import SelectCellDock from '@/components/SelectCellDock';
import { Lightbulb } from 'lucide-react';

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
    clickBoardHint: 'Click on the board or alongside',
    drawCard: 'Draw a Card',
    passTurn: 'Pass',
    exit: 'Exit',
    cardAssigned: 'Your card',
    clickCellAssigned: 'Click the highlighted cell to give your clue',
    deckRemaining: 'Cards left in deck:',
    cellsRevealed: 'Cells:',
    clueGiverLabel: 'Clue Giver',
    groupPlayersLabel: 'Group (Guessers)',
    groupPlayersHint: 'Only the group can guess',
    guessUsed: 'Guess used',
    lockedHint: 'Waiting for clue giver',
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
    clickBoardHint: 'Clique no tabuleiro ou ao lado',
    drawCard: 'Comprar Carta',
    passTurn: 'Passar',
    exit: 'Sair',
    cardAssigned: 'Sua carta',
    clickCellAssigned: 'Clique na celula destacada para dar sua dica',
    deckRemaining: 'Cartas restantes no baralho:',
    cellsRevealed: 'Celulas:',
    clueGiverLabel: 'Dador de Dica',
    groupPlayersLabel: 'Grupo (Adivinhadores)',
    groupPlayersHint: 'Apenas o grupo pode palpitar',
    guessUsed: 'Palpite usado',
    lockedHint: 'Aguardando dador da dica',
  },
};


export default function GameBoard({ room, playerId, selectedClueCell, onSelectCell, onSubmitClue, onGuessCell, onDrawCard, onPassTurn, onLeaveRoom, drawnCard, isClueGiver, lang, error }: Props) {
  const [clueInput, setClueInput] = useState('');
  const [clueValidationError, setClueValidationError] = useState<ClueValidationErrorCode | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = ui[lang];

  const currentPlayer = room.players[room.currentTurn];
  const isMyTurn = currentPlayer?.id === playerId;
  const hasActiveClue = room.currentClue != null;

  const waitingForDraw = isClueGiver && !hasActiveClue && !drawnCard;
  const canGiveClue = isClueGiver && !hasActiveClue && drawnCard != null;

  // US-004: Calculate team progress
  const totalCells = room.gridSize * room.gridSize;
  const revealedCells = room.grid.flat().filter(c => c.revealed).length;

  // US-008: Identify clue giver and group players
  const clueGiverPlayer = currentPlayer ?? { id: 'unknown', name: '—', color: '#999' };
  const groupPlayers = room.players.filter(p => p.id !== currentPlayer?.id);

  // Auto-select drawn card cell so input can be shown without mandatory grid click.
  // Keeps onSelectCell optional (highlight only).
  useEffect(() => {
    if (isClueGiver && drawnCard && !hasActiveClue && !selectedClueCell) {
      onSelectCell(drawnCard.row, drawnCard.col);
    }
  }, [isClueGiver, drawnCard, hasActiveClue, selectedClueCell, onSelectCell]);

  useEffect(() => {
    if (canGiveClue && inputRef.current) {
      inputRef.current.focus();
    }
  }, [canGiveClue]);

  useEffect(() => {
    setClueInput('');
    setClueValidationError(null);
  }, [selectedClueCell, drawnCard]);

  const handleSubmit = () => {
    const trimmed = clueInput.trim();
    const validationError = validateClueLocal(trimmed);
    if (validationError) {
      setClueValidationError(validationError);
      return;
    }
    if (!trimmed) return;
    // If selection hasn't propagated yet but we have a drawn card, ensure selection first
    if (!selectedClueCell && drawnCard) {
      onSelectCell(drawnCard.row, drawnCard.col);
      // small delay to let server register selection before submitting
      setTimeout(() => {
        onSubmitClue(trimmed);
      }, 250);
    } else {
      onSubmitClue(trimmed);
    }
    setClueInput('');
    setClueValidationError(null);
  };

  const size = room.gridSize;
  const colLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, size);
  const getCellLabel = (row: number, col: number) => `${colLetters[col]}${row + 1}`;

  // ClueCard derived state
  const hasRevealedClue = hasActiveClue && room.currentClue;
  const clueCardLabel = hasRevealedClue ? getCellLabel(room.currentClue!.row, room.currentClue!.col) : drawnCard ? drawnCard.label : '--';
  const clueCardRowWord = hasRevealedClue ? room.currentClue!.rowWord : drawnCard ? drawnCard.rowWord : '?';
  const clueCardColWord = hasRevealedClue ? room.currentClue!.colWord : drawnCard ? drawnCard.colWord : '?';
  const clueCardState: 'inHand' | 'locked' | 'revealed' = hasRevealedClue ? 'revealed' : drawnCard && isClueGiver ? 'inHand' : 'locked';

  return (
    <div className="flex flex-col gap-3 max-w-[960px] mx-auto pb-2 w-full">
      {/* Header: Room code + Turn indicator + ProgressCells */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-mono-label text-text-muted bg-bg-card px-2.5 py-1 rounded-md border border-border">{t.room} {room.code}</span>
        <span
          className={`text-sm font-display font-bold px-2.5 py-1 rounded-full ${isMyTurn ? 'bg-warning/20 text-warning animate-pulse-border border border-warning' : ''}`}
          style={!isMyTurn ? { color: currentPlayer?.color } : undefined}
        >
          {isMyTurn ? t.yourTurn : `${t.turnOf} ${currentPlayer?.name}`}
        </span>
        <ProgressCells revealed={revealedCells} total={totalCells} />
        <button onClick={onLeaveRoom} className="ml-auto px-3 py-1 text-xs text-text-muted hover:text-error border border-border hover:border-error rounded-cell transition-all" aria-label={t.exit}>
          {t.exit}
        </button>
      </div>

      {/* Role Bar via RoleChips */}
      <RoleChips clueGiver={clueGiverPlayer} groupPlayers={groupPlayers} currentTurn={currentPlayer?.id ?? ''} />

      {error && (
        <div className="px-3 py-2 bg-error/15 border border-border rounded-cell text-error text-xs text-center animate-shake" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        {/* Grid flex-1 */}
        <div className="flex-1 min-w-0 overflow-x-auto py-2 order-1">
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
                  const isActiveForGiver = isClueGiver && hasActiveClue && room.currentClue!.row === i && room.currentClue!.col === j;
                  const isDrawnCardCell = isClueGiver && drawnCard && drawnCard.row === i && drawnCard.col === j && !cell.revealed;
                  const isSelectedHighlight = isClueGiver && selectedClueCell && selectedClueCell.row === i && selectedClueCell.col === j;
                  const isClickableGuess = hasActiveClue && !cell.revealed && !isClueGiver;
                  // Optional highlight click for clue giver: clicking drawn card cell just highlights (selection already auto-done)
                  const isClickableClueHighlight = isClueGiver && !hasActiveClue && isDrawnCardCell;

                  let cellClass = 'relative flex flex-col items-center justify-center p-1 rounded-cell border-2 min-h-[55px] md:min-h-[65px] transition-all text-center';

                  if (cell.revealed) {
                    cellClass += ' bg-paper paper-grain border-success';
                  } else if (isActiveForGiver) {
                    cellClass += ' bg-warning/15 border-warning animate-pulse-border';
                  } else if (isDrawnCardCell) {
                    cellClass += ' bg-accent-light/10 border-accent-light animate-pulse-border';
                  } else if (isSelectedHighlight) {
                    cellClass += ' bg-warning/10 border-warning';
                  } else {
                    cellClass += ' bg-bg-cell border-transparent';
                  }

                  if (isClickableGuess || isClickableClueHighlight) {
                    cellClass += ' cursor-pointer hover:bg-bg-cell-hover hover:border-accent-light hover:scale-105';
                  }

                  return (
                    <div
                      key={`cell-${i}-${j}`}
                      className={cellClass}
                      onClick={() => {
                        if (isClickableClueHighlight) onSelectCell(i, j);
                        else if (isClickableGuess) onGuessCell(i, j);
                      }}
                      role={isClickableGuess || isClickableClueHighlight ? 'button' : undefined}
                      tabIndex={isClickableGuess || isClickableClueHighlight ? 0 : undefined}
                      aria-label={!cell.revealed ? getCellLabel(i, j) : undefined}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          if (isClickableClueHighlight) onSelectCell(i, j);
                          else if (isClickableGuess) onGuessCell(i, j);
                        }
                      }}
                    >
                      <span className="absolute top-0.5 left-1 text-[0.45rem] font-mono-label text-text-muted opacity-60" aria-hidden="true">
                        {!cell.revealed && getCellLabel(i, j)}
                      </span>
                      {cell.revealed ? (
                        <>
                          <span className="text-ink text-[0.5rem] font-semibold">{cell.rowWord}</span>
                          <span className="text-ink-light text-[0.45rem]">x {cell.colWord}</span>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Dock lateral inline — always visible */}
        <aside className="w-full md:w-[280px] md:min-w-[280px] max-w-full box-border overflow-hidden min-w-0 shrink-0 bg-bg-card rounded-card border border-border p-4 md:sticky md:top-[72px] flex flex-col gap-4 order-2 self-start">
          {/* ClueCard always visible */}
          <div className="flex flex-col items-center">
            <ClueCard label={clueCardLabel} rowWord={clueCardRowWord} colWord={clueCardColWord} state={clueCardState} />
            {!isClueGiver && !hasActiveClue && !drawnCard && (
              <p className="mt-2 text-[11px] text-text-muted text-center font-mono-label">{t.lockedHint}</p>
            )}
            {hasRevealedClue && (
              <p className="mt-2 text-[11px] text-success font-semibold text-center">{t.guessUsed ? '' : ''}</p>
            )}
          </div>

          {/* Waiting for draw */}
          {waitingForDraw && (
            <div className="flex flex-col gap-3" role="status" aria-label={t.yourClueTurn}>
              <h3 className="font-display text-sm font-bold text-accent-light">{t.yourClueTurn}</h3>
              <p className="text-text-secondary text-xs font-mono-label">{t.deckRemaining} {room.cardDeckCount}</p>
              <button onClick={onDrawCard} className="w-full px-4 py-3 bg-accent hover:bg-accent-hover text-paper font-display font-bold rounded-cell transition-all text-sm">
                {t.drawCard}
              </button>
            </div>
          )}

          {/* Clue input direct when isClueGiver && drawnCard */}
          {canGiveClue && (
            <div className="flex flex-col gap-2 min-w-0 max-w-full box-border overflow-hidden" role="form" aria-label={t.clueFor}>
              <h3 className="font-display text-sm font-bold text-accent-light">{t.clueFor}</h3>
              <p className="text-sm font-bold text-accent-light break-words">
                <span className="font-mono-label">{drawnCard!.label}</span> — {drawnCard!.rowWord} x {drawnCard!.colWord}
              </p>
              <p className="text-text-secondary text-xs break-words">{t.giveOneWord}</p>
              <ClueRestrictions lang={lang} compact />
              <div className="flex gap-2 items-center w-full min-w-0 overflow-hidden mt-1 max-[320px]:flex-col max-[320px]:items-stretch">
                <input
                  ref={inputRef}
                  type="text"
                  value={clueInput}
                  onChange={e => {
                    setClueInput(e.target.value);
                    if (clueValidationError) setClueValidationError(null);
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                  placeholder={t.yourClue}
                  maxLength={15}
                  aria-invalid={!!clueValidationError}
                  aria-describedby={clueValidationError ? 'clue-error' : undefined}
                  className={`flex-1 min-w-0 w-0 max-[320px]:w-full px-3 py-2 bg-bg-primary border-2 rounded-cell text-text-primary text-sm outline-none transition-colors box-border truncate ${
                    clueValidationError
                      ? 'border-error focus:border-error'
                      : 'border-border focus:border-accent-light'
                  }`}
                />
                <button onClick={handleSubmit} className="shrink-0 whitespace-nowrap min-w-[72px] max-[320px]:w-full px-4 py-2 bg-accent hover:bg-accent-hover text-paper font-semibold rounded-cell transition-all text-sm box-border">
                  {t.submit}
                </button>
              </div>
              {clueValidationError && (
                <p id="clue-error" className="mt-1 text-error text-xs text-center animate-shake" role="alert" aria-live="assertive">
                  {getValidationMessage(clueValidationError, lang)}
                </p>
              )}
              <button onClick={onPassTurn} className="w-full max-w-full box-border mt-1 px-4 py-2 bg-bg-primary hover:bg-bg-cell-hover border-2 border-border text-text-secondary font-semibold rounded-cell transition-all text-xs whitespace-nowrap overflow-hidden text-ellipsis">
                {t.passTurn}
              </button>
            </div>
          )}

          {/* Clue received banner inline in Dock */}
          {hasActiveClue && room.currentClue && (
            <div className="flex flex-col gap-2 p-3 bg-warning/10 border border-warning rounded-card" role="status" aria-label={t.clueReceived}>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />
                <h3 className="font-display text-sm font-bold text-warning">{t.clueReceived}</h3>
              </div>
              <p className="text-lg font-bold text-warning break-words">{room.currentClue.clue}</p>
              <p className="text-text-muted text-xs italic">{t.clueFrom} {room.currentClue.clueBy}</p>
              <p className="text-text-secondary text-xs">{t.clickCell} — {t.clickBoardHint}</p>
              {isClueGiver && (
                <p className="mt-1 text-warning/70 text-xs font-semibold text-center">{t.groupPlayersHint}</p>
              )}
            </div>
          )}

          {/* SelectCellDock always visible, disabled when not guessing */}
          <SelectCellDock gridSize={size} onGuess={onGuessCell} activeClue={room.currentClue} isClueGiver={isClueGiver} />
        </aside>
      </div>
    </div>
  );
}
