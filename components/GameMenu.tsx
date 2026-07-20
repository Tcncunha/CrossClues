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
  en: { title: 'Entre Linhas', subtitle: 'Word Deduction Game', nameLabel: 'Your Name', namePlaceholder: 'Enter your name', createRoom: 'Create Room', joinCode: 'Join with Code', codeLabel: 'Room Code', codePlaceholder: '4 digits', join: 'Join' },
  pt: { title: 'Entre Linhas', subtitle: 'Jogo de Deducao Palavras', nameLabel: 'Seu Nome', namePlaceholder: 'Digite seu nome', createRoom: 'Criar Sala', joinCode: 'Entrar com Codigo', codeLabel: 'Codigo da Sala', codePlaceholder: '4 digitos', join: 'Entrar' },
};

export default function GameMenu({ onCreateRoom, onJoinRoom, error, lang }: Props) {
  const [name, setName] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState('');
  const t = ui[lang];

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent mb-2">
          {t.title}
        </h1>
        <p className="text-text-secondary">{t.subtitle}</p>
      </div>

      <div className="w-full bg-bg-card rounded-card p-8 border border-border shadow-lg">
        <div className="mb-5">
          <label className="block text-sm text-text-secondary font-medium mb-2">{t.nameLabel}</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            maxLength={15}
            className="w-full px-4 py-3 bg-bg-primary border-2 border-border rounded-cell text-text-primary text-base outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <button
            onClick={() => onCreateRoom(name)}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {t.createRoom}
          </button>
          <button
            onClick={() => setShowJoin(!showJoin)}
            className="w-full py-3 bg-transparent text-accent-light border-2 border-accent font-semibold rounded-cell hover:bg-accent/15 transition-all"
          >
            {t.joinCode}
          </button>
        </div>

        {showJoin && (
          <div className="border-t border-border pt-5">
            <div className="mb-4">
              <label className="block text-sm text-text-secondary font-medium mb-2">{t.codeLabel}</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder={t.codePlaceholder}
                maxLength={4}
                className="w-full px-4 py-3 bg-bg-primary border-2 border-border rounded-cell text-text-primary text-base outline-none focus:border-accent transition-colors"
              />
            </div>
            <button
              onClick={() => onJoinRoom(name, code)}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-cell transition-all hover:-translate-y-0.5"
            >
              {t.join}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-error/15 border border-error rounded-cell text-error text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
