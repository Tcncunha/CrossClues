'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import GameMenu from '@/components/GameMenu';
import GameConfig from '@/components/GameConfig';
import GameLobby from '@/components/GameLobby';
import GameBoard from '@/components/GameBoard';
import GameOver from '@/components/GameOver';
import ResultModal from '@/components/ResultModal';
import WelcomePage from '@/components/WelcomePage';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  color: string;
}

export interface Cell {
  rowWord: string;
  colWord: string;
  clue: string | null;
  clueBy: string | null;
  revealed: boolean;
  revealedBy: string | null;
}

export interface Room {
  code: string;
  host: string;
  players: Player[];
  state: 'waiting' | 'playing' | 'finished';
  difficulty: string;
  gridSize: number;
  wordLanguage: string;
  rows: string[];
  cols: string[];
  grid: Cell[][];
  currentTurn: number;
  scores: Record<string, number>;
  cluesGiven: number;
  maxClues: number;
  currentClue: { row: number; col: number; rowWord: string; colWord: string; clue?: string; clueBy?: string } | null;
  cardDeckCount: number;
  discardPileCount: number;
  drawnCard: { row: number; col: number; label: string; rowWord: string; colWord: string } | null;
}

type Screen = 'welcome' | 'menu' | 'config' | 'lobby' | 'game' | 'gameover';
export type Lang = 'en' | 'pt';

const modalText = {
  en: { wrong: 'Wrong!', wrongDetail: 'Clue discarded. Next player!', correct: 'Correct!', correctDetail: 'You got it! +1 point', wrongPos: 'Wrong position' },
  pt: { wrong: 'Errou!', wrongDetail: 'Dica descartada. Proximo jogador!', correct: 'Correto!', correctDetail: 'Acertou! +1 ponto', wrongPos: 'Essa nao era a posicao correta' },
};
const errText = {
  en: { enterName: 'Enter your name', codeDigits: 'Code must be 4 digits' },
  pt: { enterName: 'Digite seu nome', codeDigits: 'Codigo deve ter 4 digitos' },
};

