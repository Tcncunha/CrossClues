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
  rows: string[];
  cols: string[];
  grid: Cell[][];
  currentTurn: number;
  scores: Record<string, number>;
  cluesGiven: number;
  maxClues: number;
  currentClue: { row: number; col: number; rowWord: string; colWord: string; clue?: string; clueBy?: string } | null;
}

type Screen = 'welcome' | 'menu' | 'config' | 'lobby' | 'game' | 'gameover';

export default function GamePage() {
  const socketRef = useRef(getSocket());
  const [screen, setScreen] = useState<Screen>('welcome');
  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedClueCell, setSelectedClueCell] = useState<{ row: number; col: number; rowWord: string; colWord: string } | null>(null);
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

    socket.on('room-updated', (updatedRoom: Room) => setRoom(updatedRoom));

    socket.on('game-started', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setScreen('game');
    });

    socket.on('clue-cell-selected', () => {});

    socket.on('clue-words', (data: { rowWord: string; colWord: string }) => {
      setSelectedClueCell(prev => prev ? { ...prev, rowWord: data.rowWord, colWord: data.colWord } : null);
    });

    socket.on('clue-given', (data: { row: number; col: number; clue: string; clueBy: string }) => {
      setRoom(prev => {
        if (!prev) return prev;
        const newGrid = prev.grid.map(r => r.map(c => ({ ...c })));
        newGrid[data.row][data.col].clue = data.clue;
        newGrid[data.row][data.col].clueBy = data.clueBy;
        return { ...prev, grid: newGrid, currentClue: data, cluesGiven: prev.cluesGiven + 1, currentTurn: prev.currentTurn };
      });
      setSelectedClueCell(null);
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

    socket.on('wrong-guess', (data: { row: number; col: number; clueRow: number; clueCol: number; guessedBy: string; playerName: string }) => {
      setRoom(prev => {
        if (!prev) return prev;
        const newGrid = prev.grid.map(r => r.map(c => ({ ...c })));
        newGrid[data.clueRow][data.clueCol].clue = null;
        newGrid[data.clueRow][data.clueCol].clueBy = null;
        return { ...prev, grid: newGrid, currentClue: null };
      });
      setModal({ icon: '❌', title: 'Errou!', detail: 'Dica descartada. Proximo jogador!' });
      setTimeout(() => setModal(null), 1500);
    });

    socket.on('turn-changed', (data: { currentTurn: number; currentPlayer: string }) => {
      setRoom(prev => prev ? { ...prev, currentTurn: data.currentTurn, currentClue: null } : prev);
      setSelectedClueCell(null);
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
    if (!name) return showError('Digite seu nome');
    setPlayer({ id: socketRef.current.id, name, isHost: true, color: '#e74c3c' });
    setScreen('config');
  };

  const handleJoinRoom = (name: string, code: string) => {
    if (!name) return showError('Digite seu nome');
    if (!code || code.length !== 4) return showError('Codigo deve ter 4 digitos');
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

  const handleConfirmCreate = (difficulty: string, gridSize: number) => {
    const name = player?.name || '';
    socketRef.current.emit('create-room', { playerName: name, difficulty, gridSize }, (res: any) => {
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

  const handleCopyCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleSelectCell = (row: number, col: number) => {
    if (!room) return;
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
        setModal({ icon: '✅', title: 'Correto!', detail: 'Acertou! +1 ponto' });
        setTimeout(() => setModal(null), 1500);
      } else {
        setModal({ icon: '❌', title: 'Errou!', detail: 'Essa nao era a posicao correta' });
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
    setScreen('menu');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-2xl animate-fade-in">
        {screen === 'welcome' && (
          <WelcomePage onPlay={() => setScreen('menu')} />
        )}
        {screen === 'menu' && (
          <GameMenu
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            error={error}
          />
        )}
        {screen === 'config' && (
          <GameConfig onConfirm={handleConfirmCreate} />
        )}
        {screen === 'lobby' && room && player && (
          <GameLobby
            room={room}
            isHost={room.host === socketRef.current.id}
            playerId={socketRef.current.id}
            onStartGame={handleStartGame}
            onCopyCode={handleCopyCode}
            copied={copied}
          />
        )}
        {screen === 'game' && room && (
          <GameBoard
            room={room}
            playerId={socketRef.current.id}
            selectedClueCell={selectedClueCell}
            onSelectCell={handleSelectCell}
            onSubmitClue={handleSubmitClue}
            onGuessCell={handleGuessCell}
            isClueGiver={isClueGiver()}
            getMyIndex={getMyIndex}
          />
        )}
        {screen === 'gameover' && room && (
          <GameOver
            room={room}
            playerId={socketRef.current.id}
            onRestart={handleRestart}
            onBackToMenu={handleBackToMenu}
          />
        )}
      </div>
      {modal && <ResultModal {...modal} onClose={() => setModal(null)} />}
    </div>
  );
}
