'use client';

import { useState } from 'react';
import { Lang } from '@/app/page';
import RulesPage from '@/components/RulesPage';

interface Props {
  onPlay: () => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
}

type Tab = 'home' | 'howto' | 'tips' | 'rules';

const content = {
  en: {
    subtitle: 'A Word Deduction Game',
    play: 'Sit Down to Play',
    tabs: { home: 'Home', howto: 'How to Play', tips: 'Tips' },
    overview: 'CrossClues is a real-time multiplayer word game where players take turns giving clues to help others identify cells on a crossword-style grid.',
    objective: 'Objective',
    objectiveText: 'Reveal all cells on the grid by correctly guessing which intersection each clue refers to.',
    steps: [
      { title: 'The Clue Giver', text: 'One player is chosen as the Clue Giver each turn. They see two intersecting words at each empty cell and must provide a single-word clue that connects both words.' },
      { title: 'The Clue', text: 'The Clue Giver picks an empty cell and types one word that hints at both the row word and column word crossing at that cell.' },
      { title: 'The Guess', text: 'Other players see the clue and must figure out which cell on the grid it refers to. They click the cell they think matches.' },
      { title: 'Scoring', text: 'Correct guess: +1 point. Wrong guess: the clue is discarded and play moves to the next player.' },
    ],
    gameEnds: 'The game ends when all cells are revealed. The player with the most points wins!',
    tip: 'Choose words that create strong associations with both intersecting words. The best clues make others think "of course!"',
    tipLabel: 'Pro tip:',
    difficultyTitle: 'Difficulty Levels',
    difficultyDesc: 'Easy uses simple 3-letter words. Medium uses common 5-letter words. Hard uses advanced vocabulary.',
    gridSizeTitle: 'Grid Size',
    gridSizeDesc: 'Choose 3x3, 4x4, or 5x5. Larger grids mean more cells and longer games.',
    playersTitle: 'Players',
    playersDesc: '2 to 6 players. One gives clues while the others guess. Roles rotate each turn.',
    rolesTitle: 'Roles',
    rolesDesc: 'Clue Giver: provides one-word hints. Guessers: try to identify the correct cell. Roles rotate every turn.',
  },
  pt: {
    subtitle: 'Um Jogo de Deducao com Palavras',
    play: 'Sentar e Jogar',
    tabs: { home: 'Inicio', howto: 'Como Jogar', tips: 'Dicas' },
    overview: 'CrossClues (Entre Linhas) e um jogo de palavras multijogador em tempo real onde os jogadores revezam dando dicas para ajudar outros a identificar celulas em uma grade estilo cruzada.',
    objective: 'Objetivo',
    objectiveText: 'Revele todas as celulas da grade acertando a qual intersecao cada dica se refere.',
    steps: [
      { title: 'O Dador de Dicas', text: 'Um jogador e escolhido como Dador de Dicas a cada turno. Ele ve duas palavras cruzadas em cada celula vazia e deve fornecer uma dica de uma palavra que conecta ambas.' },
      { title: 'A Dica', text: 'O Dador de Dicas escolhe uma celula vazia e digita uma palavra que sugere tanto a palavra da linha quanto a palavra da coluna que se cruzam naquela celula.' },
      { title: 'O Palpite', text: 'Os outros jogadores veem a dica e devem descobrir a qual celula da grade ela se refere. Eles clicam na celula que acham que corresponde.' },
      { title: 'Pontuacao', text: 'Acertou: +1 ponto. Errou: a dica e descartada e o turno passa para o proximo jogador.' },
    ],
    gameEnds: 'O jogo termina quando todas as celulas estao reveladas. O jogador com mais pontos vence!',
    tip: 'Escolha palavras que criam fortes associacoes com ambas as palavras cruzadas. As melhores dicas fazem os outros pensarem "e claro!"',
    tipLabel: 'Dica:',
    difficultyTitle: 'Niveis de Dificuldade',
    difficultyDesc: 'Facil usa palavras simples de 3 letras. Medio usa palavras comuns de 5 letras. Dificil usa vocabulario avancado.',
    gridSizeTitle: 'Tamanho da Grade',
    gridSizeDesc: 'Escolha 3x3, 4x4 ou 5x5. Grades maiores significam mais celulas e jogos mais longos.',
    playersTitle: 'Jogadores',
    playersDesc: '2 a 6 jogadores. Um da dicas enquanto os outros tentam acertar. Os papeis revezam a cada turno.',
    rolesTitle: 'Papeis',
    rolesDesc: 'Dador de Dicas: fornece dicas de uma palavra. Adivinhadores: tentam identificar a celula correta. Os papeis revezam a cada turno.',
  },
};