export default function GamePage() {
  const socketRef = useRef(getSocket());
  const [screen, setScreen] = useState<Screen>('welcome');
  const [lang, setLang] = useState<Lang>('en');
  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedClueCell, setSelectedClueCell] = useState<{ row: number; col: number; rowWord: string; colWord: string } | null>(null);
  const [drawnCard, setDrawnCard] = useState<{ row: number; col: number; label: string; rowWord: string; colWord: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ icon: string; title: string; detail: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const showError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }, []);

  const getMyIndex = useCallback(() => {
    if (!room || !player) return -1;
    return room.players.findIndex(p => p.id === socketRef.current.id);
  }, [room, player]);

  const isClueGiver = useCallback(() => {
    if (!room) return false;
    return room.currentTurn === getMyIndex();
  }, [room, getMyIndex]);

  useEffect(() => {
    const socket = socketRef.current;
    socket.connect();

    socket.on('room-updated', (updatedRoom: Room) => {
      setRoom(prev => {
        if (prev && prev.drawnCard && !updatedRoom.drawnCard) {
          return { ...updatedRoom, drawnCard: prev.drawnCard };
        }
        return updatedRoom;
      });
    });

    socket.on('game-started', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setScreen('game');
    });

    socket.on('clue-cell-selected', () => {});

    socket.on('clue-words', (data: { rowWord: string; colWord: string }) => {
      setSelectedClueCell(prev => prev ? { ...prev, rowWord: data.rowWord, colWord: data.colWord } : null);
      setDrawnCard(prev => prev ? { ...prev, rowWord: data.rowWord, colWord: data.colWord } : null);
    });

    socket.on('clue-given', (data: { row: number; col: number; clue: string; clueBy: string }) => {
      setRoom(prev => {
        if (!prev) return prev;
        const newGrid = prev.grid.map(r => r.map(c => ({ ...c })));
        newGrid[data.row][data.col].clue = data.clue;
        newGrid[data.row][data.col].clueBy = data.clueBy;
        return { ...prev, grid: newGrid, currentClue: { row: data.row, col: data.col, rowWord: newGrid[data.row][data.col].rowWord, colWord: newGrid[data.row][data.col].colWord, clue: data.clue, clueBy: data.clueBy }, cluesGiven: prev.cluesGiven + 1, currentTurn: prev.currentTurn };
      });
      setSelectedClueCell(null);
      setDrawnCard(null);
    });

    socket.on('cell-revealed', (data: { row: number; col: number; revealedBy: string; playerName: string; rowWord: string; colWord: string; score: number }) => {
      setRoom(prev => {
        if (!prev) return prev;
        const newGrid = prev.grid.map(r => r.map(c => ({ ...c })));
        newGrid[data.row][data.col].revealed = true;
        newGrid[data.row][data.col].revealedBy = data.revealedBy;
        return { ...prev, grid: newGrid, currentClue: null, scores: { ...prev.scores, [data.revealedBy]: data.score } };
      });
    });

    socket.on('wrong-guess', () => {
      setRoom(prev => {
        if (!prev || !prev.currentClue) return prev;
        const { row, col } = prev.currentClue;
        const newGrid = prev.grid.map(r => r.map(c => ({ ...c })));
        newGrid[row][col].clue = null;
        newGrid[row][col].clueBy = null;
        return { ...prev, grid: newGrid, currentClue: null };
      });
      const m = modalText[lang];
      setModal({ icon: '❌', title: m.wrong, detail: m.wrongDetail });
      setTimeout(() => setModal(null), 1500);
    });

    socket.on('turn-changed', (data: { currentTurn: number; currentPlayer: string }) => {
      setRoom(prev => prev ? { ...prev, currentTurn: data.currentTurn, currentClue: null } : prev);
      setSelectedClueCell(null);
      setDrawnCard(null);
    });

    socket.on('card-drawn', (data: { cardLabel: string; cardRow: number; cardCol: number; rowWord: string; colWord: string; drawnBy: string; deckCount: number }) => {
      setRoom(prev => prev ? { ...prev, cardDeckCount: data.deckCount } : prev);
      if (data.drawnBy === room?.players.find(p => p.id === socketRef.current.id)?.name) {
        setDrawnCard({ row: data.cardRow, col: data.cardCol, label: data.cardLabel, rowWord: data.rowWord, colWord: data.colWord });
      }
    });

    socket.on('turn-passed', (data: { passedBy: string; currentTurn: number; currentPlayer: string }) => {
      setRoom(prev => prev ? { ...prev, currentTurn: data.currentTurn, currentClue: null } : prev);
      setSelectedClueCell(null);
      setDrawnCard(null);
    });

    socket.on('game-finished', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setScreen('gameover');
    });

    socket.on('game-restarted', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setScreen('game');
    });

    socket.on('player-left', (data: { playerName: string; room: Room }) => {
      setRoom(data.room);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreateRoom = (name: string) => {
    if (!name) return showError(errText[lang].enterName);
    setPlayer({ id: socketRef.current.id!, name, isHost: true, color: '#e74c3c' });
    setScreen('config');
  };

  const handleJoinRoom = (name: string, code: string) => {
    if (!name) return showError(errText[lang].enterName);
    if (!code || code.length !== 4) return showError(errText[lang].codeDigits);
    socketRef.current.emit('join-room', { roomCode: code, playerName: name }, (res: any) => {
      if (res.success) {
        setRoom(res.room);
        setPlayer(res.player);
        setScreen('lobby');
      } else {
        showError(res.error);
      }
    });
  };

  const handleConfirmCreate = (difficulty: string, gridSize: number, wordLanguage: string) => {
    const name = player?.name || '';
    socketRef.current.emit('create-room', { playerName: name, difficulty, gridSize, wordLanguage }, (res: any) => {
      if (res.success) {
        setRoom(res.room);
        setPlayer(res.player);
        setScreen('lobby');
      } else {
        showError(res.error);
      }
    });
  };

  const handleStartGame = () => {
    socketRef.current.emit('start-game', (res: any) => {
      if (!res.success) showError(res.error);
    });
  };

  const handleAddTestPlayer = () => {
    socketRef.current.emit('add-test-player', (res: any) => {
      if (!res.success) showError(res.error);
    });
  };

  const handleCopyCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleSelectCell = (row: number, col: number) => {
    if (!room) return;
    if (!drawnCard) return;
    if (row !== drawnCard.row || col !== drawnCard.col) return;
    const cellData = room.grid[row][col];
    if (cellData.revealed || cellData.clue) return;
    setSelectedClueCell({ row, col, rowWord: cellData.rowWord, colWord: cellData.colWord });
    socketRef.current.emit('select-clue-cell', { row, col }, (res: any) => {
      if (!res.success) {
        showError(res.error);
        setSelectedClueCell(null);
      }
    });
  };

  const handleDrawCard = () => {
    socketRef.current.emit('draw-card', (res: any) => {
      if (!res.success) {
        showError(res.error);
      }
    });
  };

  const handlePassTurn = () => {
    socketRef.current.emit('pass-turn', (res: any) => {
      if (!res.success) {
        showError(res.error);
      }
    });
  };

  const handleSubmitClue = (clue: string) => {
    if (!clue) return;
    socketRef.current.emit('submit-clue', { clue }, (res: any) => {
      if (res.success) setSelectedClueCell(null);
      else showError(res.error);
    });
  };

  const handleGuessCell = (row: number, col: number) => {
    if (!room || isClueGiver() || !room.currentClue) return;
    const cellData = room.grid[row][col];
    if (cellData.revealed || !cellData.clue) return;
    socketRef.current.emit('guess-cell', { row, col }, (res: any) => {
      if (!res.success) return showError(res.error);
      if (res.correct) {
        const m = modalText[lang];
        setModal({ icon: '✅', title: m.correct, detail: m.correctDetail });
        setTimeout(() => setModal(null), 1500);
      } else {
        const m = modalText[lang];
        setModal({ icon: '❌', title: m.wrong, detail: m.wrongPos });
        setTimeout(() => setModal(null), 1500);
      }
    });
  };

  const handleRestart = () => {
    socketRef.current.emit('restart-game', (res: any) => {
      if (!res.success) showError(res.error);
    });
  };

  const handleBackToMenu = () => {
    socketRef.current.disconnect();
    socketRef.current = getSocket();
    socketRef.current.connect();
    setRoom(null);
    setPlayer(null);
    setSelectedClueCell(null);
    setDrawnCard(null);
    setScreen('menu');
  };

  const handleLeaveRoom = () => {
    socketRef.current.emit('leave-room', (res: any) => {
      setRoom(null);
      setPlayer(null);
      setSelectedClueCell(null);
      setDrawnCard(null);
      setScreen('menu');
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-2xl animate-fade-in">
        {screen === 'welcome' && (
          <WelcomePage onPlay={() => setScreen('menu')} lang={lang} onLangChange={setLang} />
        )}
        {screen === 'menu' && (
          <GameMenu
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            error={error}
            lang={lang}
          />
        )}
        {screen === 'config' && (
          <GameConfig onConfirm={handleConfirmCreate} lang={lang} />
        )}
        {screen === 'lobby' && room && player && (
          <GameLobby
            room={room}
            isHost={room.host === socketRef.current.id}
            playerId={socketRef.current.id!}
            onStartGame={handleStartGame}
            onCopyCode={handleCopyCode}
            onAddTestPlayer={handleAddTestPlayer}
            copied={copied}
            lang={lang}
          />
        )}
        {screen === 'game' && room && (
          <GameBoard
            room={room}
            playerId={socketRef.current.id!}
            selectedClueCell={selectedClueCell}
            onSelectCell={handleSelectCell}
            onSubmitClue={handleSubmitClue}
            onGuessCell={handleGuessCell}
            onDrawCard={handleDrawCard}
            onPassTurn={handlePassTurn}
            onLeaveRoom={handleLeaveRoom}
            drawnCard={drawnCard}
            isClueGiver={isClueGiver()}
            getMyIndex={getMyIndex}
            lang={lang}
          />
        )}
        {screen === 'gameover' && room && (
          <GameOver
            room={room}
            playerId={socketRef.current.id!}
            onRestart={handleRestart}
            onBackToMenu={handleBackToMenu}
            lang={lang}
          />
        )}
      </div>
      {modal && <ResultModal {...modal} onClose={() => setModal(null)} />}
    </div>
  );
}
