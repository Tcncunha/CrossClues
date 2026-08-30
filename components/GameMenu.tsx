'use client';

import { useState } from 'react';
import { Lang } from '@/app/page';

interface Props {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (name: string, code: string) => void;
  error: string | null;
  lang: Lang;
}

const ui = {
  en: { title: 'CrossClues', subtitle: 'Word Deduction Game', nameLabel: 'Your Name', namePlaceholder: 'Enter your name', createRoom: 'Deal a New Table', joinCode: 'Join with Code', codeLabel: 'Room Code', codePlaceholder: '4 digits', join: 'Take a Seat' },
  pt: { title: 'Entre Linhas', subtitle: 'Jogo de Deducao Palavras', nameLabel: 'Seu Nome', namePlaceholder: 'Digite seu nome', createRoom: 'Montar Nova Mesa', joinCode: 'Entrar com Codigo', codeLabel: 'Codigo da Sala', codePlaceholder: '4 digitos', join: 'Sentar a Mesa' },
};

export default function GameMenu({ onCreateRoom, onJoinRoom, error, lang }: Props) {
  const [name, setName] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState('');
  const t = ui[lang];

  return (
    <div className="flex flex-col items-center animate-rise-in">
      <div className="text-center mb-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-shimmer mb-2">
          {t.title}
        </h1>
        <p className="text-text-secondary text-sm tracking-wide">{t.subtitle}</p>
      </div>

      <div className="w-full bg-bg-card rounded-card p-8 border border-border shadow-2xl shadow-black/40">
        <div className="mb-5">
          <label className="block text-sm text-text-secondary font-medium mb-2">{t.nameLabel}</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            maxLength={15}
            className="w-full px-4 py-3 bg-bg-primary border-2 border-border rounded-cell text-text-primary text-base outline-none focus:border-accent-light transition-colors placeholder:text-text-muted"
          />
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <button
            onClick={() => onCreateRoom(name)}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-paper font-display font-bold rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-black/20"
          >
            {t.createRoom}
          </button>
          <button
            onClick={() => setShowJoin(!showJoin)}
            className="w-full py-3 bg-transparent text-accent-light border-2 border-accent-light/60 font-display font-bold rounded-cell hover:bg-accent-light/10 transition-all"
          >
            {t.joinCode}
          </button>
        </div>

        {showJoin && (
          <div className="border-t border-border pt-5 animate-fade-in">
            <div className="mb-4">
              <label className="block text-sm text-text-secondary font-medium mb-2">{t.codeLabel}</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder={t.codePlaceholder}
                maxLength={4}
                className="w-full px-4 py-3 bg-bg-primary border-2 border-border rounded-cell text-text-primary text-lg font-mono-label tracking-[0.4em] text-center outline-none focus:border-accent-light transition-colors placeholder:tracking-normal placeholder:text-text-muted"
              />
            </div>
            <button
              onClick={() => onJoinRoom(name, code)}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-paper font-display font-bold rounded-cell transition-all hover:-translate-y-0.5"
            >
              {t.join}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-error/15 border border-error rounded-cell text-error text-sm text-center animate-shake">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
