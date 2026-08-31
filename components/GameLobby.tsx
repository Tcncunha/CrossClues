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
  en: {
    title: 'Waiting Room',
    subtitle: 'Share the code with your friends',
    code: 'Table Code',
    players: 'Seated',
    start: 'Deal the Cards',
    waiting: 'Waiting for the host to start...',
    minimumPlayers: 'Minimum 2 players to start',
  },
  pt: {
    title: 'Sala de Espera',
    subtitle: 'Compartilhe o codigo com seus amigos',
    code: 'Codigo da Mesa',
    players: 'Sentados',
    start: 'Distribuir as Cartas',
    waiting: 'Aguardando o host iniciar...',
    minimumPlayers: 'Minimo 2 jogadores para iniciar',
  },
};

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || '??';
}

export default function GameLobby({ room, isHost, onStartGame, onCopyCode, copied, lang }: Props) {
  const t = ui[lang];
  const hasEnoughPlayers = room.players.length >= 2;

  return (
    <div className="flex flex-col items-center animate-rise-in">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-shimmer mb-2">
          {t.title}
        </h1>
        <p className="text-text-secondary text-sm">{t.subtitle}</p>
      </div>

      <div className="w-full bg-bg-card rounded-card p-8 border border-border shadow-2xl shadow-black/40">
        <button
          onClick={onCopyCode}
          className="w-full flex items-center justify-center gap-3 mb-6 p-4 bg-paper rounded-cell shadow-inner group transition-transform hover:-translate-y-0.5"
          title="Copy code"
          aria-label={`${t.code}: ${room.code}. Click to copy`}
        >
          <span className="text-ink-light text-xs uppercase tracking-widest font-semibold">{t.code}</span>
          <span className="text-2xl font-mono-label font-bold tracking-[0.3em] text-ink">{room.code}</span>
          <span className="text-lg" aria-hidden="true">{copied ? '\u2705' : '\uD83D\uDCCB'}</span>
        </button>

        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-3">
            {t.players} &middot; {room.players.length}
          </h3>
          <div className="flex flex-col gap-2">
            {room.players.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-bg-primary rounded-cell border border-border">
                <div
                  className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-mono-label text-xs font-bold text-paper"
                  style={{ background: p.color, boxShadow: `0 0 0 3px ${p.color}33` }}
                  aria-hidden="true"
                >
                  {initials(p.name)}
                </div>
                <span className="flex-1 font-medium">{p.name}</span>
                {p.isHost && (
                  <span className="text-[0.65rem] uppercase tracking-wider bg-accent-light px-2 py-0.5 rounded-full text-ink font-bold">Host</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          {isHost ? (
            <>
              <button
                onClick={onStartGame}
                disabled={!hasEnoughPlayers}
                className="w-full py-3 bg-accent hover:bg-accent-hover text-paper font-display font-bold rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                aria-disabled={!hasEnoughPlayers}
                aria-describedby={!hasEnoughPlayers ? 'min-players-warning' : undefined}
              >
                {t.start}
              </button>
              {!hasEnoughPlayers && (
                <p id="min-players-warning" className="mt-2 text-warning text-xs font-medium" role="alert" aria-live="polite">
                  {t.minimumPlayers}
                </p>
              )}
            </>
          ) : (
            <p className="text-text-muted italic text-sm">{t.waiting}</p>
          )}
        </div>
      </div>
    </div>
  );
}
