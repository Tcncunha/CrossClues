'use client';

import { useState } from 'react';

interface Props {
  onConfirm: (difficulty: string, gridSize: number) => void;
}

export default function GameConfig({ onConfirm }: Props) {
  const [difficulty, setDifficulty] = useState('medio');
  const [gridSize, setGridSize] = useState(4);

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent mb-2">
          Configurar Partida
        </h1>
        <p className="text-text-secondary">Escolha as regras do jogo</p>
      </div>

      <div className="w-full bg-bg-card rounded-card p-8 border border-border shadow-lg">
        <div className="mb-6">
          <label className="block text-sm text-text-secondary font-medium mb-3">Dificuldade</label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'facil', label: 'Facil' },
              { value: 'medio', label: 'Medio' },
              { value: 'dificil', label: 'Dificil' },
            ].map(opt => (
              <label key={opt.value} className={`flex items-center gap-2 cursor-pointer px-4 py-2 bg-bg-primary border-2 rounded-cell text-sm transition-all ${difficulty === opt.value ? 'border-accent bg-accent/15' : 'border-border'}`}>
                <input type="radio" name="difficulty" value={opt.value} checked={difficulty === opt.value} onChange={() => setDifficulty(opt.value)} className="hidden" />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm text-text-secondary font-medium mb-3">Tamanho da Grade</label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: 3, label: '3x3' },
              { value: 4, label: '4x4' },
              { value: 5, label: '5x5' },
            ].map(opt => (
              <label key={opt.value} className={`flex items-center gap-2 cursor-pointer px-4 py-2 bg-bg-primary border-2 rounded-cell text-sm transition-all ${gridSize === opt.value ? 'border-accent bg-accent/15' : 'border-border'}`}>
                <input type="radio" name="grid-size" value={opt.value} checked={gridSize === opt.value} onChange={() => setGridSize(opt.value)} className="hidden" />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => onConfirm(difficulty, gridSize)}
          className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          Criar Sala
        </button>
      </div>
    </div>
  );
}
