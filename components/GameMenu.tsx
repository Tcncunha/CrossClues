'use client';

import { useState } from 'react';

interface Props {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (name: string, code: string) => void;
  error: string | null;
}

export default function GameMenu({ onCreateRoom, onJoinRoom, error }: Props) {
  const [name, setName] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [code, setCode] = useState('');

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent mb-2">
          Entre Linhas
        </h1>
        <p className="text-text-secondary">Jogo de Deducao Palavras</p>
      </div>

      <div className="w-full bg-bg-card rounded-card p-8 border border-border shadow-lg">
        <div className="mb-5">
          <label className="block text-sm text-text-secondary font-medium mb-2">Seu Nome</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Digite seu nome"
            maxLength={15}
            className="w-full px-4 py-3 bg-bg-primary border-2 border-border rounded-cell text-text-primary text-base outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <button
            onClick={() => onCreateRoom(name)}
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            Criar Sala
          </button>
          <button
            onClick={() => setShowJoin(!showJoin)}
            className="w-full py-3 bg-transparent text-accent-light border-2 border-accent font-semibold rounded-cell hover:bg-accent/15 transition-all"
          >
            Entrar com Codigo
          </button>
        </div>

        {showJoin && (
          <div className="border-t border-border pt-5">
            <div className="mb-4">
              <label className="block text-sm text-text-secondary font-medium mb-2">Codigo da Sala</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4 digitos"
                maxLength={4}
                className="w-full px-4 py-3 bg-bg-primary border-2 border-border rounded-cell text-text-primary text-base outline-none focus:border-accent transition-colors"
              />
            </div>
            <button
              onClick={() => onJoinRoom(name, code)}
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-cell transition-all hover:-translate-y-0.5"
            >
              Entrar
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
