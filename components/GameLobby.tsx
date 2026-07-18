'use client';

import { Room } from '@/app/page';
import { Lang } from '@/app/page';

interface Props {
  room: Room;
  isHost: boolean;
  playerId: string;
  onStartGame: () => void;
  onCopyCode: () => void;
  copied: boolean;
  lang: Lang;
}

const ui = {
  en: { title: 'Waiting Room', subtitle: 'Share the code with your friends', code: 'Code', players: 'Players', start: 'Start Game', waiting: 'Waiting for host to start...' },
  pt: { title: 'Sala de Espera', subtitle: 'Compartilhe o codigo com seus amigos', code: 'Codigo', players: 'Jogadores', start: 'Iniciar Partida', waiting: 'Aguardando o host iniciar...' },
};

export default function GameLobby({ room, isHost, onStartGame, onCopyCode, copied, lang }: Props) {
  const t = ui[lang];

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent mb-2">
          {t.title}
        </h1>
        <p className="text-text-secondary">{t.subtitle}</p>
      </div>

      <div className="w-full bg-bg-card rounded-card p-8 border border-border shadow-lg">
        <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-bg-primary rounded-cell">
          <span className="text-text-secondary text-sm">{t.code}:</span>
          <span className="text-2xl font-bold tracking-widest text-accent-light">{room.code}</span>
          <button onClick={onCopyCode} className="text-xl px-2 py-1 rounded hover:bg-bg-cell transition-colors" title="Copiar codigo">
            {copied ? '✅' : '📋'}
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm text-text-secondary font-medium mb-3">
            {t.players} ({room.players.length})
          </h3>
          <div className="flex flex-col gap-2">
            {room.players.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-bg-primary rounded-cell">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="flex-1 font-medium">{p.name}</span>
                {p.isHost && (
                  <span className="text-xs bg-accent px-2 py-0.5 rounded-full text-white">HOST</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          {isHost ? (
            <button
              onClick={onStartGame}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {t.start}
            </button>
          ) : (
            <p className="text-text-muted italic">{t.waiting}</p>
          )}
        </div>
      </div>
    </div>
  );
}