/** Hero mark: two crossing clue-cards meeting on the answer cell — the whole game in one image. */
function CrossingCardsMark() {
  return (
    <svg viewBox="0 0 320 170" className="w-full max-w-[280px] mx-auto" aria-hidden="true">
      <g transform="translate(60 18) rotate(-7 70 65)">
        <rect x="0" y="0" width="140" height="130" rx="12" fill="var(--color-paper)" stroke="var(--color-paper-dark)" strokeWidth="2" />
        <text x="16" y="30" fontFamily="var(--font-mono)" fontSize="13" fontWeight="600" fill="var(--color-ink-light)">A1</text>
        <text x="70" y="76" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="19" fill="var(--color-ink)">OCEAN</text>
        <text x="70" y="96" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--color-ink-light)">row clue</text>
      </g>
      <g transform="translate(120 22) rotate(6 70 65)">
        <rect x="0" y="0" width="140" height="130" rx="12" fill="var(--color-paper)" stroke="var(--color-paper-dark)" strokeWidth="2" />
        <text x="112" y="30" textAnchor="end" fontFamily="var(--font-mono)" fontSize="13" fontWeight="600" fill="var(--color-ink-light)">B1</text>
        <text x="70" y="76" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="19" fill="var(--color-ink)">STORM</text>
        <text x="70" y="96" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--color-ink-light)">col clue</text>
      </g>
      <circle cx="171" cy="88" r="16" fill="var(--color-accent-light)" stroke="var(--color-bg-primary)" strokeWidth="3" />
      <text x="171" y="93" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="13" fill="var(--color-ink)">!</text>
    </svg>
  );
}

export default function WelcomePage({ onPlay, lang, onLangChange }: Props) {
  const [tab, setTab] = useState<Tab>('home');
  const t = content[lang];

  return (
    <div className="flex flex-col items-center animate-rise-in">
      <div className="w-full bg-bg-card rounded-card border border-border shadow-2xl shadow-black/40 overflow-hidden">
        <div className="px-6 pt-8 pb-0 bg-bg-secondary">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1" />
            <div className="flex-1 flex justify-end">
              <div className="flex bg-bg-primary rounded-cell border border-border overflow-hidden font-mono-label text-xs">
                <button
                  onClick={() => onLangChange('en')}
                  className={`px-3 py-1.5 font-medium transition-colors ${lang === 'en' ? 'bg-accent text-paper' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => onLangChange('pt')}
                  className={`px-3 py-1.5 font-medium transition-colors ${lang === 'pt' ? 'bg-accent text-paper' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  PT
                </button>
              </div>
            </div>
          </div>

          <CrossingCardsMark />

          <div className="text-center mt-2 mb-6">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-shimmer">
              CrossClues
            </h1>
            <p className="text-text-secondary mt-1 text-sm tracking-wide">{t.subtitle}</p>
          </div>

          <div className="flex gap-1">
            {(['home', 'howto', 'tips', 'rules'] as Tab[]).map(key => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-t-lg border border-b-0 transition-all ${
                  tab === key
                    ? 'bg-bg-card text-accent-light border-border relative top-px'
                    : 'bg-transparent text-text-muted border-transparent hover:text-text-secondary'
                }`}
              >
                {t.tabs[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 min-h-[380px] border-t border-border">
          {tab === 'home' && (
            <div className="animate-fade-in space-y-6">
              <p className="text-text-secondary leading-relaxed">{t.overview}</p>
              <div>
                <h2 className="font-display text-lg font-bold text-text-primary mb-2">{t.objective}</h2>
                <p className="text-text-secondary leading-relaxed">{t.objectiveText}</p>
              </div>
              <div className="p-4 bg-success/10 border border-success/30 rounded-cell">
                <p className="text-success font-medium">{t.gameEnds}</p>
              </div>
            </div>
          )}

          {tab === 'rules' && (
            <RulesPage lang={lang} />
          )}

          {tab === 'howto' && (
            <div className="animate-fade-in space-y-5">
              {t.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-paper flex items-center justify-center shadow-sm">
                    <span className="font-mono-label text-ink font-bold text-sm">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-text-primary font-semibold mb-1">{step.title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'tips' && (
            <div className="animate-fade-in space-y-5">
              <div className="p-4 bg-accent-light/10 border border-accent-light/30 rounded-cell">
                <p className="text-text-secondary text-sm">
                  <span className="text-accent-light font-semibold">{t.tipLabel} </span>
                  {t.tip}
                </p>
              </div>
              <div>
                <h3 className="text-text-primary font-semibold mb-1">{t.difficultyTitle}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{t.difficultyDesc}</p>
              </div>
              <div>
                <h3 className="text-text-primary font-semibold mb-1">{t.gridSizeTitle}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{t.gridSizeDesc}</p>
              </div>
              <div>
                <h3 className="text-text-primary font-semibold mb-1">{t.playersTitle}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{t.playersDesc}</p>
              </div>
              <div>
                <h3 className="text-text-primary font-semibold mb-1">{t.rolesTitle}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{t.rolesDesc}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onPlay}
            className="w-full py-4 bg-accent hover:bg-accent-hover text-paper font-display font-bold text-lg rounded-cell transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-black/30"
          >
            {t.play}
          </button>
        </div>
      </div>
    </div>
  );
}
