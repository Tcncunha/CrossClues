'use client';

import { useState } from 'react';
import { Lang } from '@/app/page';

interface Props {
  onConfirm: (difficulty: string, gridSize: number, wordLanguage: string) => void;
  lang: Lang;
}

const ui = {
  en: {
    title: 'Room Settings',
    difficulty: 'Difficulty',
    gridSize: 'Grid Size',
    wordLang: 'Word Language',
    create: 'Create Room',
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
    title: 'Configuracoes da Sala',
    difficulty: 'Dificuldade',
    gridSize: 'Tamanho da Grade',
    wordLang: 'Idioma das Palavras',
    create: 'Criar Sala',
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

export default function GameConfig({ onConfirm, lang }: Props) {
  const [difficulty, setDifficulty] = useState('medio');
  const [gridSize, setGridSize] = useState(4);
  const [wordLanguage, setWordLanguage] = useState('EN');
  const t = ui[lang];

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-light to-accent bg-clip-text text-transparent mb-2">
          {t.title}
        </h1>
      </div>

      <div className="w-full bg-bg-card rounded-card p-8 border border-border shadow-lg space-y-6">
        <div>
          <h3 className="text-sm text-text-secondary font-medium mb-3">{t.difficulty}</h3>
          <div className="flex gap-2">
            {t.difficulties.map(opt => (
              <label key={opt.value} className={`flex items-center gap-2 cursor-pointer px-4 py-2 bg-bg-primary border-2 rounded-cell text-sm transition-all ${difficulty === opt.value ? 'border-accent bg-accent/15' : 'border-border'}`}>
                <input type="radio" name="difficulty" value={opt.value} checked={difficulty === opt.value} onChange={() => setDifficulty(opt.value)} className="hidden" />
                <span className={difficulty === opt.value ? 'text-accent-light font-semibold' : 'text-text-secondary'}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm text-text-secondary font-medium mb-3">{t.gridSize}</h3>
          <div className="flex gap-2">
            {[3, 4, 5].map(size => (
              <label key={size} className={`cursor-pointer px-5 py-2 bg-bg-primary border-2 rounded-cell text-sm transition-all ${gridSize === size ? 'border-accent bg-accent/15' : 'border-border'}`}>
                <input type="radio" name="gridSize" value={size} checked={gridSize === size} onChange={() => setGridSize(size)} className="hidden" />
                <span className={gridSize === size ? 'text-accent-light font-semibold' : 'text-text-secondary'}>{size}x{size}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm text-text-secondary font-medium mb-3">{t.wordLang}</h3>
          <div className="flex gap-2 flex-wrap">
            {t.languages.map(opt => (
              <label key={opt.value} className={`cursor-pointer px-4 py-2 bg-bg-primary border-2 rounded-cell text-sm transition-all ${wordLanguage === opt.value ? 'border-accent bg-accent/15' : 'border-border'}`}>
                <input type="radio" name="wordLanguage" value={opt.value} checked={wordLanguage === opt.value} onChange={() => setWordLanguage(opt.value)} className="hidden" />
                <span className={wordLanguage === opt.value ? 'text-accent-light font-semibold' : 'text-text-secondary'}>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => onConfirm(difficulty, gridSize, wordLanguage)}
          className="w-full py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          {t.create}
        </button>
      </div>
    </div>
  );
}
