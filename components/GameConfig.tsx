'use client';

import { useState } from 'react';
import { Lang } from '@/app/page';

interface Props {
  onConfirm: (difficulty: string, gridSize: number, wordLanguage: string) => void;
  lang: Lang;
}

const ui = {
  en: {
    title: 'Set the Table',
    difficulty: 'Difficulty',
    gridSize: 'Grid Size',
    wordLang: 'Word Language',
    create: 'Deal the Cards',
    difficulties: [
      { value: 'facil', label: 'Easy' },
      { value: 'medio', label: 'Medium' },
      { value: 'dificil', label: 'Hard' },
    ],
    languages: [
      { value: 'EN', label: 'English' },
      { value: 'PT', label: 'Portugues' },
      { value: 'ES', label: 'Espanol' },
      { value: 'PL', label: 'Polski' },
      { value: 'ZH', label: 'Chinese' },
    ],
  },
  pt: {
    title: 'Preparar a Mesa',
    difficulty: 'Dificuldade',
    gridSize: 'Tamanho da Grade',
    wordLang: 'Idioma das Palavras',
    create: 'Distribuir as Cartas',
    difficulties: [
      { value: 'facil', label: 'Facil' },
      { value: 'medio', label: 'Medio' },
      { value: 'dificil', label: 'Dificil' },
    ],
    languages: [
      { value: 'EN', label: 'Ingles' },
      { value: 'PT', label: 'Portugues' },
      { value: 'ES', label: 'Espanhol' },
      { value: 'PL', label: 'Polones' },
      { value: 'ZH', label: 'Chines' },
    ],
  },
};

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-4 py-2.5 rounded-cell text-sm font-medium border-2 transition-all ${
        selected
          ? 'border-accent-light bg-accent-light/15 text-accent-light font-semibold'
          : 'border-border bg-bg-primary text-text-secondary hover:border-text-muted'
      }`}
    >
      {children}
      {selected && (
        <span className="absolute -top-2 -right-2 w-4.5 h-4.5 rounded-full bg-accent-light text-ink text-[10px] font-bold flex items-center justify-center leading-none w-[18px] h-[18px]">
          ✓
        </span>
      )}
    </button>
  );
}

export default function GameConfig({ onConfirm, lang }: Props) {
  const [difficulty, setDifficulty] = useState('medio');
  const [gridSize, setGridSize] = useState(4);
  const [wordLanguage, setWordLanguage] = useState('EN');
  const t = ui[lang];

  return (
    <div className="flex flex-col items-center animate-rise-in">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-shimmer mb-2">
          {t.title}
        </h1>
      </div>

      <div className="w-full bg-bg-card rounded-card p-8 border border-border shadow-2xl shadow-black/40 space-y-7">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-3">{t.difficulty}</h3>
          <div className="flex gap-2">
            {t.difficulties.map(opt => (
              <Chip key={opt.value} selected={difficulty === opt.value} onClick={() => setDifficulty(opt.value)}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-3">{t.gridSize}</h3>
          <div className="flex gap-2">
            {[3, 4, 5].map(size => (
              <Chip key={size} selected={gridSize === size} onClick={() => setGridSize(size)}>
                <span className="font-mono-label">{size}×{size}</span>
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-3">{t.wordLang}</h3>
          <div className="flex gap-2 flex-wrap">
            {t.languages.map(opt => (
              <Chip key={opt.value} selected={wordLanguage === opt.value} onClick={() => setWordLanguage(opt.value)}>
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>

        <button
          onClick={() => onConfirm(difficulty, gridSize, wordLanguage)}
          className="w-full py-3 bg-accent hover:bg-accent-hover text-paper font-display font-bold rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md shadow-black/20"
        >
          {t.create}
        </button>
      </div>
    </div>
  );
}
