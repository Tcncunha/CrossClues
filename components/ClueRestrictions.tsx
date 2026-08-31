'use client';

import { useState } from 'react';
import type { Lang } from '@/app/page';

interface Props {
  lang: Lang;
  /** Compact layout for embedding inside floating panels (defaults to full list). */
  compact?: boolean;
}

const ui = {
  en: {
    label: 'Clue rules',
    intro: 'Your one-word clue cannot be:',
    rules: [
      'A word from the same family or root as either keyword',
      'A made-up word or a direct translation',
      'An abbreviation (e.g. NGO, CPU)',
      'A number',
      'A proper name',
      'A compound word (e.g. umbrella)',
    ],
    toggleOpen: 'What is not allowed?',
    toggleClose: 'Hide clue rules',
  },
  pt: {
    label: 'Regras da dica',
    intro: 'Sua dica de uma palavra nao pode ser:',
    rules: [
      'Palavra da mesma familia ou raiz de qualquer palavra-chave',
      'Palavra inventada ou traducao direta',
      'Sigla (ex: ONG, CPU)',
      'Numero',
      'Nome proprio',
      'Palavra composta (ex: guarda-chuva)',
    ],
    toggleOpen: 'O que nao pode?',
    toggleClose: 'Ocultar regras da dica',
  },
};

export default function ClueRestrictions({ lang, compact = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const t = ui[lang];

  const ruleList = (
    <ul className={compact ? 'space-y-1.5' : 'space-y-2.5'}>
      {t.rules.map(rule => (
        <li key={rule} className="flex gap-2 items-start">
          <span aria-hidden="true" className="text-error font-bold mt-0.5 text-xs">✕</span>
          <span className="text-text-secondary text-xs leading-snug">{rule}</span>
        </li>
      ))}
    </ul>
  );

  if (!compact) {
    return (
      <div className="p-4 bg-bg-primary border border-border rounded-cell">
        <h3 className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-2 flex items-center gap-2">
          <span aria-hidden="true">🚫</span>
          {t.label}
        </h3>
        <p className="text-text-secondary text-xs mb-2">{t.intro}</p>
        {ruleList}
      </div>
    );
  }

  return (
    <div className="mt-3 bg-bg-primary rounded-cell border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <span className="flex items-center gap-2 font-medium">
          <span aria-hidden="true">🚫</span>
          {t.label}
        </span>
        <span aria-hidden="true" className="text-accent-light font-bold">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && (
        <div className="px-3 pb-3 animate-fade-in">
          <p className="text-text-secondary text-xs mb-2">{t.intro}</p>
          {ruleList}
        </div>
      )}
    </div>
  );
}
